"""
app.py — AEGIS-AI Flask backend.

Endpoints
---------
POST /api/scan        — Upload a file → OCR → IBM AI → JSON result
GET  /health          — Liveness probe

Run for development:
    python app.py

Run for production (Windows):
    python wsgi.py

Run for production (Linux / Docker):
    gunicorn wsgi:app
"""
from __future__ import annotations

import logging
import os
import re
import traceback
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

# Load .env before anything accesses os.environ
from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(_env_path)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app() -> Flask:
    app = Flask(__name__)

    # ── CORS ─────────────────────────────────────────────────────────────────
    # In development the Vite proxy forwards /api → localhost:5000, so CORS
    # is only needed for production (deployed frontend on a different origin).
    # CORS_ORIGINS defaults to * which is fine for a public read-only tool;
    # tighten to your production domain when deploying.
    allowed_origins = os.environ.get("CORS_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    # ── Max upload size ───────────────────────────────────────────────────────
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

    # ── Error handlers ────────────────────────────────────────────────────────

    @app.errorhandler(413)
    def request_entity_too_large(_):
        return (
            jsonify({"error": "File is too large. Maximum allowed size is 10 MB."}),
            413,
        )

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(405)
    def method_not_allowed(_):
        return jsonify({"error": "Method not allowed."}), 405

    # ── Routes ────────────────────────────────────────────────────────────────

    @app.route("/health", methods=["GET"])
    def health():
        """Liveness probe. Returns 200 {"status": "ok"}."""
        return jsonify({"status": "ok"}), 200

    @app.route("/api/scan-url", methods=["POST"])
    def scan_url():
        """
        Accept a URL or plain text for threat analysis.

        Expects JSON: {"url": "https://..."} or {"text": "..."}

        Returns same shape as /api/scan (minus extracted_text).
        """
        from analysis import analyse_text, AnalysisError

        body = request.get_json(silent=True) or {}
        url_input  = str(body.get("url",  "") or "").strip()
        text_input = str(body.get("text", "") or "").strip()

        if not url_input and not text_input:
            return jsonify({"error": "Provide 'url' or 'text' in the request body."}), 400

        scan_id = str(uuid.uuid4())

        # ── If a URL was supplied, fetch its content ──────────────────────
        if url_input:
            # Basic URL sanity check
            if not re.match(r"^https?://", url_input, re.IGNORECASE):
                url_input = "https://" + url_input

            logger.info("Scan %s — fetching URL %r", scan_id, url_input[:120])
            try:
                req = urllib.request.Request(
                    url_input,
                    headers={"User-Agent": "AEGIS-AI-Scanner/1.0"},
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    raw_bytes = resp.read(50_000)   # cap at 50 KB
                content_type = (resp.headers.get("Content-Type") or "").lower()
                # Decode leniently
                charset = "utf-8"
                if "charset=" in content_type:
                    charset = content_type.split("charset=")[-1].split(";")[0].strip()
                try:
                    fetched_text = raw_bytes.decode(charset, errors="replace")
                except LookupError:
                    fetched_text = raw_bytes.decode("utf-8", errors="replace")

                # Strip HTML tags for cleaner analysis
                fetched_text = re.sub(r"<[^>]+>", " ", fetched_text)
                fetched_text = re.sub(r"\s{2,}", " ", fetched_text).strip()
                analysis_input = f"URL: {url_input}\n\n{fetched_text[:4000]}"

            except urllib.error.URLError as exc:
                logger.warning("Scan %s — could not fetch URL: %s", scan_id, exc)
                # Fall back to analysing the URL string itself
                analysis_input = f"URL to analyse: {url_input}"
            except Exception as exc:  # noqa: BLE001
                logger.warning("Scan %s — URL fetch error: %s", scan_id, exc)
                analysis_input = f"URL to analyse: {url_input}"
        else:
            analysis_input = text_input
            logger.info("Scan %s — analysing pasted text (%d chars)", scan_id, len(text_input))

        # ── AI Analysis ───────────────────────────────────────────────────
        try:
            analysis = analyse_text(analysis_input)
        except AnalysisError as exc:
            logger.error("Scan %s — analysis failed: %s", scan_id, exc)
            return jsonify({"error": str(exc)}), 502
        except Exception as exc:  # noqa: BLE001
            logger.error("Scan %s — unexpected analysis error: %s", scan_id, traceback.format_exc())
            return jsonify({"error": f"Unexpected error during analysis: {exc}"}), 500

        response_payload = {
            "extracted_text":  analysis_input[:500] + ("…" if len(analysis_input) > 500 else ""),
            "risk_level":      analysis["risk_level"],
            "threat_category": analysis["threat_category"],
            "explanation":     analysis["explanation"],
            "recommendations": analysis["recommendations"],
            "scan_id":         scan_id,
            "timestamp":       datetime.now(timezone.utc).isoformat(),
        }

        logger.info(
            "Scan %s complete — risk=%s category=%r",
            scan_id, analysis["risk_level"], analysis["threat_category"],
        )
        return jsonify(response_payload), 200

    @app.route("/api/scan", methods=["POST"])
    def scan():
        """
        Accept a file upload, run OCR, run IBM Watsonx analysis, return JSON.

        Expects: multipart/form-data with field name "file"

        Returns:
        {
          "extracted_text": "...",
          "risk_level":      "safe|low|medium|high|critical",
          "threat_category": "...",
          "explanation":     "...",
          "recommendations": ["...", "..."]
        }

        On error returns: {"error": "user-readable message"} with 4xx/5xx.
        """
        # ── 1. Validate upload ────────────────────────────────────────────
        from validators import validate_upload, validate_scan_result, ValidationError

        if "file" not in request.files:
            return jsonify({"error": "No file field in request."}), 400

        file = request.files["file"]

        try:
            file_bytes, mime_type = validate_upload(file)
        except ValidationError as exc:
            return jsonify({"error": str(exc)}), 400

        scan_id = str(uuid.uuid4())
        logger.info(
            "Scan %s started — file=%r mime=%s size=%d",
            scan_id, file.filename, mime_type, len(file_bytes),
        )

        # ── 2. OCR ────────────────────────────────────────────────────────
        from ocr import extract_text, OCRError

        try:
            extracted_text = extract_text(file_bytes, mime_type)
        except OCRError as exc:
            logger.error("Scan %s — OCR failed: %s", scan_id, exc)
            return (
                jsonify({
                    "error": (
                        "Text extraction failed. "
                        "Please check that Tesseract OCR is installed and try again."
                    )
                }),
                422,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Scan %s — unexpected OCR error: %s", scan_id, traceback.format_exc())
            return jsonify({"error": f"Unexpected error during text extraction: {exc}"}), 500

        logger.info(
            "Scan %s — extracted %d chars", scan_id, len(extracted_text)
        )

        # ── 3. AI Analysis ────────────────────────────────────────────────
        from analysis import analyse_text, AnalysisError

        try:
            analysis = analyse_text(extracted_text)
        except AnalysisError as exc:
            logger.error("Scan %s — analysis failed: %s", scan_id, exc)
            return jsonify({"error": str(exc)}), 502
        except Exception as exc:  # noqa: BLE001
            logger.error("Scan %s — unexpected analysis error: %s", scan_id, traceback.format_exc())
            return jsonify({"error": f"Unexpected error during analysis: {exc}"}), 500

        # ── 4. Build and validate response ────────────────────────────────
        raw_result = {
            "extracted_text":  extracted_text,
            "risk_level":      analysis["risk_level"],
            "threat_category": analysis["threat_category"],
            "explanation":     analysis["explanation"],
            "recommendations": analysis["recommendations"],
        }

        try:
            validated = validate_scan_result(raw_result)
        except ValueError as exc:
            logger.error("Scan %s — response validation failed: %s", scan_id, exc)
            return jsonify({"error": f"Analysis returned invalid data: {exc}"}), 502

        response_payload = dict(validated)
        response_payload["scan_id"]   = scan_id
        response_payload["timestamp"] = datetime.now(timezone.utc).isoformat()

        logger.info(
            "Scan %s complete — risk=%s category=%r",
            scan_id, validated["risk_level"], validated["threat_category"],
        )

        return jsonify(response_payload), 200

    return app


# ---------------------------------------------------------------------------
# Dev server entry point
# ---------------------------------------------------------------------------

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"

    if debug:
        logger.warning("DEBUG mode is ON — do not use in production.")

    logger.info("Starting AEGIS-AI backend on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
