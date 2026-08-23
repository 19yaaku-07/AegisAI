"""
analysis.py — Local IBM Granite threat analysis via Ollama.

Uses IBM Granite 3.2 2B running locally through Ollama.

No IBM Watsonx API key or IBM Cloud Project ID is required.

Ollama must be running locally at:
    http://localhost:11434
"""

from __future__ import annotations

import json
import logging
import re
import textwrap
from typing import TypedDict

import requests


logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public exception
# ---------------------------------------------------------------------------

class AnalysisError(Exception):
    """Raised when local Granite analysis fails."""


# ---------------------------------------------------------------------------
# Response type
# ---------------------------------------------------------------------------

class ThreatAnalysis(TypedDict):
    risk_level: str
    threat_category: str
    explanation: str
    recommendations: list[str]


VALID_RISK_LEVELS = {
    "safe",
    "low",
    "medium",
    "high",
    "critical",
}


# ---------------------------------------------------------------------------
# Ollama configuration
# ---------------------------------------------------------------------------

OLLAMA_URL = "http://localhost:11434/api/chat"

# This is the Granite model you installed with Ollama.
MODEL_NAME = "granite3.2:2b"


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = textwrap.dedent("""\
    You are AEGIS-AI, a cybersecurity threat detection system.

    Your job is to classify the provided text ONLY for cybersecurity threats.

    IMPORTANT:
    Do NOT assume something is phishing just because it is a message,
    email, business communication, or contains a request.

    Classify based on actual evidence in the text.

    REQUIRED JSON:

    {
      "risk_level": "safe|low|medium|high|critical",
      "threat_category": "category",
      "explanation": "short explanation",
      "recommendations": [
        "recommendation 1",
        "recommendation 2",
        "recommendation 3"
      ]
    }

    DECISION RULES:

    SAFE:
    Use safe when the content is ordinary and contains no meaningful
    cybersecurity threat indicators.

    LOW:
    Use low when there is a minor security concern but no clear attack,
    malicious link, credential request, malware, or serious social
    engineering.

    MEDIUM:
    Use medium when the content contains suspicious behavior that
    requires verification, but there is not enough evidence for a clear
    attack.

    HIGH:
    Use high when there are clear indicators of phishing, credential
    theft, malicious links, impersonation, urgent requests for passwords,
    OTPs, banking information, or other sensitive information.

    CRITICAL:
    Use critical when there is evidence of an active or imminent severe
    attack such as ransomware, destructive malware, confirmed data
    exfiltration, or instructions that could immediately compromise
    systems.

    EXAMPLES:

    Example 1:
    "Hello team, our meeting is scheduled for tomorrow at 10 AM.
    Please bring the project report."

    Classification:
    safe
    category:
    Safe Content

    Example 2:
    "URGENT! Your bank account has been suspended.
    Click http://fake-bank-login.com and enter your password and OTP."

    Classification:
    high
    category:
    Phishing

    Example 3:
    "Your account requires verification. Please review this message
    with your administrator."

    Classification:
    low
    category:
    Security Notice

    Example 4:
    "Download this unknown executable immediately and disable your
    antivirus before running it."

    Classification:
    high
    category:
    Malware Distribution

    IMPORTANT:
    A normal business message is NOT automatically phishing.

    Do not invent threats that are not present in the text.

    Always return exactly 3 recommendations.

    Keep the explanation under 100 words.

    Return JSON ONLY.
""")


# ---------------------------------------------------------------------------
# Build user message
# ---------------------------------------------------------------------------

def _build_user_message(text: str) -> str:
    """
    Limit the amount of text sent to the local model.
    """

    excerpt = text[:4000]

    if len(text) > 4000:
        excerpt += "\n[... text truncated for analysis ...]"

    return (
        "Analyse this text for cybersecurity threats:\n\n"
        + excerpt
    )


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> dict:
    """
    Extract the first valid JSON object from Granite's response.

    Handles:
    - plain JSON
    - JSON inside markdown fences
    - additional text around JSON
    """

    if not raw:
        raise AnalysisError(
            "Granite returned an empty response."
        )

    raw = raw.strip()

    # Remove markdown code fences.
    raw = re.sub(
        r"```(?:json)?",
        "",
        raw,
        flags=re.IGNORECASE,
    )

    raw = raw.replace("```", "").strip()

    # Try the complete response first.
    try:
        parsed = json.loads(raw)

        if isinstance(parsed, dict):
            return parsed

    except json.JSONDecodeError:
        pass

    # If there is extra text, find the JSON object.
    match = re.search(
        r"\{[\s\S]*\}",
        raw,
    )

    if match:
        try:
            parsed = json.loads(match.group(0))

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

    raise AnalysisError(
        "Granite did not return valid JSON. "
        f"Raw response: {raw[:500]!r}"
    )


# ---------------------------------------------------------------------------
# Validate and normalise result
# ---------------------------------------------------------------------------

