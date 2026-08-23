# AEGIS-AI

**AI-powered cybersecurity threat scanner.**  
Drop any screenshot, image, or PDF — AEGIS-AI extracts text via OCR and uses IBM Watsonx (Granite) to instantly identify phishing, malware, BEC, and social-engineering threats.

---

## Live deployment

| Service | URL |
|---------|-----|
| Frontend | https://aegisai-frontend.onrender.com |
| Backend API | https://aegisai-34mr.onrender.com |

---

## Project structure

```
AegisAI/
├── render.yaml            ← Render deployment configuration
├── backend/               ← Flask API
│   ├── app.py             — Flask routes (/api/scan, /api/scan-url, /health)
│   ├── ocr.py             — OCR (Tesseract + PyMuPDF for PDFs)
│   ├── analysis.py        — IBM Watsonx AI threat analysis
│   ├── validators.py      — Upload & response validation
│   ├── wsgi.py            — Production WSGI entry point
│   ├── requirements.txt
│   └── .env.example       — Copy to .env and fill in credentials
│
└── aegis-frontend/        ← React + Vite frontend
    ├── src/
    │   ├── pages/         — Landing, HowItWorks, Scanner, Results, Threats, About
    │   ├── components/    — Nav, Footer, RiskGauge, UploadCard, …
    │   └── lib/           — api.ts, risk.ts, motion.ts, …
    ├── public/
    │   └── _redirects     — SPA routing for Render Static Site
    └── vite.config.ts     — Dev proxy: /api → localhost:5000
```

---

## Prerequisites

### Python (backend)
- **Python 3.11+**
- **Tesseract OCR binary** — required for image scanning:
  - **Linux (Debian/Ubuntu):** `sudo apt-get install tesseract-ocr`
  - **macOS:** `brew install tesseract`

### Node.js (frontend)
- **Node.js 18+** with npm

### IBM Watsonx credentials
1. Create a free IBM Cloud account at https://cloud.ibm.com
2. Create a Watsonx project at https://dataplatform.cloud.ibm.com
3. Generate an API key at https://cloud.ibm.com/iam/apikeys
4. Note your **Project ID** from the project settings page

---

## Local development setup

### 1. Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Install Tesseract OCR (macOS example)
# brew install tesseract

# Configure credentials
cp .env.example .env
# Edit .env and fill in IBM_WATSONX_API_KEY, IBM_WATSONX_URL, IBM_WATSONX_PROJECT_ID

# Start the Flask development server
python app.py
# → Running on http://localhost:5000
```

### 2. Frontend

```bash
cd aegis-frontend

# Install Node dependencies (first time only)
npm install

# Start the Vite dev server
npm run dev
# → Running on http://localhost:5173
# → /api requests are proxied to http://localhost:5000
```

Open **http://localhost:5173** in your browser.

---

## API endpoints

### `POST /api/scan`

Accepts a file upload, runs OCR, analyses with IBM Watsonx, returns JSON.

**Request:** `multipart/form-data` — field name: `file`  
**Accepted types:** PNG, JPEG, WEBP, GIF, PDF (max 10 MB)

### `POST /api/scan-url`

Accepts a URL or pasted text for threat analysis.

**Request:** `application/json` — `{ "url": "..." }` or `{ "text": "..." }`

### `GET /health`

Liveness probe — returns `{ "status": "ok" }`.

---

## Render deployment

The project includes `render.yaml` for automatic Render deployment.

### Services

| Service | Type | Root Dir | Build Command | Start Command |
|---------|------|----------|---------------|---------------|
| `aegisai-backend` | Web Service (Python) | `backend` | `pip install -r requirements.txt && apt-get install -y tesseract-ocr` | `gunicorn app:app --workers 2 --bind 0.0.0.0:$PORT --timeout 120` |
| `aegisai-frontend` | Static Site | `aegis-frontend` | `npm ci && npm run build` | *(static)* |

### Environment variables

#### Backend (set in Render dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `IBM_WATSONX_API_KEY` | ✅ **Secret** | IAM API key from IBM Cloud |
| `IBM_WATSONX_PROJECT_ID` | ✅ **Secret** | Watsonx project ID |
| `IBM_WATSONX_URL` | ✅ | `https://us-south.ml.cloud.ibm.com` |
| `IBM_WATSONX_MODEL_ID` | optional | `ibm/granite-3-8b-instruct` |
| `FLASK_DEBUG` | optional | `false` |
| `CORS_ORIGINS` | optional | Your frontend URL |

#### Frontend (set in Render dashboard or render.yaml)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE` | `https://aegisai-34mr.onrender.com/api` |

---

## Troubleshooting

**"IBM_WATSONX_API_KEY is not set."**  
→ Set the environment variable in Render dashboard (or in `backend/.env` locally).

**"Text extraction failed. Please check that Tesseract OCR is installed."**  
→ On Render, the build command installs `tesseract-ocr` automatically via apt.  
→ Locally, install via your OS package manager.

**"Could not reach the scanner."** (from the frontend)  
→ Ensure the Flask backend is running.  
→ In production, verify `VITE_API_BASE` is set and CORS is configured.

**PDF scans return empty text**  
→ If the PDF is scanned (no text layer), Tesseract runs on each rasterised page. Allow up to 60 seconds for multi-page scanned PDFs.

---

## Security notes

- Files are processed in memory and immediately discarded — nothing is stored.
- `FLASK_DEBUG=false` prevents debug output in production.
- Never commit `backend/.env` — it is excluded via `.gitignore`.
- API keys are set as secret environment variables in Render, never committed to Git.
