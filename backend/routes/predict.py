import pickle
import json
import numpy as np
from flask import Blueprint, jsonify, request
from pathlib import Path

predict_bp = Blueprint('predict', __name__)

# Load models on startup
ML_DIR = Path(__file__).resolve().parent.parent / 'ml'
if not (ML_DIR / 'ors_model.pkl').exists():
    ML_DIR = Path(__file__).resolve().parent.parent.parent / 'ml'

def load_models():
    models = {}
    try:
        with open(ML_DIR / 'ors_model.pkl', 'rb') as f:
            models['ors'] = pickle.load(f)
        with open(ML_DIR / 'antibiotics_model.pkl', 'rb') as f:
            models['antibiotics'] = pickle.load(f)
        with open(ML_DIR / 'district_encoder.pkl', 'rb') as f:
            models['encoder'] = pickle.load(f)
        with open(ML_DIR / 'features.json', 'r') as f:
            models['features'] = json.load(f)
        with open(ML_DIR / 'model_metrics.json', 'r') as f:
            models['metrics'] = json.load(f)
        print("Models loaded successfully")
    except Exception as e:
        print(f"Model loading error: {e}")
    return models

MODELS = load_models()

@predict_bp.route('/predict', methods=['POST'])
def predict_demand():
    data = request.get_json(force=True) or {}
    
    district = data.get('district', 'Nashik')
    
    # Encode district
    try:
        district_encoded = MODELS['encoder'].transform([district])[0]
    except Exception:
        district_encoded = 0
    
    # Build feature vector
    features = MODELS.get('features', [])
    feature_values = {
        'month': data.get('month', 9),
        'fiscal_year': data.get('fiscal_year', 1),
        'opd_attendance': data.get('opd_attendance', 150000),
        'inpatient_dengue': data.get('inpatient_dengue', 0),
        'inpatient_diarrhea': data.get('inpatient_diarrhea', 0),
        'stockout_rate_pct': data.get('stockout_rate_pct', 5),
        'malaria_vivax': data.get('malaria_vivax', 0),
        'malaria_falciparum': data.get('malaria_falciparum', 0),
        'dengue_rdt_positive': data.get('dengue_rdt_positive', 0),
        'diarrhoeal_cases': data.get('diarrhoeal_cases', 0),
        'dengue_cases': data.get('dengue_cases', 0),
        'malaria_cases': data.get('malaria_cases', 0),
        'encephalitis_cases': data.get('encephalitis_cases', 0),
        'cholera_cases': data.get('cholera_cases', 0),
        'chikungunya_cases': data.get('chikungunya_cases', 0),
        'temp_mean': data.get('temp_mean', 28.0),
        'preci_mean': data.get('preci_mean', 0.5),
        'district_encoded': district_encoded
    }
    
    X = np.array([[feature_values[f] for f in features]])
    
    predictions = {}
    
    # ORS prediction
    if 'ors' in MODELS:
        ors_pred = max(0, int(MODELS['ors'].predict(X)[0]))
        predictions['ors_demand'] = ors_pred
    
    # Antibiotics prediction
    if 'antibiotics' in MODELS:
        ab_pred = max(0, int(MODELS['antibiotics'].predict(X)[0]))
        predictions['antibiotics_demand'] = ab_pred
    
    # IFA — rule based (not ML)
    population_proxy = data.get('opd_attendance', 150000)
    predictions['ifa_demand'] = int(population_proxy * 0.15)
    
    return jsonify({
        'district': district,
        'month': data.get('month', 9),
        'predictions': predictions,
        'model': 'GradientBoosting (local)',
        'metrics': {
            'ors_r2': 0.905,
            'antibiotics_r2': 0.609,
            'ifa_method': 'rule_based'
        }
    })

@predict_bp.route('/predict/district-forecast', methods=['GET'])
def district_forecast():
    district = request.args.get('district', 'Nashik')
    
    forecasts = []
    for month_offset in range(1, 4):
        month = ((9 + month_offset - 1) % 12) + 1
        
        result = predict_demand_internal(
            district=district,
            month=month,
            opd_attendance=150000,
            dengue_cases=30 + (month_offset * 10),
            diarrhoeal_cases=80 + (month_offset * 15),
            temp_mean=28.0,
            preci_mean=0.5
        )
        forecasts.append({
            'month': month,
            'month_name': ['Jan','Feb','Mar','Apr','May',
                          'Jun','Jul','Aug','Sep','Oct',
                          'Nov','Dec'][month-1],
            'predictions': result
        })
    
    return jsonify({
        'district': district,
        'forecasts': forecasts,
        'model': 'GradientBoosting local R²=0.905'
    })

def predict_demand_internal(district, month, **kwargs):
    try:
        district_encoded = MODELS['encoder'].transform([district])[0]
    except Exception:
        district_encoded = 0
    
    features = MODELS.get('features', [])
    feature_values = {
        'month': month,
        'fiscal_year': 1,
        'opd_attendance': kwargs.get('opd_attendance', 150000),
        'inpatient_dengue': kwargs.get('inpatient_dengue', 0),
        'inpatient_diarrhea': kwargs.get('inpatient_diarrhea', 0),
        'stockout_rate_pct': kwargs.get('stockout_rate_pct', 5),
        'malaria_vivax': kwargs.get('malaria_vivax', 0),
        'malaria_falciparum': kwargs.get('malaria_falciparum', 0),
        'dengue_rdt_positive': kwargs.get('dengue_rdt_positive', 0),
        'diarrhoeal_cases': kwargs.get('diarrhoeal_cases', 0),
        'dengue_cases': kwargs.get('dengue_cases', 0),
        'malaria_cases': kwargs.get('malaria_cases', 0),
        'encephalitis_cases': kwargs.get('encephalitis_cases', 0),
        'cholera_cases': kwargs.get('cholera_cases', 0),
        'chikungunya_cases': kwargs.get('chikungunya_cases', 0),
        'temp_mean': kwargs.get('temp_mean', 28.0),
        'preci_mean': kwargs.get('preci_mean', 0.5),
        'district_encoded': district_encoded
    }
    
    X = np.array([[feature_values[f] for f in features]])
    
    ors = max(0, int(MODELS['ors'].predict(X)[0])) if 'ors' in MODELS else 0
    ab = max(0, int(MODELS['antibiotics'].predict(X)[0])) if 'antibiotics' in MODELS else 0
    ifa = int(kwargs.get('opd_attendance', 150000) * 0.15)
    
    return {
        'ors_demand': ors,
        'antibiotics_demand': ab,
        'ifa_demand': ifa
    }
