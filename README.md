<div align="center">

<pre>
██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██████╔╝██║   ██║██║     ███████╗█████╗  
██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  
██║     ╚██████╔╝███████╗███████║███████╗
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
</pre>

**Primary Unit Level Supply & Emergency Intelligence**

*"Know before it flatlines."*

[![Firebase Hosting](https://img.shields.io/badge/Live%20Demo-Firebase-orange?style=for-the-badge&logo=firebase)](https://stable-hydra-507904-h7.web.app)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Firestore](https://img.shields.io/badge/Firestore-Real--time-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)

---

**Track 03 — Smart Health & Supply Chain Resilience**  
Build with AI: Code for Communities — Second Edition  
Google Cloud × Hack2skill

</div>

---

## 🩺 The Problem

India has **31,882 Primary Health Centres** serving 1.4 billion people.

Every year, stock-outs of essential medicines — ORS, paracetamol, antibiotics — cost lives that should have been saved. The root cause isn't a shortage of medicine. It's a **gap in information**.

| Reality | Data |
|---|---|
| Essential medicine availability across Indian states | 17–51% (HMIS) |
| PHCs that report stock levels digitally | < 20% |
| Average delay from depletion to district-level notice | 2–5 days |
| Lives lost annually to preventable stock-outs | In the thousands |

By the time a PHC reports a stock-out, **the emergency has already arrived.**

The existing system is reactive. PULSE is preemptive.

---

## 💡 Our Solution

PULSE is a **federated AI command centre** that gives district health officers real-time visibility into every PHC's stock levels, outbreak risk signals, and redistribution opportunities — and tells them **where to move medicines before anyone runs out**.

Two novel insights power PULSE:

> **1. Outbreak signals precede stock-outs.**  
> IDSP disease surveillance data reveals rising case counts 2–3 weeks before PHCs feel inventory pressure. PULSE ingests these signals and pre-positions stock accordingly.

> **2. Staff capacity determines real demand.**  
> An understaffed PHC dispensing at 25% capacity shouldn't receive more stock — that medicine should go where it can actually be administered. PULSE tracks staffing alongside supply.

---

## 🌐 Live Demo

| | |
|---|---|
| **Dashboard URL** | https://stable-hydra-507904-h7.web.app |
| **Pilot coverage** | 84 districts · Maharashtra + Rajasthan |
| **Data mode** | Firestore real-time + HMIS historical |

---

## 🏗️ Architecture

```
PHC Field Worker
     │
     │  WhatsApp / SMS  (works on ₹500 feature phones, no app needed)
     ▼
Twilio Webhook  ──►  Flask Cloud Run  ──►  Gemini 2.5 Flash
                                              │
                                     Parses unstructured text
                                     (Hindi, Marathi, Tamil, English)
                                     Extracts: medicine, quantity, unit, PHC ID
                                              │
                                              ▼
                                       Firestore  (real-time ledger)
                                              │
                      ┌───────────────────────┤
                      │                       │
                      ▼                       ▼
             ML Forecast Layer         Alert Engine
         GradientBoosting models    Threshold breach detection
         Trained on 2yr HMIS data   Severity classification
         + EpiClim outbreak signals  District-level rollup
                      │                       │
                      └───────────────────────┤
                                              │
                                              ▼
                                  Gemini 1.5 Flash
                              Redistribution Recommendations
                        (PHC-to-PHC transfer orders with route + qty)
                                              │
                                              ▼
                                    React Dashboard
                               Firebase Hosting (CDN)
                          District command centre for DHOs
```

---

## ✨ Key Features

### 📱 Zero-App Reporting
PHC workers send stock updates over **WhatsApp or SMS** — no app install, no training required, works on basic ₹500 feature phones across rural India. Gemini 2.5 Flash parses free-text messages in any Indian language and extracts structured medicine, quantity, and unit data.

**Parsed inputs include:**
- `"PHC047 paracetamol 200 units"`
- `"ORS 500 packets PHC023"` 
- `"ors khatam ho gaya PHC014"` *(Hindi: "ORS has run out")*

### 🦟 Outbreak-Triggered Preemptive Restocking
Connected to **IDSP disease surveillance signals**. When dengue cases spike in a district, PULSE pre-positions ORS before PHCs feel the pressure. Features include: dengue RDT positivity, diarrhoeal case counts, malaria (vivax + falciparum), encephalitis, chikungunya, and cholera signals — all used as ML features.

### 📈 ML Demand Forecasting

| Model | Target | R² | MAE | Training Samples |
|---|---|---|---|---|
| GradientBoosting | ORS demand (next month) | **0.905** | 261,230 units | 364 |
| GradientBoosting | Antibiotics demand | 0.609 | 34,570 units | 209 |


Trained on **2 years of HMIS district-level consumption data** across 88 districts in Maharashtra and Rajasthan. Input features include OPD attendance, seasonal month signals, epidemic case counts, temperature, and precipitation.

### 🤖 AI Redistribution Recommendations
**Gemini 1.5 Flash** analyzes surplus and deficit PHC snapshots from Firestore and generates natural-language transfer orders complete with recommended quantities, medicine type, and estimated distances — enabling DHOs to act in minutes, not days.

### 🗺️ Real-Time District Command Centre
The React dashboard provides district health officers with:
- **PHC Network Map** (Leaflet/OpenStreetMap) with colour-coded criticality markers
- **Live stock table** with Firestore real-time updates streaming to the top of the view
- **Forecast charts** scaled per district by OPD attendance
- **Alert feed** with severity classification and one-click resolve
- **84-district selector** covering all of Maharashtra and Rajasthan with per-district PHC counts and status

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Input channel | Twilio WhatsApp + SMS API | Zero-app field reporting |
| AI parsing | Gemini 2.5 Flash | Multilingual NLP extraction |
| AI recommendations | Gemini 1.5 Flash | Redistribution orders |
| Forecasting | GradientBoosting (scikit-learn) | Demand prediction |
| Real-time DB | Firebase Firestore | Live stock ledger |
| Backend | Flask + Cloud Run | Webhook + API layer |
| Frontend | React 18 + Framer Motion | District dashboard |
| Maps | Leaflet + OpenStreetMap | PHC network visualisation |
| Hosting | Firebase Hosting | CDN-backed deployment |
| Analytics | Google BigQuery | Historical HMIS analysis |
| Translation | Google Cloud Translation API | Indian language support |

---

## 📊 Data Sources

| Dataset | Source | Usage |
|---|---|---|
| PHC facility registry | data.gov.in | PHC locations & district counts |
| Medicine consumption | HMIS (hmis.nhp.gov.in) | Forecast model training data |
| Disease outbreaks | EpiClim / IDSP | Outbreak signal features for ML |
| Population data | Census 2011 | Demand normalisation |

---

## 📁 Project Structure

```
PULSE/
├── backend/                    # Flask REST API
│   ├── app.py                  # App factory, blueprint registration
│   ├── routes/
│   │   ├── webhook.py          # Twilio WhatsApp/SMS handler + Gemini parsing
│   │   ├── predict.py          # ML forecast endpoint (/api/predict)
│   │   ├── alerts.py           # Alert creation & resolution
│   │   ├── forecast.py         # District-level forecast API
│   │   └── recommend.py        # Gemini redistribution recommendations
│   └── requirements.txt
│
├── dashboard/                  # React frontend
│   └── src/
│       ├── App.js              # Router, nav, global Firestore subscription
│       ├── firebase.js         # Firestore client + mock seed data
│       ├── pages/
│       │   ├── DistrictView.js # Main command centre (stock table, alerts, map)
│       │   ├── StateView.js    # State-level district risk overview
│       │   └── AlertsFeed.js   # Full alert management feed
│       └── components/
│           ├── PHCMap.js       # Leaflet map with live PHC markers
│           ├── ForecastChart.js # Recharts demand forecast visualization
│           ├── StockMap.js     # PHC facility grid cards
│           ├── RecommendPanel.js # Gemini transfer order display
│           ├── AlertCard.js    # Individual alert with resolve action
│           └── AnimatedCounter.js # Animated stat number counters
│
├── ml/                         # ML training & model artifacts
│   ├── train_local_model.py    # GradientBoosting training on HMIS data
│   ├── ors_model.pkl           # Trained ORS demand model (R²=0.905)
│   ├── antibiotics_model.pkl   # Trained antibiotics demand model (R²=0.609)
│   ├── ifa_model.pkl           # Trained IFA tablets demand model
│   ├── district_encoder.pkl    # LabelEncoder for 88 districts
│   ├── features.json           # Feature list (18 features)
│   └── model_metrics.json      # Evaluation metrics per target
│
└── data/
    ├── raw/                    # Source HMIS CSVs (gitignored)
    ├── processed/              # Merged master dataset (gitignored)
    └── scripts/
        ├── extract_hmis.py          # Downloads & extracts HMIS district data
        ├── prepare_pulse_dataset.py # Merges HMIS + EpiClim features
        └── generate_districts_summary.py  # Builds districts_summary.json
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Firebase project with Firestore enabled
- Firebase service account key (`firebase-key.json`)
- Gemini API key
- Twilio account (optional — for live WhatsApp ingest)

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

# Copy and fill in your credentials
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, Twilio keys, Firebase project ID

# Place your Firebase service account key
# backend/firebase-key.json

python app.py
# Flask runs at http://localhost:5000
```

### 2. Dashboard

```bash
cd dashboard
npm install
npm start
# React dev server at http://localhost:3000
```

### 3. ML Model Training

```bash
# From PULSE/ root
# Ensure data/processed/pulse_master_final.csv exists (run data/scripts/ first)

pip install scikit-learn pandas numpy
python ml/train_local_model.py
# Outputs: ml/ors_model.pkl, antibiotics_model.pkl, district_encoder.pkl
```

### 4. Data Pipeline (optional)

```bash
cd data/scripts
python extract_hmis.py          # Pulls HMIS district-month consumption data
python prepare_pulse_dataset.py # Merges with EpiClim outbreak signals
python generate_districts_summary.py  # Generates districts_summary.json
```

---

## ⚙️ Environment Variables

### `backend/.env`

```env
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=firebase-key.json
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
REGISTERED_PHONE_NUMBER=whatsapp:+91XXXXXXXXXX
```

### `dashboard/.env`

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhook/whatsapp` | Twilio WhatsApp inbound handler |
| `POST` | `/webhook/sms` | Twilio SMS inbound handler |
| `POST` | `/api/predict` | GradientBoosting demand forecast |
| `GET` | `/forecast/` | District-level monthly forecast |
| `POST` | `/recommend/` | Gemini redistribution order |
| `GET` | `/alerts/` | List active alerts |
| `POST` | `/alerts/resolve/<id>` | Mark alert resolved |

---

## 🧠 ML Features

The forecasting models are trained on **18 features**:

```
Temporal:    month, fiscal_year
Utilisation: opd_attendance, stockout_rate_pct
Epidemiology: inpatient_dengue, inpatient_diarrhea,
              malaria_vivax, malaria_falciparum,
              dengue_rdt_positive, diarrhoeal_cases,
              dengue_cases, malaria_cases,
              encephalitis_cases, cholera_cases,
              chikungunya_cases
Climate:     temp_mean, preci_mean
Geography:   district_encoded  (88 districts, LabelEncoded)
```

---

## 📈 Impact Potential

| Metric | Value |
|---|---|
| PHCs in India | 31,882 |
| Districts actively monitored (pilot) | 84 |
| States covered | Maharashtra, Rajasthan |
| States in integration pipeline | 6 |
| Essential medicine availability (baseline) | 17–51% across states |
| eVIN stock-out reduction benchmark (vaccines) | **80% reduction** |

> eVIN (electronic Vaccine Intelligence Network) proved that real-time stock visibility reduces vaccine stock-outs by 80%. PULSE applies the same intelligence model to **all essential medicines**, across all PHCs, not just cold-chain items.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**PULSE — Know before it flatlines.**

*Connecting 31,882 PHCs to the intelligence they need, before the medicine runs out.*

</div>
