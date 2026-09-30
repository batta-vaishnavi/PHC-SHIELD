# PHC-SHIELD: Federated AI for Smart Health & Supply Chain Resilience
**Track 3: Smart Health & Supply Chain Resilience | Theme: Resilience**

> **Official Prototype Declaration:**
> *"The prototype uses user-entered data, uploaded datasets, or explicitly loaded synthetic demo data."*
> The database starts 100% empty upon initial startup, with no hardcoded figures, placeholder values, or automatic fixtures.

---

## 1. Project Overview
**PHC-SHIELD** is an enterprise-grade, privacy-preserving clinical supply chain intelligence platform engineered for Primary Health Centres (PHCs), sub-district hospitals, and regional healthcare directorates. It addresses drug stock-outs, sudden epidemic surges, bed capacity bottlenecks, and inter-facility logistics friction by uniting decentralized **Federated Machine Learning**, **Time-Series Regression Forecasting**, **OR-Tools Min-Cost Linear Transportation Algorithms**, and **Google Gemini 2.5 Flash Clinical Grounded AI**.

---

## 2. Problem Statement
Rural and semi-urban Primary Health Centres frequently face:
1. **Critical Stock-Outs**: Lead times from central pharmaceutical warehouses take 5–14 days, often causing emergency stock-outs of antibiotics, rabies vaccines, and insulin.
2. **Data Silos & Privacy Barriers**: Facility patient and consumption records cannot be pooled into centralized cloud servers due to healthcare confidentiality and regional data governance laws.
3. **Logistics Imbalances**: One PHC faces a severe shortage of essential biologics while an adjacent PHC in the same district holds an excess buffer approaching expiry.
4. **Epidemic Demand Shocks**: Seasonal monsoon fevers or vector-borne outbreaks spike local medicine consumption by 50%–200%, rapidly overwhelming standard buffer formulas.

---

## 3. The PHC-SHIELD Solution
PHC-SHIELD delivers a resilient, privacy-first healthcare supply grid:
- **Decentralized Federated Learning (FedAvg)**: Trains predictive demand models across district edge clients without transferring raw patient or inventory telemetry.
- **Dynamic Ridge Regression Forecasting**: Computes holdout-validated 7, 14, and 30-day medicine consumption projections with lag-7, trend, and day-of-week feature engineering.
- **Stock-Out Early Warnings**: Evaluates real-time coverage days ($`\text{stock} / \text{daily demand}`$) against supplier lead times and safety thresholds to trigger actionable alerts.
- **OR-Tools Peer-to-Peer Redistribution**: Solves a minimum-cost transportation problem to balance surplus and deficit nodes under Haversine transit distance and cold-chain constraints.
- **Google Gemini Grounded Intelligence**: Provides explainable clinical rationale and executive briefings strictly grounded on live numerical database values.
- **In-Memory Emergency Surge Simulator**: Allows health commanders to stress-test surge scenarios (+10% to +250%) without altering stored production data.

---

## 4. Key Modules & Features
| Module | Core Functionality |
| :--- | :--- |
| **Dashboard** | Real-time KPI summaries, active shortage warnings, bed occupancy, and geospatial risk overview. |
| **PHC Network** | Complete facility directory management with GPS coordinate mapping and administrative search. |
| **Medicine Stock** | Formulary tracking with calculated days remaining, lead times, safety thresholds, and cold-chain markers. |
| **Footfall Tracker** | Historical patient traffic logs broken down by outpatient triage, emergency admissions, and disease category. |
| **Bed Capacity** | Inpatient bed quotas and real-time occupancy gauge ($`\text{Occupied} \le \text{Total}`$). |
| **Staff Attendance** | Daily shift roster reliability tracking ($`\text{Present} \le \text{Total}`$). |
| **Demand Forecast** | scikit-learn Ridge regression with holdout MAE and Recharts Actual vs. Predicted curves ($`\ge 14`$ records required). |
| **Early Warnings** | HIGH and MEDIUM risk alert detection with expected stock-out dates and calculated trigger reasons. |
| **Redistribution** | OR-Tools GLOP linear solver balancing surpluses and deficits with human clinical governance disclaimers. |
| **Federated AI** | Multi-district FedAvg simulation showing edge training, gradient updates, and local vs. global R²/MAE metrics. |
| **Gemini Assistant** | Conversational clinical supply chain assistant answering operational queries with live database context. |
| **Emergency Simulator** | In-memory crisis stress-testing modeling epidemiological spikes without altering persistent data. |
| **BRICS Scalability** | 5-tier architecture mapping edge PHCs up to cross-national health intelligence federations. |
| **CSV Batch Ingestion** | Robust CSV validation engine with header verification, constraint checks, preview, and safe commits. |
| **Deterministic Demo** | Seeded synthetic multi-district dataset tagged with `is_demo=true` with one-click purge. |

