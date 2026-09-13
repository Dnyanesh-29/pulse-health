import pandas as pd
import numpy as np

# -- Disease ? canonical column name mapping -----------------------------------
DISEASE_MAP = {
    "Acute Diarrhoeal Disease":          "diarrhoeal_cases",
    "Diarrhea":                           "diarrhoeal_cases",
    "Acute Gastroenteritis":             "diarrhoeal_cases",
    "Gastroenteritis":                   "diarrhoeal_cases",
    "Dengue":                            "dengue_cases",
    "Dengue Fever":                      "dengue_cases",
    "Suspected Dengue":                  "dengue_cases",
    "Dengue Chikungunya":                "dengue_cases",
    "Dengue And Chikungunya":            "dengue_cases",
    "Dengue/Chikungunya":                "dengue_cases",
    "Chikungunya/Dengue":                "dengue_cases",
    "Chikungunya/ Dengue":               "dengue_cases",
    "Suspected Dengue And Chikungunya":  "dengue_cases",
    "Dengue And Malaria":                "dengue_cases",
    "Malaria":                           "malaria_cases",
    "Malaria (PV)":                      "malaria_cases",
    "Acute Encephalitis Syndrome":       "encephalitis_cases",
    "Cholera":                           "cholera_cases",
    "Suspected Cholera":                 "cholera_cases",
    "Chikungunya":                       "chikungunya_cases",
    "Suspected Chikungunya":             "chikungunya_cases",
    "pyrexia of unknown origin":         "puo_cases",
}

EPICLIM_COLS = [
    "diarrhoeal_cases", "dengue_cases", "malaria_cases",
    "encephalitis_cases", "cholera_cases", "chikungunya_cases",
]

# -----------------------------------------------------------------------------
# 1. Load HMIS
# -----------------------------------------------------------------------------
print("Loading pulse_training_data.csv ...")
hmis = pd.read_csv("pulse_training_data.csv")
print(f"  Loaded: {hmis.shape}")

# -----------------------------------------------------------------------------
# 2. Clean HMIS
# -----------------------------------------------------------------------------
# Cap stockout at 100, fill NaN with 0
hmis["stockout_rate_pct"] = hmis["stockout_rate_pct"].clip(upper=100).fillna(0)

# Fill all remaining numeric NaNs with 0
num_cols = hmis.select_dtypes(include="number").columns.tolist()
hmis[num_cols] = hmis[num_cols].fillna(0)

# Encode fiscal_year
fy_map = {"2020-2021": 0, "2021-2022": 1}
hmis["fiscal_year"] = hmis["fiscal_year"].map(fy_map)

print(f"  After cleaning: {hmis.shape}")

# -----------------------------------------------------------------------------
# 3. Load & process EpiClim
# -----------------------------------------------------------------------------
print("\nLoading epiclim_outbreaks.csv ...")
epi = pd.read_csv("idsp_data/epiclim_outbreaks.csv")
print(f"  Loaded: {epi.shape}")

# Filter to MH + RJ
epi = epi[epi["state_ut"].isin(["Maharashtra", "Rajasthan"])].copy()
print(f"  After state filter: {epi.shape}")

# Cases column is string — coerce to numeric
epi["Cases"] = pd.to_numeric(epi["Cases"], errors="coerce").fillna(0)

# Map Disease ? canonical column
epi["disease_col"] = epi["Disease"].map(DISEASE_MAP)
epi = epi.dropna(subset=["disease_col"])   # drop unmapped

# Normalise district for join
epi["district_key"] = epi["district"].str.lower().str.strip()

# Aggregate: sum Cases per group, mean Temp + preci
group_cols = ["state_ut", "district_key", "mon", "year", "disease_col"]
agg_cases = (
    epi.groupby(group_cols, as_index=False)["Cases"]
    .sum()
    .rename(columns={"Cases": "case_count"})
)

agg_climate = (
    epi.groupby(["state_ut", "district_key", "mon", "year"], as_index=False)
    .agg(temp_mean=("Temp", "mean"), preci_mean=("preci", "mean"))
)

# Pivot diseases wide
pivot = agg_cases.pivot_table(
    index=["state_ut", "district_key", "mon", "year"],
    columns="disease_col",
    values="case_count",
    aggfunc="sum",
    fill_value=0,
).reset_index()
pivot.columns.name = None

# Ensure all expected disease columns exist
for col in EPICLIM_COLS:
    if col not in pivot.columns:
        pivot[col] = 0

# Merge climate back
epi_monthly = pivot.merge(agg_climate, on=["state_ut", "district_key", "mon", "year"], how="left")

# Rename to match HMIS
epi_monthly = epi_monthly.rename(columns={"state_ut": "state", "mon": "month"})

print(f"  EpiClim monthly aggregated: {epi_monthly.shape}")

# -----------------------------------------------------------------------------
# 4. Merge HMIS + EpiClim
# -----------------------------------------------------------------------------
hmis["district_key"] = hmis["district"].str.lower().str.strip()

merged = hmis.merge(
    epi_monthly[["state", "district_key", "month"] + EPICLIM_COLS + ["temp_mean", "preci_mean"]],
    on=["state", "district_key", "month"],
    how="left",
)

# Fill EpiClim columns with 0 where no match
for col in EPICLIM_COLS + ["temp_mean", "preci_mean"]:
    merged[col] = merged[col].fillna(0)

merged.drop(columns=["district_key"], inplace=True)
print(f"\nAfter merge: {merged.shape}")

# -----------------------------------------------------------------------------
# 5. Demand labels (shifted by -1 within each district)
# -----------------------------------------------------------------------------
merged = merged.sort_values(["state", "district", "fiscal_year", "month"]).reset_index(drop=True)

for district, grp_idx in merged.groupby(["state", "district"]).groups.items():
    idx = list(grp_idx)
    merged.loc[idx, "ors_demand_next_month"]         = merged.loc[idx, "ors_packets"].shift(-1).values
    merged.loc[idx, "antibiotics_demand_next_month"] = merged.loc[idx, "antibiotics_paediatric"].shift(-1).values
    merged.loc[idx, "ifa_demand_next_month"]         = merged.loc[idx, "ifa_tablets_adult"].shift(-1).values

# -----------------------------------------------------------------------------
# 6. Drop rows where ALL three demand labels are NaN
# -----------------------------------------------------------------------------
demand_cols = ["ors_demand_next_month", "antibiotics_demand_next_month", "ifa_demand_next_month"]
before = len(merged)
merged = merged.dropna(subset=demand_cols, how="all").reset_index(drop=True)
print(f"Dropped {before - len(merged)} rows with all-NaN demand labels")

# -----------------------------------------------------------------------------
# 7. Save
# -----------------------------------------------------------------------------
merged.to_csv("pulse_master_dataset.csv", index=False)
print(f"\nSaved: pulse_master_dataset.csv")

# -----------------------------------------------------------------------------
# 8. Summary
# -----------------------------------------------------------------------------
print(f"\n{'='*55}")
print(f"Final shape   : {merged.shape}")
print(f"\nColumns ({len(merged.columns)}):")
for c in merged.columns:
    print(f"  {c}")
print(f"\nNull counts per column:")
nulls = merged.isnull().sum()
print(nulls[nulls > 0].to_string() if nulls.any() else "  (none)")
print(f"\nFirst 3 rows:")
print(merged.head(3).to_string(index=False))
print(f"{'='*55}")
