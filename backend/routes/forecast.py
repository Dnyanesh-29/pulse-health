import os
import json
import re
import logging

import google.generativeai as genai
from flask import Blueprint, jsonify, request, current_app

logger = logging.getLogger(__name__)
forecast_bp = Blueprint("forecast", __name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
_model = genai.GenerativeModel("gemini-1.5-flash")


def _fetch_recent_stock(db, phc_id: str, medicine: str, months: int = 6) -> list[dict]:
    """Pull recent stock_updates from Firestore for a PHC + medicine."""
    docs = (
        db.collection("stock_updates")
        .where("phc_id", "==", phc_id)
        .where("medicine", "==", medicine)
        .order_by("timestamp", direction="DESCENDING")
        .limit(months)
        .stream()
    )
    records = []
    for doc in docs:
        d = doc.to_dict()
        ts = d.get("timestamp")
        records.append({
            "date": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
            "quantity": d.get("quantity"),
            "unit": d.get("unit"),
        })
    return records[::-1]  # chronological


@forecast_bp.route("/", methods=["POST"])
def forecast():
    """
    Body: { "phc_id": "PHC001", "medicine": "ors", "months_ahead": 1 }
    Returns Gemini-generated demand forecast.
    """
    body     = request.get_json(force=True) or {}
    phc_id   = body.get("phc_id")
    medicine = body.get("medicine")
    ahead    = int(body.get("months_ahead", 1))

    if not phc_id or not medicine:
        return jsonify({"error": "phc_id and medicine are required"}), 400

    db = current_app.db
    history = _fetch_recent_stock(db, phc_id, medicine)

    prompt = (
        f"You are a supply chain forecaster for Indian PHC health centres.\n"
        f"PHC ID: {phc_id}\n"
        f"Medicine: {medicine}\n"
        f"Historical stock records (chronological): {json.dumps(history)}\n"
        f"Predict demand for the next {ahead} month(s).\n"
        f"Return ONLY valid JSON: "
        f'{{ "phc_id": str, "medicine": str, "forecast": [{{"month": str, "predicted_quantity": int, "confidence": float}}] }}'
    )

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
    except Exception as exc:
        logger.exception("Forecast generation failed: %s", exc)
        return jsonify({"error": str(exc)}), 500

    return jsonify(result), 200
