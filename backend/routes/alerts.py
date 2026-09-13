from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, current_app

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/", methods=["GET"])
def list_alerts():
    """Return all unresolved alerts, optionally filtered by severity or phc_id."""
    db = current_app.db
    query = db.collection("alerts").where("resolved", "==", False)

    severity = request.args.get("severity")
    if severity:
        query = query.where("severity", "==", severity)

    phc_id = request.args.get("phc_id")
    if phc_id:
        query = query.where("phc_id", "==", phc_id)

    docs = query.stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        # Convert Firestore timestamp to ISO string
        ts = data.get("timestamp")
        if hasattr(ts, "isoformat"):
            data["timestamp"] = ts.isoformat()
        results.append(data)

    return jsonify(results), 200


@alerts_bp.route("/<alert_id>/resolve", methods=["PATCH"])
def resolve_alert(alert_id: str):
    """Mark an alert as resolved."""
    db = current_app.db
    ref = db.collection("alerts").document(alert_id)
    if not ref.get().exists:
        return jsonify({"error": "Alert not found"}), 404

    ref.update({
        "resolved": True,
        "resolved_at": datetime.now(timezone.utc),
    })
    return jsonify({"status": "resolved", "id": alert_id}), 200
