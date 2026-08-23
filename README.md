# AEGIS-AI

**AI-powered cybersecurity threat scanner.**  
Drop any screenshot, image, or PDF — AEGIS-AI extracts text via OCR and uses IBM Watsonx (Granite / IBM Bob) to instantly identify phishing, malware, BEC, and social-engineering threats.

---

## Project structure

```
AegisAI/
├── backend/               ← Flask API
│   ├── app.py             — Flask routes (/api/scan, /health)
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
    └── vite.config.ts     — Dev proxy: /api → localhost:5000
```

---

## Prerequisites

### Python (backend)
- **Python 3.10+**
- **Tesseract OCR binary** — required for image scanning:
  - **Windows:** Download installer from https://github.com/UB-Mannheim/tesseract/wiki  
    After installing, add to PATH (or set `TESSDATA_PREFIX` env var).
  - **macOS:** `brew install tesseract`
  - **Linux (Debian/Ubuntu):** `sudo apt-get install tesseract-ocr`

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

**Success response (200):**
```json
{
  "extracted_text":  "URGENT: Your account will be suspended...",
  "risk_level":      "high",
  "threat_category": "Phishing",
  "explanation":     "This message uses urgency tactics and a suspicious link...",
  "recommendations": [
    "Do not click any links in this message.",
    "Report the email to your IT/security team.",
    "Delete the message and block the sender."
  ],
  "scan_id":   "a1b2c3d4-...",
  "timestamp": "2025-01-15T10:30:00+00:00"
}
```

**Error response (4xx/5xx):**
```json
{ "error": "User-readable error message." }
```

### `GET /health`

Liveness probe for load balancers and uptime monitors.

```json
{ "status": "ok" }
```

---

## Quick test (command line)

With the Flask server running on port 5000:

```bash
# Health check
curl http://localhost:5000/health

# Scan a file
curl -X POST http://localhost:5000/api/scan \
     -F "file=@/path/to/screenshot.png"
```

---

## Production deployment

### Build the frontend

```bash
cd aegis-frontend
npm run build
# Output: aegis-frontend/dist/
```

Serve `aegis-frontend/dist/` from any static host (Netlify, Vercel, Cloudflare Pages, nginx, etc.).

Set `VITE_API_BASE` in your static host's environment variables to point at your deployed Flask URL:
```
VITE_API_BASE=https://your-api-domain.com/api
```

### Run the backend — Windows (Waitress)

```bash
cd backend
# Edit .env: set FLASK_DEBUG=false, PORT=5000, CORS_ORIGINS=https://your-frontend-domain.com
python wsgi.py
```

### Run the backend — Linux / Docker (Gunicorn)

```bash
pip install gunicorn
cd backend
gunicorn wsgi:app --workers 4 --bind 0.0.0.0:5000
```

### Environment variables (production)

| Variable | Required | Example |
|---|---|---|
| `IBM_WATSONX_API_KEY` | ✅ | `abc123...` |
| `IBM_WATSONX_URL` | ✅ | `https://us-south.ml.cloud.ibm.com` |
| `IBM_WATSONX_PROJECT_ID` | ✅ | `your-project-id` |
| `IBM_WATSONX_MODEL_ID` | optional | `ibm/granite-3-8b-instruct` |
| `PORT` | optional | `5000` |
| `FLASK_DEBUG` | optional | `false` |
| `CORS_ORIGINS` | optional | `https://your-frontend.com` |

---

## Troubleshooting

**"Text extraction failed. Please check that Tesseract OCR is installed."**  
→ Install the Tesseract binary (see Prerequisites) and ensure it is on your `PATH`.  
→ Windows: verify with `tesseract --version` in a new terminal.

**"IBM_WATSONX_API_KEY is not set."**  
→ Create `backend/.env` from `backend/.env.example` and fill in all three IBM variables.

**"Could not reach the scanner."** (from the frontend)  
→ Ensure the Flask backend is running on port 5000.  
→ In production, verify `VITE_API_BASE` is set to the correct URL and CORS is configured.

**PDF scans return empty text**  
→ If the PDF is scanned (no text layer), Tesseract runs on each rasterised page.  
   This is slower — allow up to 30 seconds for multi-page scanned PDFs.

---

## Security notes

- Files are processed in memory and immediately discarded — nothing is stored.
- The `FLASK_DEBUG=false` default prevents debug output in production.
- `CORS_ORIGINS=*` is safe for a fully public, stateless API. Tighten to your exact frontend domain for maximum security.
- Never commit `backend/.env` — it is excluded via `.gitignore`.
