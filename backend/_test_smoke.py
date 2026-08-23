"""
Smoke test for the full Flask app — validation + OCR (PDF) + mocked analysis.
Run from backend/ directory: python _test_smoke.py
"""
import json
import sys
from io import BytesIO
from unittest.mock import patch

import os
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
import pymupdf as fitz

# Build a realistic test PDF with phishing text
def make_phishing_pdf() -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(
        (72, 72),
        "URGENT: Your Microsoft account will be suspended in 24 hours.\n"
        "Click here to verify: http://microsofft-login.evil.com\n"
        "Enter your username and password immediately.",
    )
    data = doc.tobytes()
    doc.close()
    return data


# Mock IBM Watsonx so the test runs without credentials
MOCK_ANALYSIS = {
    "risk_level": "high",
    "threat_category": "Phishing",
    "explanation": (
        "This message uses urgency language and a spoofed Microsoft domain "
        "to harvest credentials. Classic phishing attack."
    ),
    "recommendations": [
        "Do not click the link — it leads to a credential-harvesting page.",
        "Report the message to your IT/security team immediately.",
        "Delete the message and block the sender.",
    ],
}


def run():
    from app import create_app

    app = create_app()
    client = app.test_client()

    # ── Health check ──────────────────────────────────────────────────────
    r = client.get("/health")
    assert r.status_code == 200
    assert r.get_json() == {"status": "ok"}
    print("PASS: GET /health → 200 OK")

    # ── Validation: no file field ─────────────────────────────────────────
    r = client.post("/api/scan")
    assert r.status_code == 400
    body = r.get_json()
    assert "error" in body
    print("PASS: POST /api/scan (no file) -> 400", body["error"])

    # ── Validation: unsupported type ──────────────────────────────────────
    r = client.post(
        "/api/scan",
        data={"file": (BytesIO(b"GIF89a"), "test.gif.exe", "application/x-msdownload")},
        content_type="multipart/form-data",
    )
    assert r.status_code == 400
    print("PASS: POST /api/scan (bad type) -> 400", r.get_json()["error"][:60])

    # ── Full scan with mocked IBM Watsonx ─────────────────────────────────
    pdf_bytes = make_phishing_pdf()

    with patch("analysis.analyse_text", return_value=MOCK_ANALYSIS):
        r = client.post(
            "/api/scan",
            data={"file": (BytesIO(pdf_bytes), "phishing.pdf", "application/pdf")},
            content_type="multipart/form-data",
        )

    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.get_data(as_text=True)}"
    result = r.get_json()

    # Verify every field the frontend expects
    assert result["risk_level"] == "high",         f"risk_level: {result['risk_level']}"
    assert result["threat_category"] == "Phishing", f"category: {result['threat_category']}"
    assert len(result["explanation"]) > 10,         "explanation too short"
    assert isinstance(result["recommendations"], list)
    assert len(result["recommendations"]) >= 3
    assert "URGENT" in result["extracted_text"],    "OCR didn't extract phishing text"
    assert "scan_id" in result
    assert "timestamp" in result

    print("PASS: POST /api/scan (PDF phishing) -> 200")
    print("  risk_level:     ", result["risk_level"])
    print("  threat_category:", result["threat_category"])
    print("  extracted chars:", len(result["extracted_text"]))
    print("  recommendations:", len(result["recommendations"]))
    print("  scan_id:        ", result["scan_id"])

    print("\nAll smoke tests passed. Backend is ready.")


if __name__ == "__main__":
    run()
