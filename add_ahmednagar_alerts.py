import firebase_admin
from firebase_admin import credentials, firestore
import time

cred = credentials.Certificate('backend/firebase-key.json')
try:
    firebase_admin.get_app()
except:
    firebase_admin.initialize_app(cred)

db = firestore.client()

new_alerts = [
    {
        'phc_id': 'PHC-Ahmednagar-014',
        'medicine': 'ors',
        'quantity': 35,
        'severity': 'critical',
        'district': 'Ahmednagar',
        'state': 'Maharashtra',
        'message': 'ORS critically low in tribal hamlets — gastro surge',
        'channel': 'whatsapp',
        'reported_by': 'ASHA Sunita Gaikwad',
        'resolved': False,
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Ahmednagar-008',
        'medicine': 'zinc',
        'quantity': 70,
        'severity': 'critical',
        'district': 'Ahmednagar',
        'state': 'Maharashtra',
        'message': 'Zinc tablets critically low — 2 days remaining',
        'channel': 'whatsapp',
        'reported_by': 'MO Dr. Arvind Shinde',
        'resolved': False,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
]

for a in new_alerts:
    db.collection('alerts').add(a)
    print(f"Added Ahmednagar alert: {a['phc_id']} - {a['medicine']}")
    time.sleep(0.2)

print("Done! Added Ahmednagar alerts.")
