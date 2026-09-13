import os
import json
import re
import logging

import google.generativeai as genai
from flask import Blueprint, jsonify, request, current_app

logger = logging.getLogger(__name__)
recommend_bp = Blueprint("recommend", __name__)

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
_model = genai.GenerativeModel("gemini-1.5-flash")


def _fetch_phc_snapshot(db, phc_id: str) -> dict:
    """Get latest stock entry per medicine for a PHC."""
    docs = (
        db.collection("stock_updates")
        .where("phc_id", "==", phc_id)
        .order_by("timestamp", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    snapshot: dict[str, dict] = {}
    for doc in docs:
        d = doc.to_dict()
        med = d.get("medicine")
        if med and med not in snapshot:
            snapshot[med] = {
                "quantity": d.get("quantity"),
                "unit": d.get("unit"),
                "timestamp": d.get("timestamp").isoformat() if hasattr(d.get("timestamp"), "isoformat") else None,
            }
    return snapshot


@recommend_bp.route("/", methods=["POST"])
def recommend():
    """
    Body: { "phc_id": "PHC001", "context": "dengue outbreak nearby" }
    Returns Gemini restock recommendations.
    """
    body    = request.get_json(force=True) or {}
    phc_id  = body.get("phc_id")
    context = body.get("context", "")

    if not phc_id:
        return jsonify({"error": "phc_id is required"}), 400

    db = current_app.db
    snapshot = _fetch_phc_snapshot(db, phc_id)
    alerts   = [
        doc.to_dict()
        for doc in db.collection("alerts")
        .where("phc_id", "==", phc_id)
        .where("resolved", "==", False)
        .stream()
    ]

    prompt = (
        f"You are a medical supply advisor for Indian PHC health centres.\n"
        f"PHC ID: {phc_id}\n"
        f"Current stock snapshot: {json.dumps(snapshot)}\n"
        f"Active alerts: {json.dumps(alerts, default=str)}\n"
        f"Additional context: {context}\n\n"
        f"Provide restock recommendations.\n"
        f"Return ONLY valid JSON: "
        f'{{ "phc_id": str, "recommendations": ['
        f'{{"medicine": str, "action": str, "recommended_quantity": int, "unit": str, "priority": "high/medium/low", "reason": str}}]'
        f" }}"
    )

    try:
        response = _model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        result = json.loads(raw)
    except Exception as exc:
        logger.exception("Recommendation failed: %s", exc)
        return jsonify({"error": str(exc)}), 500

    return jsonify(result), 200
