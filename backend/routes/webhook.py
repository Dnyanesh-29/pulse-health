import os
import json
import re
import logging
from datetime import datetime, timezone

from flask import Blueprint, request, current_app
from twilio.rest import Client as TwilioClient
from langdetect import detect, LangDetectException
import google.generativeai as genai
import requests

logger = logging.getLogger(__name__)

webhook_bp = Blueprint("webhook", __name__)

# ── Gemini setup ──────────────────────────────────────────────────────────────
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
_model = genai.GenerativeModel("gemini-2.5-flash")

system_prompt = """
You are a health supply chain parser for 
India's PHC network. Extract structured data 
from PHC worker messages sent via WhatsApp/SMS.

Messages can be of these types:
1. Stock update: medicine name + quantity
   e.g. "PHC047 paracetamol 200 units"
   e.g. "ORS 500 packets PHC023"
   
2. Staff attendance: doctors/nurses count
   e.g. "PHC047 doctors 2 nurses 3"
   e.g. "2 doctors 3 nurses present today PHC047"
   
3. Bed update: available beds
   e.g. "PHC047 beds 8 available"
   e.g. "8 beds free PHC047"
   
4. Mixed: combination of above
   e.g. "PHC047 doctors 2 nurses 3 beds 8"

Return ONLY valid JSON with these fields:
{
  "phc_id": "string — PHC ID from message or 
              use sender number as fallback",
  "message_type": "stock_update | staff_update | 
                   bed_update | mixed",
  "medicine": "string or null — normalize to: 
               paracetamol/ors/antibiotics/
               ifa/zinc/calcium/other.
               NULL if no medicine mentioned",
  "quantity": "integer or null — medicine quantity.
               NULL if no medicine mentioned",
  "unit": "string or null — units/packets/
           tablets/vials. NULL if not applicable",
  "staff_doctors": "integer or null",
  "staff_nurses": "integer or null", 
  "beds_available": "integer or null",
  "confidence": "float 0-1",
  "raw_message": "original message text"
}

IMPORTANT:
- If message is about staff/beds only, 
  set medicine=null and quantity=null
- Never return 0 for staff counts — 
  use null if not mentioned
- PHC ID is usually at start or end of message
- Always return valid JSON, nothing else
"""
SYSTEM_PROMPT = system_prompt

# ── Registered Phone Numbers ──────────────────────────────────────────────────
REGISTERED_NUMBERS = [
    os.environ.get("REGISTERED_PHONE_NUMBER", "whatsapp:+91XXXXXXXXXX"),
    "whatsapp:+91XXXXXXXXXX",  # your number
    "whatsapp:+14155238886",   # Twilio sandbox
]


# Low-stock thresholds
LOW_STOCK = {"ors": 100, "paracetamol": 100}
DEFAULT_LOW = 500

# ── Helpers ───────────────────────────────────────────────────────────────────

def _detect_language(text: str) -> str:
    try:
        return detect(text)
    except LangDetectException:
        return "en"


def _translate_to_english(text: str, source_lang: str) -> str:
    """Google Cloud Translation REST API (uses ADC / GOOGLE_APPLICATION_CREDENTIALS)."""
    api_key = os.environ.get("GEMINI_API_KEY")  # reuse if same key; else add TRANSLATE_API_KEY
    url = (
        f"https://translation.googleapis.com/language/translate/v2"
        f"?key={api_key}"
    )
    resp = requests.post(url, json={
        "q": text,
        "source": source_lang,
        "target": "en",
        "format": "text",
    }, timeout=10)
    resp.raise_for_status()
    return resp.json()["data"]["translations"][0]["translatedText"]


def _parse_with_gemini(message: str, sender: str) -> dict:
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nMessage: {message}\nSender: {sender}"
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception as exc:
        logger.warning("Gemini parsing failed, using fallback: %s", exc)
        # Resilient fallback so message is never lost
        med_match = re.search(r"(paracetamol|ors|antibiotics|ifa|zinc|calcium)", message, re.IGNORECASE)
        qty_match = re.search(r"\b(\d+)\b", message)
        return {
            "phc_id": sender,
            "medicine": med_match.group(1).lower() if med_match else "other",
            "quantity": int(qty_match.group(1)) if qty_match else 0,
            "unit": "units",
            "staff_doctors": None,
            "staff_nurses": None,
            "beds_available": None,
            "message_type": "stock_update",
            "confidence": 0.5,
            "raw_message": message
        }


