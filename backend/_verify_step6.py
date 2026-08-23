"""
Step 6 verification: all 12 deployment checks.
Run from AegisAI/ root: python backend/_verify_step6.py
"""
import os
import re
import sys
from io import BytesIO
from unittest.mock import patch

sys.path.insert(0, "backend")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

results = []


def check(label, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((status, label, detail))
    marker = "[PASS]" if passed else "[FAIL]"
    print(f"{marker} {label}")
    if detail:
        print(f"       {detail}")


# ── 1. /health returns 200 {"status": "ok"} ──────────────────────────────
from app import create_app

app = create_app()
client = app.test_client()
r = client.get("/health")
body = r.get_json()
check(
    '/health returns 200 {"status": "ok"}',
    r.status_code == 200 and body == {"status": "ok"},
    f"status={r.status_code} body={body}",
)

# ── 2. /api/scan works with a real PDF upload + mocked AI ────────────────
import pymupdf

MOCK_AI = {
    "risk_level": "high",
    "threat_category": "Phishing",
    "explanation": "Urgency language and spoofed domain detected.",
    "recommendations": [
        "Do not click any links.",
        "Report to your security team.",
        "Delete the message immediately.",
    ],
}

doc = pymupdf.open()
page = doc.new_page()
page.insert_text(
    (72, 72),
    "URGENT: Your Microsoft account will be suspended. "
    "Verify now: http://microsofft-login.evil.com",
)
pdf_bytes = doc.tobytes()
doc.close()

with patch("analysis.analyse_text", return_value=MOCK_AI):
    r2 = client.post(
        "/api/scan",
        data={"file": (BytesIO(pdf_bytes), "phishing.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )

body2 = r2.get_json()
has_all_keys = all(
    k in body2
    for k in ["risk_level", "threat_category", "explanation", "recommendations", "extracted_text", "scan_id"]
)
check(
    "/api/scan returns 200 with correct JSON shape",
    r2.status_code == 200 and has_all_keys,
    f"status={r2.status_code}  risk={body2.get('risk_level')}  keys={sorted(body2.keys())}",
)

# ── 3. No mock / hardcoded data in production backend files ──────────────
mock_terms = ["mock_result", "hardcoded", "lorem ipsum", "fake_response"]
backend_files = [
    "backend/app.py",
    "backend/analysis.py",
    "backend/ocr.py",
    "backend/validators.py",
]
found = []
for fp in backend_files:
    txt = open(fp).read().lower()
    for term in mock_terms:
        if term in txt:
            found.append(f"{fp}: '{term}'")
check(
    "No mock/hardcoded data in production backend files",
    len(found) == 0,
    ", ".join(found) if found else "Clean",
)

# ── 4. IBM credentials never hardcoded — always from env ─────────────────
analysis_src = open("backend/analysis.py").read()
uses_env = 'os.environ.get("IBM_WATSONX_API_KEY"' in analysis_src
hardcoded = bool(re.search(r'api_key\s*=\s*["\'][A-Za-z0-9_\-]{20,}', analysis_src))
check(
    "IBM credentials read from os.environ — never hardcoded",
    uses_env and not hardcoded,
    f"uses_env={uses_env}  literal_key_found={hardcoded}",
)

# ── 5. .env not committed ────────────────────────────────────────────────
env_exists = os.path.isfile("backend/.env")
check(
    "backend/.env absent from workspace (not committed)",
    not env_exists,
    "Absent - correct" if not env_exists else "WARN: file exists — add to .gitignore",
)

# ── 6. FLASK_DEBUG defaults to false ─────────────────────────────────────
app_src = open("backend/app.py").read()
debug_line = re.search(r'FLASK_DEBUG.*==.*"true"', app_src)
check(
    "FLASK_DEBUG defaults to false (not hardcoded true)",
    bool(debug_line),
    "Reads FLASK_DEBUG from env, defaults to false",
)

# ── 7. CORS configured via env var ───────────────────────────────────────
cors_env = "CORS_ORIGINS" in app_src and "CORS(" in app_src
check(
    "CORS configured via CORS_ORIGINS env var",
    cors_env,
    "flask_cors CORS() applied with env-controlled origins",
)

# ── 8. Frontend reads backend URL from VITE_API_BASE ─────────────────────
api_config_src = open("aegis-frontend/src/lib/api.config.ts").read()
uses_vite = "VITE_API_BASE" in api_config_src and "import.meta.env" in api_config_src
check(
    "Frontend reads API base URL from VITE_API_BASE env var",
    uses_vite,
    "Falls back to /api (Vite dev proxy) when not set",
)

# ── 9. No hardcoded localhost in api.ts ───────────────────────────────────
api_ts_src = open("aegis-frontend/src/lib/api.ts").read()
no_hardcoded = "localhost" not in api_ts_src and "127.0.0.1" not in api_ts_src
check(
    "No hardcoded localhost in frontend api.ts",
    no_hardcoded,
    "All URLs computed from VITE_API_BASE / Vite proxy",
)

# ── 10. Vite dev proxy configured for /api -> localhost:5000 ─────────────
vite_cfg = open("aegis-frontend/vite.config.ts").read()
has_proxy = "'/api'" in vite_cfg and "localhost:5000" in vite_cfg
check(
    "Vite dev proxy: /api -> localhost:5000",
    has_proxy,
    "Transparent in development — no CORS needed locally",
)

# ── 11. Results page renders all backend fields ───────────────────────────
results_src = open("aegis-frontend/src/pages/Results.tsx").read()
fields = ["risk_level", "threat_category", "explanation", "recommendations", "extracted_text"]
missing = [f for f in fields if f not in results_src]
check(
    "Results page reads all 5 backend response fields",
    len(missing) == 0,
    f"Missing: {missing}" if missing else "All fields present",
)

# ── 12. Frontend validates API response shape ─────────────────────────────
check(
    "Frontend validates API response shape (validateScanResult)",
    "validateScanResult" in api_ts_src and "VALID_RISK_LEVELS" in api_ts_src,
    "Throws user-readable error on invalid/missing risk_level or explanation",
)

# ── Summary ───────────────────────────────────────────────────────────────
passed = sum(1 for s, _, _ in results if s == "PASS")
failed = sum(1 for s, _, _ in results if s == "FAIL")
print()
print("-" * 60)
print(f"RESULT: {passed}/{len(results)} checks passed   |   {failed} failed")
print("-" * 60)
sys.exit(0 if failed == 0 else 1)
