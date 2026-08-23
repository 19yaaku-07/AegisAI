# ============================================================
# start-backend.ps1
# Run this from the AegisAI/ root directory.
# Put your IBM Watsonx credentials in backend/.env — do NOT
# set them here, or they will override the .env file.
# ============================================================

# ── Server config ────────────────────────────────────────────
$env:PORT         = "5000"
$env:FLASK_DEBUG  = "false"
$env:CORS_ORIGINS = "*"

# ── Start Flask ──────────────────────────────────────────────
Write-Host "Starting AEGIS-AI backend on http://localhost:5000 ..."
Write-Host "Credentials are loaded from backend/.env"
python backend/app.py