def _is_low_stock(medicine: str, quantity: int) -> bool:
    threshold = LOW_STOCK.get(medicine, DEFAULT_LOW)
    return quantity < threshold


def _severity(medicine: str, quantity: int) -> str:
    threshold = LOW_STOCK.get(medicine, DEFAULT_LOW)
    return "critical" if quantity < threshold // 2 else "low"


def _send_whatsapp(to: str, body: str):
    client = TwilioClient(
        os.environ["TWILIO_ACCOUNT_SID"],
        os.environ["TWILIO_AUTH_TOKEN"],
    )
    from_number = os.environ["TWILIO_WHATSAPP_NUMBER"]
    client.messages.create(from_=from_number, to=to, body=body)


def _process_message(body: str, sender: str, channel: str, verified: bool = False):
    db = current_app.db

    # Language detection & translation
    lang = _detect_language(body)
    english_body = body
    if lang != "en":
        try:
            english_body = _translate_to_english(body, lang)
        except Exception as exc:
            logger.warning("Translation failed: %s", exc)

    # Gemini parse
    parsed = _parse_with_gemini(english_body, sender)

    # Fallback phc_id
    if not parsed.get("phc_id"):
        parsed["phc_id"] = sender

    # Firestore: collection routing
    doc = {
        **parsed,
        "sender_number": sender,
        "timestamp": datetime.now(timezone.utc),
        "channel": channel,
        "original_language": lang,
        "processed": True,
        "verified": verified,
    }
    if parsed.get("message_type") == "staff_update":
        db.collection("staff_attendance").add(doc)
    else:
        db.collection("stock_updates").add(doc)

    # Alert check
    alert_msg = ""
    medicine = parsed.get("medicine", "")
    quantity = int(parsed.get("quantity") or 0)

    if medicine and _is_low_stock(medicine, quantity):
        severity = _severity(medicine, quantity)
        db.collection("alerts").add({
            "phc_id": parsed.get("phc_id"),
            "medicine": medicine,
            "quantity": quantity,
            "severity": severity,
            "district": None,
            "timestamp": datetime.now(timezone.utc),
            "resolved": False,
            "verified": verified,
        })
        alert_msg = f" LOW STOCK ALERT: {medicine} critically low ({quantity} remaining)."

    # WhatsApp reply
    phc = parsed.get('phc_id', 'unknown')
    msg_type = parsed.get("message_type", "update")
    if medicine and parsed.get("quantity") is not None:
        reply = (
            f"PULSE: Stock recorded. {medicine} {quantity} {parsed.get('unit','') or ''} "
            f"at PHC {phc}.{alert_msg}"
        )
    elif msg_type == "staff_update":
        reply = f"PULSE: Staff attendance recorded. Doctors: {parsed.get('staff_doctors', '-')}, Nurses: {parsed.get('staff_nurses', '-')} at PHC {phc}."
    elif msg_type == "bed_update":
        reply = f"PULSE: Bed status recorded. Available beds: {parsed.get('beds_available', '-')} at PHC {phc}."
    else:
        reply = f"PULSE: Update recorded at PHC {phc}."
    try:
        _send_whatsapp(sender, reply)
    except Exception as exc:
        logger.error("Twilio send failed: %s", exc)

    return reply


# ── Routes ────────────────────────────────────────────────────────────────────

@webhook_bp.route("/whatsapp", methods=["POST"])
def whatsapp():
    sender = request.form.get("From", "")
    if sender not in REGISTERED_NUMBERS:
        # Still process but tag as unverified
        # Don't reject — for demo we want all messages to work
        verified = False
    else:
        verified = True

    body = request.form.get("Body", "")
    try:
        _process_message(body, sender, "whatsapp", verified=verified)
    except Exception as exc:
        logger.exception("whatsapp webhook error: %s", exc)
    return "", 200


@webhook_bp.route("/sms", methods=["POST"])
def sms():
    sender = request.form.get("From", "")
    if sender not in REGISTERED_NUMBERS and f"whatsapp:{sender}" not in REGISTERED_NUMBERS:
        # Still process but tag as unverified
        # Don't reject — for demo we want all messages to work
        verified = False
    else:
        verified = True

    body = request.form.get("Body", "")
    try:
        _process_message(body, sender, "sms", verified=verified)
    except Exception as exc:
        logger.exception("sms webhook error: %s", exc)
    return "", 200
