import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

cred = credentials.Certificate('backend/firebase-key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Clear existing alerts first
alerts_ref = db.collection('alerts')
docs = alerts_ref.stream()
for doc in docs:
    doc.reference.delete()

# Add demo alerts
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
        'reported_by': 'ASHA Priya Sharma',
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
        'reported_by': 'Pharmacist Ravi Kumar',
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
        'reported_by': 'ANM Sunita Devi',
        'resolved': False,
        'timestamp': datetime.now() - timedelta(hours=1)
    }
]

for alert in alerts:
    db.collection('alerts').add(alert)
    print(f"Added: {alert['phc_id']} - {alert['medicine']}")

# Add demo stock updates
stocks = [
    {
        'phc_id': 'PHC-Nashik-047',
        'medicine': 'ors',
        'quantity': 45,
        'unit': 'packets',
        'channel': 'whatsapp',
        'sender_number': '+917249540141',
        'original_language': 'hi',
        'message_type': 'stock_update',
        'processed': True,
        'timestamp': datetime.now() - timedelta(minutes=8)
    },
    {
        'phc_id': 'PHC-Ahmednagar-023',
        'medicine': 'paracetamol',
        'quantity': 120,
        'unit': 'tablets',
        'channel': 'sms',
        'sender_number': '+919876543210',
        'original_language': 'en',
        'message_type': 'stock_update',
        'processed': True,
        'timestamp': datetime.now() - timedelta(minutes=24)
    }
]

for stock in stocks:
    db.collection('stock_updates').add(stock)
    print(f"Added stock: {stock['phc_id']} - {stock['medicine']}")

print("\nFirestore seeded successfully.")
print("Check dashboard — alerts should appear now.")
