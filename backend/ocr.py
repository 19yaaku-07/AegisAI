"""
ocr.py — Text extraction from images and PDFs.

Supports:
  - PNG / JPEG / WEBP / GIF  → pytesseract (Tesseract OCR)
  - PDF                       → PyMuPDF (fitz) text layer first;
                                falls back to rasterising each page
                                and running Tesseract if the PDF has
                                no embedded text (scanned PDF).

The caller receives a plain Unicode string regardless of input type.
Raises OCRError on unrecoverable failures.
"""
from __future__ import annotations

import io
import os
import re
import unicodedata
from pathlib import Path

import pymupdf as fitz   # PyMuPDF (fitz is the legacy alias)
from PIL import Image

# ---------------------------------------------------------------------------
# Tesseract binary path — resolve automatically on Windows if not in PATH.
# The UB-Mannheim installer places tesseract.exe in a well-known location.
# ---------------------------------------------------------------------------
_TESSERACT_WINDOWS_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

# ---------------------------------------------------------------------------
# Tesseract availability — optional at import time; checked at call time.
# ---------------------------------------------------------------------------
try:
    import pytesseract

    # If no explicit path is set, try the Windows default install locations.
    if not os.environ.get("TESSERACT_CMD"):
        for _p in _TESSERACT_WINDOWS_PATHS:
            if Path(_p).is_file():
                pytesseract.pytesseract.tesseract_cmd = _p
                break

    _TESSERACT_AVAILABLE = True
except ImportError:          # should never happen after pip install
    _TESSERACT_AVAILABLE = False

# ---------------------------------------------------------------------------
# Public exception
# ---------------------------------------------------------------------------

class OCRError(Exception):
    """Raised when text extraction fails unrecoverably."""


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
}

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB — mirrors frontend constraint

# Tesseract config: page-seg-mode 6 (uniform block of text) gives better
# results on screenshots with mixed content than the default PSM 3.
_TESS_CONFIG = "--psm 6"

# Minimum character count to consider OCR successful.
_MIN_TEXT_CHARS = 10


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise(text: str) -> str:
    """
    Clean raw OCR output:
      - Normalise unicode (NFC)
      - Replace control characters with spaces
      - Collapse runs of whitespace to single space
      - Strip leading/trailing whitespace
    """
    text = unicodedata.normalize("NFC", text)
    # Replace non-printable control chars (except newline / tab) with space
    text = "".join(
        ch if (unicodedata.category(ch)[0] != "C" or ch in "\n\t") else " "
        for ch in text
    )
    # Collapse horizontal whitespace runs; preserve newlines for readability
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _ocr_pil_image(img: Image.Image) -> str:
    """Run Tesseract on a PIL Image and return normalised text."""
    if not _TESSERACT_AVAILABLE:
        raise OCRError("Tesseract (pytesseract) is not installed.")
    try:
        raw = pytesseract.image_to_string(img, config=_TESS_CONFIG)
        return _normalise(raw)
    except Exception as exc:
        raise OCRError(f"Tesseract failed: {exc}") from exc


def _extract_pdf_text(data: bytes) -> str:
    """
    Extract text from a PDF.
    Strategy:
      1. Use PyMuPDF's built-in text extraction (fast, exact for digital PDFs).
      2. If the extracted text is too short (scanned PDF), rasterise each page
         at 200 DPI and run Tesseract on the resulting image.
    """
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:
        raise OCRError(f"Could not open PDF: {exc}") from exc

    # — Pass 1: native text layer —
    pages_text: list[str] = []
    for page in doc:
        pages_text.append(page.get_text())
    native_text = _normalise("\n\n".join(pages_text))

    if len(native_text) >= _MIN_TEXT_CHARS:
        doc.close()
        return native_text

    # — Pass 2: rasterise + OCR (scanned PDF) —
    if not _TESSERACT_AVAILABLE:
        doc.close()
        if native_text:
            return native_text
        raise OCRError(
            "PDF appears to be scanned (no embedded text) and Tesseract "
            "is not available for OCR."
        )

    ocr_parts: list[str] = []
    for page in doc:
        # 200 DPI via matrix scale ≈ 200/72 ≈ 2.78
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        try:
            ocr_parts.append(_ocr_pil_image(img))
        except OCRError:
            pass  # skip pages that fail; carry on with rest

    doc.close()
    result = _normalise("\n\n".join(ocr_parts))
    if not result:
        raise OCRError("No readable text found in the PDF.")
    return result


def _extract_image_text(data: bytes, mime_type: str) -> str:
    """Run Tesseract on an image supplied as raw bytes."""
    try:
        img = Image.open(io.BytesIO(data))
        # Convert to RGB — Tesseract handles it better than RGBA/P mode
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
    except Exception as exc:
        raise OCRError(f"Could not open image: {exc}") from exc

    return _ocr_pil_image(img)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def extract_text(data: bytes, mime_type: str) -> str:
    """
    Extract text from file bytes.

    Parameters
    ----------
    data      : raw file bytes
    mime_type : MIME type string (e.g. "image/png", "application/pdf")

    Returns
    -------
    Normalised unicode text string (may be empty string if file has no text).

    Raises
    ------
    OCRError  : if extraction fails unrecoverably.
    ValueError: if mime_type is not in ALLOWED_MIME_TYPES.
    """
    mime_type = mime_type.lower().strip()
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"Unsupported file type: {mime_type}. "
            f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
        )

    if mime_type == "application/pdf":
        return _extract_pdf_text(data)
    return _extract_image_text(data, mime_type)
