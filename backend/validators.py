"""
validators.py — Request validation and response shape validation.

All validation logic lives here so neither app.py nor the analysis
layer needs to know about Flask's request object.
"""
from __future__ import annotations

from typing import TypedDict

from werkzeug.datastructures import FileStorage

# ---------------------------------------------------------------------------
# Upload constraints (must stay in sync with frontend api.config.ts)
# ---------------------------------------------------------------------------

ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
}

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB

# Map of file extension → canonical MIME type for browsers that
# send application/octet-stream instead of the real type.
_EXT_TO_MIME: dict[str, str] = {
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif":  "image/gif",
    ".pdf":  "application/pdf",
}

# ---------------------------------------------------------------------------
# Valid risk levels — mirrors frontend types.ts
# ---------------------------------------------------------------------------

VALID_RISK_LEVELS = {"safe", "low", "medium", "high", "critical"}


# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------

class ValidationError(Exception):
    """Raised when an uploaded file is invalid."""


def resolve_mime_type(file: FileStorage) -> str:
    """
    Return the canonical MIME type for a Werkzeug FileStorage object.

    Browsers sometimes send "application/octet-stream" for valid image files.
    When the declared MIME type is not in our allowed set we fall back to
    the file extension.
    """
    declared = (file.content_type or "").lower().split(";")[0].strip()
    if declared in ALLOWED_MIME_TYPES:
        return declared

    # Fall back to extension
    name = file.filename or ""
    suffix = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    return _EXT_TO_MIME.get(suffix, declared)


def validate_upload(file: FileStorage) -> tuple[bytes, str]:
    """
    Validate a file upload.

    Returns
    -------
    (file_bytes, mime_type)

    Raises
    ------
    ValidationError : with a user-readable message.
    """
    if file is None or file.filename == "":
        raise ValidationError("No file was provided.")

    mime_type = resolve_mime_type(file)

    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f"Unsupported file type '{mime_type}'. "
            "Please upload a PNG, JPEG, WEBP, GIF, or PDF file."
        )

    data = file.read()

    if len(data) == 0:
        raise ValidationError("The uploaded file is empty.")

    if len(data) > MAX_FILE_BYTES:
        mb = len(data) / (1024 * 1024)
        raise ValidationError(
            f"File is too large ({mb:.1f} MB). Maximum allowed size is 10 MB."
        )

    return data, mime_type


# ---------------------------------------------------------------------------
# Response shape validation (review finding #1)
# ---------------------------------------------------------------------------

class ScanResultDict(TypedDict):
    extracted_text: str
    risk_level: str
    threat_category: str
    explanation: str
    recommendations: list[str]


def validate_scan_result(result: dict) -> ScanResultDict:
    """
    Validate that a scan result dict has the correct shape before sending
    it to the frontend.  Raises ValueError on invalid input.

    This prevents silently returning corrupt data to the frontend when the
    AI layer produces unexpected output.
    """
    risk = str(result.get("risk_level", "")).lower().strip()
    if risk not in VALID_RISK_LEVELS:
        raise ValueError(
            f"Invalid risk_level '{risk}' returned by analysis. "
            f"Must be one of: {', '.join(sorted(VALID_RISK_LEVELS))}"
        )

    explanation = str(result.get("explanation", "")).strip()
    if not explanation:
        raise ValueError("Analysis returned an empty explanation.")

    category = str(result.get("threat_category", "")).strip()
    if not category:
        raise ValueError("Analysis returned an empty threat_category.")

    recs = result.get("recommendations", [])
    if not isinstance(recs, list) or len(recs) == 0:
        raise ValueError("Analysis returned no recommendations.")

    extracted = str(result.get("extracted_text", ""))

    return ScanResultDict(
        extracted_text=extracted,
        risk_level=risk,
        threat_category=category,
        explanation=explanation,
        recommendations=[str(r) for r in recs],
    )
