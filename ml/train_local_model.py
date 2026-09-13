import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import pickle
import json
import os

os.makedirs('ml', exist_ok=True)

# Load data
df = pd.read_csv("data/processed/pulse_master_final.csv")

print(f"Dataset shape: {df.shape}")
print(f"Districts: {df['district'].nunique()}")

FEATURES = [
    'month', 'fiscal_year',
    'opd_attendance', 'inpatient_dengue',
    'inpatient_diarrhea', 'stockout_rate_pct',
    'malaria_vivax', 'malaria_falciparum',
    'dengue_rdt_positive', 'diarrhoeal_cases',
    'dengue_cases', 'malaria_cases',
    'encephalitis_cases', 'cholera_cases',
    'chikungunya_cases', 'temp_mean', 'preci_mean'
]

TARGETS = [
    'ors_demand_next_month',
    'antibiotics_demand_next_month',
    'ifa_demand_next_month'
]

# Encode district
le = LabelEncoder()
df['district_encoded'] = le.fit_transform(df['district'])
FEATURES.append('district_encoded')

# Fill nulls
df[FEATURES] = df[FEATURES].fillna(0)
df[TARGETS] = df[TARGETS].fillna(0)

models = {}
metrics = {}

for target in TARGETS:
    print(f"\n{'='*40}")
    print(f"Training: {target}")
    
    # Filter rows where target > 0
    df_target = df[df[target] > 0].copy()
    print(f"Rows with non-zero target: {len(df_target)}")
    
    if len(df_target) < 20:
        print(f"Insufficient data for {target}, skipping")
        continue
    
    X = df_target[FEATURES]
    y = df_target[target]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    model = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=4,
        random_state=42,
        subsample=0.8
    )
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    
    print(f"R² Score: {r2:.3f}")
    print(f"MAE: {mae:,.0f}")
    print(f"Test samples: {len(X_test)}")
    
    # Feature importance
    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES
    ).sort_values(ascending=False)
    print(f"\nTop 5 features:")
    print(importance.head(5).to_string())
    
    models[target] = model
    metrics[target] = {
        'r2': round(r2, 3),
        'mae': round(mae, 0),
        'train_samples': len(X_train),
        'test_samples': len(X_test)
    }

# Save models
for target, model in models.items():
    name = target.replace('_demand_next_month', '')
    path = f"ml/{name}_model.pkl"
    with open(path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\nSaved: {path}")

# Save encoder
with open('ml/district_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)
print("Saved: ml/district_encoder.pkl")

# Save feature list
with open('ml/features.json', 'w') as f:
    json.dump(FEATURES, f)
print("Saved: ml/features.json")

# Save metrics
with open('ml/model_metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("Saved: ml/model_metrics.json")

print(f"\n{'='*40}")
print("FINAL METRICS:")
for target, m in metrics.items():
    print(f"{target}:")
    print(f"  R²  = {m['r2']}")
    print(f"  MAE = {m['mae']:,.0f}")