---

## 5. Technology Stack
- **Backend**: FastAPI, SQLAlchemy, Pydantic v2, Python 3.11+.
- **Database**: SQLite locally, PostgreSQL via `DATABASE_URL` in cloud environments.
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Leaflet & React-Leaflet (OpenStreetMap).
- **Machine Learning & Optimization**: scikit-learn (Ridge/GradientBoosting), NumPy, Google OR-Tools (Linear Solver GLOP), SciPy.
- **Generative AI**: `google-genai` Python SDK (Gemini 2.5 Flash, backend-only).
- **Testing**: pytest, FastAPI TestClient, httpx.
- **DevOps**: Docker, multi-stage Dockerfiles, Docker Compose, Nginx.

---

## 6. Mathematical & Algorithmic Formulations

### A. Demand Forecasting (Time-Series Ridge Regression)
For a given PHC and medicine with historical daily records $`\{(t, y_t)\}`$:
- **Features**: Day-of-week $`\text{DoW}_t`$, linear time index $`t`$, lag feature $`y_{t-1}`$, weekly seasonal lag $`y_{t-7}`$, and rolling momentum $`\bar{y}_{t-7:t-1}`$.
- **Model**:
  ```math
  \hat{y}_t = \mathbf{w}^T \mathbf{x}_t + b, \quad \min_{\mathbf{w}, b} \sum (y_t - \hat{y}_t)^2 + \alpha \|\mathbf{w}\|_2^2
  ```
- **Strict Data Requirement**: Requires $`N \ge 14`$ continuous daily records. If $`N < 14`$, returns `"Insufficient data for reliable forecasting."` with zero extrapolated figures.

### B. Risk Assessment & Stock-out Detection
Let $`S`$ = on-hand stock, $`D`$ = predicted daily demand rate, $`L`$ = supplier lead time (days), and $`T_{\text{min}}`$ = minimum safety threshold.
- Stock Coverage: $`C = S / D`$
- **High Risk**: $`C < L \quad \text{OR} \quad S \le T_{\text{min}}`$
- **Medium Risk**: $`L \le C < L + 3`$
- **Low Risk / Healthy**: $`C \ge L + 3`$
- Expected Stock-out Date: $`\text{Date}_{\text{today}} + \lfloor C \rfloor`$

### C. Inventory Redistribution (OR-Tools Transportation Solver)
For each facility $`i`$, calculate surplus $`\sigma_i`$ and deficit $`\delta_j`$:
```math
\sigma_i = \max(0, S_i - [D_i \cdot L_i + T_{\text{min}, i}]), \quad \delta_j = \max(0, [D_j \cdot L_j + T_{\text{min}, j}] - S_j)
```
Minimize total transit friction:
```math
\min \sum_{i \in \text{Surplus}} \sum_{j \in \text{Shortage}} \left( d(i, j) \cdot \mu_j - 100 \right) x_{i, j}
```
Subject to:
1. $`\sum_j x_{i, j} \le \sigma_i`$ (Outflow cannot exceed surplus)
2. $`\sum_i x_{i, j} \le \delta_j`$ (Inflow cannot exceed deficit)
3. $`x_{i, j} \ge 0`$
4. $`x_{i, j} = 0`$ if medicine requires cold-chain and Haversine distance $`d(i, j) > 250\text{ km}`$.

### D. Federated Averaging (FedAvg Simulation)
Across $`K`$ district client nodes with sample volumes $`n_k`$ ($`\sum n_k = N`$):
```math
\mathbf{w}_{\text{global}}^{(r+1)} = \sum_{k=1}^K \frac{n_k}{N} \mathbf{w}_k^{(r)}
```
Raw patient rows stay isolated on district edge silos; only parameter gradients are synchronized.

