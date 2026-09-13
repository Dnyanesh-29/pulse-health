import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import os
from pathlib import Path

# Resolve path relative to backend or root
BASE_DIR = Path(__file__).resolve().parent
KEY_PATH = BASE_DIR / 'firebase-key.json'

if not KEY_PATH.exists():
    KEY_PATH = Path('backend/firebase-key.json')

cred = credentials.Certificate(str(KEY_PATH))
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized in current runtime
    pass

db = firestore.client()

alerts = [
    {
        'phc_id': 'PHC-Nashik-047',
        'medicine': 'ors',
        'quantity': 45,
        'severity': 'critical',
        'district': 'Nashik',
        'state': 'Maharashtra',
        'message': 'ORS critically low — 1 day remaining',
        'channel': 'whatsapp',
        'resolved': False,
        'timestamp': datetime.now() - timedelta(minutes=8)
    },
    {
        'phc_id': 'PHC-Ahmednagar-023',
        'medicine': 'paracetamol',
        'quantity': 120,
        'severity': 'critical',
        'district': 'Ahmednagar',
        'state': 'Maharashtra',
        'message': 'Paracetamol critically low — 3 days remaining',
        'channel': 'sms',
        'resolved': False,
        'timestamp': datetime.now() - timedelta(minutes=24)
    },
    {
        'phc_id': 'PHC-Barmer-012',
        'medicine': 'antibiotics',
        'quantity': 280,
        'severity': 'low',
        'district': 'Barmer',
        'state': 'Rajasthan',
        'message': 'Paediatric antibiotics running low — 6 days remaining',
        'channel': 'whatsapp',
        'resolved': False,
        'timestamp': datetime.now() - timedelta(hours=1)
    }
]

for alert in alerts:
    update_time, doc_ref = db.collection('alerts').add(alert)
    print(f"Added alert [{doc_ref.id}]: {alert['phc_id']} - {alert['medicine']} ({alert['district']})")

print("Done. Check Firestore console.")
