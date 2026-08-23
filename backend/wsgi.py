"""
wsgi.py — Production entry point for AEGIS-AI backend.

Windows (development / production):
    python wsgi.py

Linux / Docker (production):
    gunicorn wsgi:app --workers 4 --bind 0.0.0.0:$PORT

The server is chosen automatically:
  - waitress  → Windows (installed, no C compiler needed)
  - gunicorn  → Linux / macOS (install separately: pip install gunicorn)
  - Flask dev → fallback (not for production)
"""
from __future__ import annotations

import logging
import os
import platform
import sys

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app  # noqa: E402

app = create_app()

logger = logging.getLogger(__name__)


def _serve_waitress(port: int) -> None:
    from waitress import serve

    logger.info("Production server: waitress on port %d", port)
    serve(app, host="0.0.0.0", port=port, threads=8)


def _serve_gunicorn(port: int) -> None:
    # gunicorn is invoked via its CLI; this branch is for completeness —
    # normally you'd run:  gunicorn wsgi:app --bind 0.0.0.0:<port>
    try:
        from gunicorn.app.wsgiapp import WSGIApplication  # type: ignore
        sys.argv = ["gunicorn", f"--bind=0.0.0.0:{port}", "--workers=4", "wsgi:app"]
        WSGIApplication().run()
    except ImportError:
        logger.warning("gunicorn not installed; falling back to waitress.")
        _serve_waitress(port)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    if platform.system() == "Windows":
        _serve_waitress(port)
    else:
        try:
            import gunicorn  # noqa: F401
            _serve_gunicorn(port)
        except ImportError:
            _serve_waitress(port)
