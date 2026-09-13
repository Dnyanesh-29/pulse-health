import firebase_admin
from firebase_admin import credentials, firestore
import time

cred = credentials.Certificate('backend/firebase-key.json')
try:
    firebase_admin.get_app()
except:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Clear everything first
print("Clearing existing data...")
for collection in ['alerts', 'stock_updates']:
    docs = db.collection(collection).stream()
    for doc in docs:
        doc.reference.delete()
    print(f"Cleared {collection}")

time.sleep(1)

# Seed stock_updates
stocks = [
    {
        'phc_id': 'PHC-Nashik-047',
        'medicine': 'ors',
        'quantity': 45,
        'unit': 'packets',
        'channel': 'whatsapp',
        'sender_number': 'whatsapp:+917249540141',
        'original_language': 'hi',
        'message_type': 'stock_update',
        'district': 'Nashik',
        'state': 'Maharashtra',
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
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
        'district': 'Ahmednagar',
        'state': 'Maharashtra',
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Barmer-012',
        'medicine': 'antibiotics',
        'quantity': 280,
        'unit': 'bottles',
        'channel': 'whatsapp',
        'sender_number': 'whatsapp:+919876543211',
        'original_language': 'hi',
        'message_type': 'stock_update',
        'district': 'Barmer',
        'state': 'Rajasthan',
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Udaipur-008',
        'medicine': 'zinc',
        'quantity': 85,
        'unit': 'tablets',
        'channel': 'whatsapp',
        'sender_number': 'whatsapp:+919876543212',
        'original_language': 'hi',
        'message_type': 'stock_update',
        'district': 'Udaipur',
        'state': 'Rajasthan',
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Gadchiroli-003',
        'medicine': 'ors',
        'quantity': 60,
        'unit': 'packets',
        'channel': 'sms',
        'sender_number': '+919876543213',
        'original_language': 'mr',
        'message_type': 'stock_update',
        'district': 'Gadchiroli',
        'state': 'Maharashtra',
        'processed': True,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
]

for stock in stocks:
    db.collection('stock_updates').add(stock)
    print(f"Added stock: {stock['phc_id']} - {stock['medicine']}")
    time.sleep(0.2)

# Seed alerts
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
        'timestamp': firestore.SERVER_TIMESTAMP
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
        'timestamp': firestore.SERVER_TIMESTAMP
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
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Udaipur-008',
        'medicine': 'zinc',
        'quantity': 85,
        'severity': 'critical',
        'district': 'Udaipur',
        'state': 'Rajasthan',
        'message': 'Zinc tablets critically low — 2 days remaining',
        'channel': 'whatsapp',
        'reported_by': 'ASHA Meena Kumari',
        'resolved': False,
        'timestamp': firestore.SERVER_TIMESTAMP
    },
    {
        'phc_id': 'PHC-Gadchiroli-003',
        'medicine': 'ors',
        'quantity': 60,
        'severity': 'critical',
        'district': 'Gadchiroli',
        'state': 'Maharashtra',
        'message': 'ORS critically low in tribal area — immediate replenishment needed',
        'channel': 'sms',
        'reported_by': 'Block Health Officer',
        'resolved': False,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
]

for alert in alerts:
    db.collection('alerts').add(alert)
    print(f"Added alert: {alert['phc_id']} - {alert['medicine']}")
    time.sleep(0.2)

print(f"\nSeeding complete.")
print(f"Stock updates: {len(stocks)}")
print(f"Alerts: {len(alerts)}")
print("Refresh dashboard now.")