---

## 7. Google Gemini AI Grounding & Integration
- **SDK**: `google-genai` Python SDK instantiated strictly on the backend.
- **Model**: Default `gemini-2.5-flash` configured via `GEMINI_MODEL`.
- **Grounding Rule**: Every prompt strictly includes:
  > *"Explain using only the supplied data. Do not invent numbers or facts."*
- **Operational Governance**: All UI views display:
  > *"AI-generated explanation based on available data. Verify before operational use."*
- **Graceful Fallback**: If `GEMINI_API_KEY` is not provided or API calls fail, the backend returns deterministic numerical analyses with clear notices:
  > *"Gemini is currently unavailable. Numerical analysis is still available."*

---

## 8. CSV Ingestion Format
CSV uploads require the following column headers (case-insensitive):
```csv
phc_id,phc_name,district,state,country,latitude,longitude,medicine,category,unit,min_threshold,lead_time,shelf_life_days,cold_chain_required,date,stock,daily_consumption,footfall,beds_total,beds_occupied,staff_total,staff_present
```
- **Validation Rules**:
  - `date`: Valid `YYYY-MM-DD` string.
  - `stock`, `daily_consumption`, `lead_time`, `min_threshold`: Non-negative numbers ($`\ge 0`$).
  - `beds_occupied` $`\le`$ `beds_total`.
  - `staff_present` $`\le`$ `staff_total`.
- The validator previews rows and lists row-specific errors. **Invalid data is never silently imported.**

---

## 9. Installation & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 10. Environment Variables
Create a `.env` file in the root directory (or in `backend/.env`):
```env
# Gemini API Key (Required for AI explanations)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Database Configuration
DATABASE_URL=sqlite:///./phc_shield.db
ENVIRONMENT=development

# Frontend API URL
VITE_API_URL=http://localhost:8000/api
```

---

## 11. Testing & Verification
Execute the automated pytest suite verifying calculations, constraints, ML rules, and demo lifecycles:
```bash
cd backend
pytest -v
```
**Test Coverage Includes:**
- Zero-consumption days remaining & non-division by zero.
- Strict HIGH, MEDIUM, and LOW risk level triggers.
- Inpatient bed occupancy ($`\text{Occupied} \le \text{Total}`$) and staff roster ($`\text{Present} \le \text{Total}`$) validation.
- Demand forecasting minimum-data threshold ($`\ge 14`$ records).
- Startup database purity (zero seeded rows).
- Synthetic demo dataset deterministic load and complete deletion.

---

## 12. Deployment Guide

### A. Google Cloud Run (Backend)
1. **Database**: Provision a Google Cloud SQL PostgreSQL instance (SQLite is ephemeral in containerized cloud runtimes).
2. **Build and Deploy**:
   ```bash
   gcloud run deploy phc-shield-backend \
     --source ./backend \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL="postgresql://user:password@cloudsql-ip/phc_db",GEMINI_API_KEY="your_api_key",GEMINI_MODEL="gemini-2.5-flash" \
     --allow-unauthenticated
   ```

### B. Vercel / Firebase / Netlify (Frontend)
1. Build production static bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Set environment variable `VITE_API_URL=https://your-cloud-run-backend-url/api`.
3. Deploy the `./frontend/dist` directory to Firebase Hosting, Vercel, or Netlify.

### C. Docker Compose (Full Stack Local)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## 13. Security, Governance & Limitations
- **Data Sovereignty**: Raw clinical rows are never broadcast over the network; only aggregated model weights are exchanged in the federated simulation.
- **Human Clinical Approval**: All redistribution recommendations explicitly require human pharmacist/clinician authorization prior to physical vehicle dispatch.
- **Prototype Scope**: Uses simulated federated edge clients and synthetic/user-entered data for demonstration purposes; does not claim pre-existing government API access.

---

## 14. Future Scope
- Integration with FHIR / HL7 clinical messaging standards.
- Real-time IoT temperature logging integration for active cold-chain vaccine carriers.
- Differential Privacy with Gaussian noise injection ($`(\epsilon, \delta)`$-DP) in Flower/PySyft federated aggregation layers.
