import re
import logging
import warnings
from pathlib import Path

import pandas as pd
import openpyxl  # noqa: F401

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    filename="extraction_errors.log",
    filemode="w",
    level=logging.ERROR,
    format="%(asctime)s  %(levelname)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent

SCAN_FOLDERS = ["MH_20-21", "MH_21-22", "RJ_20-21", "RJ_21-22"]

CODE_MAP = {
    "14.2.1":   "opd_attendance",
    "14.4.2":   "inpatient_dengue",
    "14.4.4":   "inpatient_diarrhea",
    "14.17":    "stockout_rate_pct",
    "11.1.1.b": "malaria_vivax",
    "11.1.1.c": "malaria_falciparum",
    "11.3.1":   "dengue_rdt_positive",
    "19.6":     "ifa_tablets_adult",
    "19.10":    "antibiotics_paediatric",
    "19.12":    "ors_packets",
    "19.14":    "zinc_tablets",
    "19.16":    "calcium_tablets",
}

MONTH_MAP = {
    "Apr": 4,  "May": 5,  "Jun": 6,  "Jul": 7,
    "Aug": 8,  "Sep": 9,  "Oct": 10, "Nov": 11,
    "Dec": 12, "Jan": 1,  "Feb": 2,  "Mar": 3,
}

OUTPUT_COLS = [
    "state", "district", "fiscal_year", "month", "month_name",
    "opd_attendance", "inpatient_dengue", "inpatient_diarrhea",
    "stockout_rate_pct", "malaria_vivax", "malaria_falciparum",
    "dengue_rdt_positive", "ifa_tablets_adult", "antibiotics_paediatric",
    "ors_packets", "zinc_tablets", "calcium_tablets",
]

PHC_FILE = BASE_DIR / "StateUTs-wise Number of PHCs.xls"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_fiscal_year(folder_name: str) -> str:
    m = re.search(r"(\d{2})-(\d{2})", folder_name)
    if not m:
        return ""
    return f"20{m.group(1)}-20{m.group(2)}"


def parse_state(filename: str) -> str:
    m = re.search(r"-([A-Za-z]+)_", filename)
    return m.group(1) if m else ""


def parse_month(filename: str):
    for name, num in MONTH_MAP.items():
        if name in filename:
            return num, name
    return None, None


def clean_code(raw) -> str:
    if raw is None:
        return ""
    return str(raw).lstrip("'").strip()


# ---------------------------------------------------------------------------
# Single file extraction
# ---------------------------------------------------------------------------

def extract_file(xlsx_path: Path) -> list:
    fname = xlsx_path.name
    folder = xlsx_path.parent.name

    state = parse_state(fname)
    month_num, month_name = parse_month(fname)
    fiscal_year = parse_fiscal_year(folder)

    if not state or month_num is None or not fiscal_year:
        logger.error(
            "%s: metadata parse failed (state=%r month=%r fy=%r)",
            xlsx_path, state, month_num, fiscal_year,
        )
        return []

    df = pd.read_excel(xlsx_path, header=None, engine="openpyxl")

    # District names from row index 6 (1-based row 7), starting col 4
    header_row = df.iloc[6]
    district_map = {}   # district_name -> public_col (0-based)

    col = 4
    while col < len(header_row):
        name = header_row.iloc[col]
        if pd.notna(name) and str(name).strip():
            district_map[str(name).strip()] = col + 1   # Public[A] offset
            col += 5
        else:
            col += 1

    if not district_map:
        logger.error("%s: no districts found", xlsx_path)
        return []

    # First occurrence of each target code
    code_rows = {}
    for _, row in df.iterrows():
        code = clean_code(row.iloc[1])
        if code in CODE_MAP and code not in code_rows:
            code_rows[code] = row

    records = []
    for district, pub_col in district_map.items():
        # Skip the state-level total column
        if district == state:
            continue
        rec = {
            "state":       state,
            "district":    district,
            "fiscal_year": fiscal_year,
            "month":       month_num,
            "month_name":  month_name,
        }
        for code, field in CODE_MAP.items():
            row = code_rows.get(code)
            if row is None:
                rec[field] = None
            else:
                # Section-19 supply items have no Public[A] split; use Total column
                col_idx = pub_col - 1 if code.startswith("19.") else pub_col
                if col_idx < len(row):
                    val = row.iloc[col_idx]
                    rec[field] = None if pd.isna(val) else val
                else:
                    rec[field] = None
        records.append(rec)

    return records


