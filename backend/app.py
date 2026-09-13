import os
from flask import Flask
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Firebase Admin SDK
    cred = credentials.Certificate(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-key.json"))
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred, {
            "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        })

    app.db = firestore.client()

    # Register blueprints
    from routes.webhook import webhook_bp
    from routes.alerts import alerts_bp
    from routes.forecast import forecast_bp
    from routes.recommend import recommend_bp
    from routes.predict import predict_bp

    app.register_blueprint(webhook_bp,   url_prefix="/webhook")
    app.register_blueprint(alerts_bp,    url_prefix="/alerts")
    app.register_blueprint(forecast_bp,  url_prefix="/forecast")
    app.register_blueprint(recommend_bp, url_prefix="/recommend")
    app.register_blueprint(predict_bp,   url_prefix="/api")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8080, debug=False)
