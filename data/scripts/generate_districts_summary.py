import pandas as pd
import json
import os

# Load master dataset
df = pd.read_csv("data/processed/pulse_master_final.csv")
print(f"Original dataset rows: {len(df)}, unique districts: {df['district'].nunique()}")

# 1. Filter out rows where district name equals state name
df = df[df['district'] != df['state']]
print(f"After filtering state-name rows: {df['district'].nunique()} districts")

# 2. Also filter out 'Mumbai' and 'Mumbai Suburban' (urban outliers with unreliable HMIS reporting)
df = df[~df['district'].str.strip().isin(['Mumbai', 'Mumbai Suburban'])]
print(f"After filtering Mumbai & Mumbai Suburban: {df['district'].nunique()} districts")

# Existing metadata lookup to preserve facility counts
existing_lookup = {}
primary_json = "dashboard/src/data/districts_summary.json"
if os.path.exists(primary_json):
    try:
        with open(primary_json, "r") as f:
            for item in json.load(f):
                existing_lookup[item.get("district", "").strip().lower()] = item
    except Exception as e:
        print(f"Notice: Could not load existing lookup: {e}")

# Get latest data per district (latest month reporting)
latest = df.sort_values(['district', 'month']).groupby('district').last().reset_index()

districts_data = []
for _, row in latest.iterrows():
    d_name = row['district']
    stockout = round(float(row['stockout_rate_pct']), 1)
    
    # 3. Recalibrate status thresholds:
    # Critical:  stockout_rate_pct > 30
    # At Risk:   stockout_rate_pct > 10
    # Moderate:  stockout_rate_pct > 0
    # Safe:      stockout_rate_pct == 0
    if stockout > 30:
        status = 'Critical'
    elif stockout > 10:
        status = 'At Risk'
    elif stockout > 0:
        status = 'Moderate'
    else:
        status = 'Safe'

    meta = existing_lookup.get(d_name.strip().lower(), {})
    total_phcs = meta.get('totalPhcs', 42)
    
    # Average stock days inversely correlated with stockout risk
    avg_stock = round(max(7.5, 25.5 - stockout * 0.3), 1) if stockout > 0 else 24.5

    # Derive at-risk and critical PHC counts based on calibrated status
    if status == 'Critical':
        at_risk_phcs = max(12, int(round(total_phcs * (stockout / 100) * 0.7)))
        crit_alerts = max(4, int(round(total_phcs * (stockout / 100) * 0.25)))
    elif status == 'At Risk':
        at_risk_phcs = max(5, int(round(total_phcs * (stockout / 100) * 0.75)))
        crit_alerts = max(1, int(round(total_phcs * (stockout / 100) * 0.18)))
    elif status == 'Moderate':
        at_risk_phcs = max(2, int(round(total_phcs * (stockout / 100) * 0.8)))
        crit_alerts = 0
    else:
        at_risk_phcs = 0
        crit_alerts = 0

    districts_data.append({
        'id': d_name.lower().replace(' ', '_').replace('(', '').replace(')', ''),
        'district': d_name,
        'name': d_name,
        'state': row['state'],
        'avgStockDays': avg_stock,
        'stockoutRisk': stockout,
        'opdAttendance': int(row['opd_attendance']) if row['opd_attendance'] > 0 else 0,
        'dengueRisk': int(row['dengue_rdt_positive']) if row['dengue_rdt_positive'] > 0 else 0,
        'malariaRisk': int(row['malaria_vivax'] + row['malaria_falciparum']),
        'status': status,
        'totalPhcs': total_phcs,
        'atRiskPhcs': at_risk_phcs,
        'criticalAlerts': crit_alerts
    })

# Sort table by stockout risk descending by default (highest risk districts at top)
districts_data.sort(key=lambda x: x['stockoutRisk'], reverse=True)

# Save to both locations
out_paths = [
    "data/processed/districts_summary.json",
    "dashboard/src/data/districts_summary.json"
]

for p in out_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        json.dump(districts_data, f, indent=2)
    print(f"Saved: {p} ({len(districts_data)} districts)")

# Output summary report
print("\n" + "="*50)
print("DISTRICTS SUMMARY REGENERATION REPORT")
print("="*50)
print(f"Total Active Districts: {len(districts_data)}")

status_counts = {}
for d in districts_data:
    status_counts[d['status']] = status_counts.get(d['status'], 0) + 1

print("\nStatus Breakdown:")
for st in ['Critical', 'At Risk', 'Moderate', 'Safe']:
    print(f"  {st:<10}: {status_counts.get(st, 0)} districts")

print("\nTop 10 Highest Risk Districts:")
print(f"  {'District':<22} {'State':<14} {'Stockout Risk':<15} {'Status':<10} {'Avg Days':<10} {'Monthly OPD':<12}")
print("  " + "-"*85)
for d in districts_data[:10]:
    opd_str = f"{d['opdAttendance']:,}" if d['opdAttendance'] > 0 else "—"
    print(f"  {d['district']:<22} {d['state']:<14} {d['stockoutRisk']:>5.1f}%          {d['status']:<10} {d['avgStockDays']:>5.1f}d     {opd_str:<12}")

print("="*50)