# ---------------------------------------------------------------------------
# PHC counts
# ---------------------------------------------------------------------------

def extract_phc_counts() -> "pd.DataFrame":
    empty = pd.DataFrame(columns=[
        "state", "phc_rural", "phc_urban", "phc_total",
        "chc_rural", "chc_urban", "chc_total",
    ])
    try:
        import olefile
        import xlrd
        with olefile.OleFileIO(str(PHC_FILE)) as ole:
            raw = ole.openstream("Workbook").read()
        wb = xlrd.open_workbook(file_contents=raw)
    except Exception:
        try:
            import xlrd
            wb = xlrd.open_workbook(str(PHC_FILE))
        except Exception as exc:
            logger.error("PHC file unreadable: %s", exc)
            return empty

    sh = wb.sheet_by_index(0)
    records = []
    for r in range(1, sh.nrows):      # skip header row 0
        row = sh.row_values(r)
        if len(row) < 8:
            continue
        state_name = str(row[1]).strip()
        if not state_name:
            continue
        try:
            def _int(v):
                return int(v) if isinstance(v, (int, float)) and v != "" else None
            records.append({
                "state":     state_name,
                "phc_rural": _int(row[2]),
                "phc_urban": _int(row[3]),
                "phc_total": _int(row[4]),
                "chc_rural": _int(row[5]),
                "chc_urban": _int(row[6]),
                "chc_total": _int(row[7]),
            })
        except Exception as exc:
            logger.error("PHC row error: %s | %s", exc, row)

    return pd.DataFrame(records) if records else empty


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    all_records = []

    xlsx_files = []
    for folder_name in SCAN_FOLDERS:
        p = BASE_DIR / folder_name
        if p.exists():
            xlsx_files.extend(sorted(p.rglob("*.xlsx")))

    print(f"Found {len(xlsx_files)} xlsx files.\n")

    for xlsx_path in xlsx_files:
        label = xlsx_path.relative_to(BASE_DIR)
        print(f"  {label} ... ", end="", flush=True)
        try:
            recs = extract_file(xlsx_path)
            all_records.extend(recs)
            print(f"{len(recs)} rows")
        except Exception as exc:
            logger.error("Unhandled error in %s: %s", xlsx_path, exc, exc_info=True)
            print("ERROR (logged)")

    # Main CSV
    if all_records:
        df_out = pd.DataFrame(all_records, columns=OUTPUT_COLS)
        df_out.sort_values(
            ["state", "fiscal_year", "month", "district"],
            inplace=True,
            ignore_index=True,
        )
    else:
        df_out = pd.DataFrame(columns=OUTPUT_COLS)

    out_path = BASE_DIR / "pulse_training_data.csv"
    df_out.to_csv(out_path, index=False)
    print(f"\nSaved: {out_path}")

    # PHC CSV
    df_phc = extract_phc_counts()
    phc_path = BASE_DIR / "pulse_phc_counts.csv"
    df_phc.to_csv(phc_path, index=False)
    print(f"Saved: {phc_path}  ({len(df_phc)} states)")

    # Summary
    n = len(df_out)
    n_dist   = df_out["district"].nunique() if n else 0
    n_states = df_out["state"].nunique()    if n else 0
    months   = sorted(df_out["month"].unique().tolist()) if n else []

    print("\n" + "=" * 50)
    print(f"Total records   : {n}")
    print(f"Unique districts: {n_dist}")
    print(f"Unique states   : {n_states}")
    print(f"Months covered  : {months}")
    print("=" * 50)

    if n:
        print("\nFirst 5 rows of pulse_training_data.csv:")
        print(df_out.head().to_string(index=False))
        print(f"\nShape: {df_out.shape}")


if __name__ == "__main__":
    main()