def _validate_and_normalise(
    data: dict,
) -> ThreatAnalysis:
    """
    Validate Granite's response and make sure the frontend
    always receives the expected structure.
    """

    # Risk level
    risk = str(
        data.get("risk_level", "")
    ).lower().strip()

    if risk not in VALID_RISK_LEVELS:
        logger.warning(
            "Granite returned invalid risk level %r. "
            "Defaulting to medium.",
            risk,
        )
        risk = "medium"

    # Threat category
    category = str(
        data.get(
            "threat_category",
            "Unknown",
        )
    ).strip()

    if not category:
        category = "Unknown"

    # Explanation
    explanation = str(
        data.get(
            "explanation",
            "",
        )
    ).strip()

    if not explanation:
        explanation = (
            "Analysis completed. "
            "Review the content carefully before taking action."
        )

    # Recommendations
    recommendations = data.get(
        "recommendations",
        [],
    )

    if not isinstance(
        recommendations,
        list,
    ):
        recommendations = [
            str(recommendations)
        ]

    recommendations = [
        str(item).strip()
        for item in recommendations
        if str(item).strip()
    ]

    # Make sure we have at least 3.
    default_recommendations = [
        "Treat this content with caution.",
        "Do not click links or download unexpected attachments.",
        "Report suspicious content if you are unsure.",
    ]

    while len(recommendations) < 3:
        recommendations.append(
            default_recommendations[
                len(recommendations)
            ]
        )

    # Keep exactly 3 for the frontend.
    recommendations = recommendations[:3]

    return ThreatAnalysis(
        risk_level=risk,
        threat_category=category,
        explanation=explanation,
        recommendations=recommendations,
    )


# ---------------------------------------------------------------------------
# Check Ollama
# ---------------------------------------------------------------------------

def _check_ollama() -> None:
    """
    Check whether Ollama is running and the Granite model exists.
    """

    try:
        response = requests.get(
            "http://localhost:11434/api/tags",
            timeout=5,
        )

        response.raise_for_status()

    except requests.exceptions.ConnectionError as exc:
        raise AnalysisError(
            "Cannot connect to Ollama. "
            "Please make sure Ollama is running."
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise AnalysisError(
            f"Could not connect to Ollama: {exc}"
        ) from exc

    try:
        models = response.json().get(
            "models",
            [],
        )

        installed_models = [
            model.get("name", "")
            for model in models
        ]

        if MODEL_NAME not in installed_models:
            raise AnalysisError(
                f"The required Granite model "
                f"'{MODEL_NAME}' was not found in Ollama. "
                f"Run: ollama pull {MODEL_NAME}"
            )

    except (ValueError, TypeError) as exc:
        raise AnalysisError(
            "Ollama returned an unexpected response."
        ) from exc


# ---------------------------------------------------------------------------
# Call Granite through Ollama
# ---------------------------------------------------------------------------

def _call_granite(
    text: str,
) -> str:
    """
    Send text to the local IBM Granite model through Ollama.
    """

    _check_ollama()

    payload = {
        "model": MODEL_NAME,

        "messages": [
            {
                "role": "system",
                "content": _SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": _build_user_message(text),
            },
        ],

        "stream": False,

        # Ask Ollama for JSON output.
        "format": "json",

        "options": {
            "temperature": 0.1,
            "num_predict": 600,
        },
    }

    try:

        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=180,
        )

        response.raise_for_status()

    except requests.exceptions.ConnectionError as exc:
        raise AnalysisError(
            "Cannot connect to Ollama. "
            "Make sure Ollama is running."
        ) from exc

    except requests.exceptions.Timeout as exc:
        raise AnalysisError(
            "Granite analysis timed out. "
            "The local model may need more time."
        ) from exc

    except requests.exceptions.HTTPError as exc:
        raise AnalysisError(
            f"Ollama returned an HTTP error: "
            f"{exc}"
        ) from exc

    except requests.exceptions.RequestException as exc:
        raise AnalysisError(
            f"Ollama request failed: {exc}"
        ) from exc

    try:

        result = response.json()

    except ValueError as exc:
        raise AnalysisError(
            "Ollama returned invalid JSON."
        ) from exc

    try:

        raw_content = (
            result
            .get("message", {})
            .get("content", "")
        )

    except AttributeError as exc:
        raise AnalysisError(
            "Unexpected response received from Ollama."
        ) from exc

    if not raw_content:
        raise AnalysisError(
            "Granite returned an empty response."
        )

    return raw_content


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyse_text(
    text: str,
) -> ThreatAnalysis:
    """
    Analyse extracted text for cybersecurity threats.

    Parameters
    ----------
    text:
        Plain-text content extracted from the uploaded file.

    Returns
    -------
    ThreatAnalysis:
        Dictionary containing:
        - risk_level
        - threat_category
        - explanation
        - recommendations

    Raises
    ------
    AnalysisError:
        If Ollama or Granite fails.
    """

    # No text to analyse.
    if not text or not text.strip():

        return ThreatAnalysis(
            risk_level="safe",

            threat_category="No Content",

            explanation=(
                "No readable text was found in the file. "
                "The image may be blank, contain only graphics, "
                "or the text could not be extracted by OCR."
            ),

            recommendations=[
                "Verify the file contains the content you intended to scan.",
                "Try a higher-resolution version of the image.",
                "Contact support if the problem persists.",
            ],
        )

    # Call local IBM Granite.
    raw_content = _call_granite(text)

    # Convert Granite's response into JSON.
    parsed = _extract_json(raw_content)

    # Validate the result.
    return _validate_and_normalise(parsed)