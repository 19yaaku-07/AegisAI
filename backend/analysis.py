"""
analysis.py — IBM Watsonx AI threat analysis via ibm-watsonx-ai SDK.

Required environment variables:
    IBM_WATSONX_API_KEY      — IAM API key from IBM Cloud
    IBM_WATSONX_URL          — Service URL (e.g. https://us-south.ml.cloud.ibm.com)
    IBM_WATSONX_PROJECT_ID   — Project ID from Watsonx project settings
    IBM_WATSONX_MODEL_ID     — (optional) model ID, default: ibm/granite-3-8b-instruct
"""

from __future__ import annotations

import json
import logging
import os
import re
import textwrap
from typing import TypedDict

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public exception
# ---------------------------------------------------------------------------

class AnalysisError(Exception):
    """Raised when IBM Watsonx analysis fails."""


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
    excerpt = text[:4000]
    if len(text) > 4000:
        excerpt += "\n[... text truncated for analysis ...]"
    return "Analyse this text for cybersecurity threats:\n\n" + excerpt


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> dict:
    """Extract the first valid JSON object from the model's response."""
    if not raw:
        raise AnalysisError("Model returned an empty response.")

    raw = raw.strip()
    raw = re.sub(r"```(?:json)?", "", raw, flags=re.IGNORECASE)
    raw = raw.replace("```", "").strip()

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    raise AnalysisError(
        f"Model did not return valid JSON. Raw response: {raw[:500]!r}"
    )


# ---------------------------------------------------------------------------
# Validate and normalise result
# ---------------------------------------------------------------------------

def _validate_and_normalise(data: dict) -> ThreatAnalysis:
    risk = str(data.get("risk_level", "")).lower().strip()
    if risk not in VALID_RISK_LEVELS:
        logger.warning("Model returned invalid risk level %r. Defaulting to medium.", risk)
        risk = "medium"

    category = str(data.get("threat_category", "Unknown")).strip() or "Unknown"
    explanation = str(data.get("explanation", "")).strip()
    if not explanation:
        explanation = "Analysis completed. Review the content carefully before taking action."

    recommendations = data.get("recommendations", [])
    if not isinstance(recommendations, list):
        recommendations = [str(recommendations)]
    recommendations = [str(item).strip() for item in recommendations if str(item).strip()]

    defaults = [
        "Treat this content with caution.",
        "Do not click links or download unexpected attachments.",
        "Report suspicious content if you are unsure.",
    ]
    while len(recommendations) < 3:
        recommendations.append(defaults[len(recommendations)])

    return ThreatAnalysis(
        risk_level=risk,
        threat_category=category,
        explanation=explanation,
        recommendations=recommendations[:3],
    )


# ---------------------------------------------------------------------------
# Call IBM Watsonx
# ---------------------------------------------------------------------------

def _call_watsonx(text: str) -> str:
    """Send text to IBM Watsonx and return the raw model response string."""
    api_key    = os.environ.get("IBM_WATSONX_API_KEY", "").strip()
    url        = os.environ.get("IBM_WATSONX_URL", "https://us-south.ml.cloud.ibm.com").strip()
    project_id = os.environ.get("IBM_WATSONX_PROJECT_ID", "").strip()
    model_id   = os.environ.get("IBM_WATSONX_MODEL_ID", "ibm/granite-3-8b-instruct").strip()

    if not api_key:
        raise AnalysisError(
            "IBM_WATSONX_API_KEY is not set. "
            "Please configure the environment variable."
        )
    if not project_id:
        raise AnalysisError(
            "IBM_WATSONX_PROJECT_ID is not set. "
            "Please configure the environment variable."
        )

    try:
        from ibm_watsonx_ai import APIClient, Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference
        from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
    except ImportError as exc:
        raise AnalysisError(
            "ibm-watsonx-ai package is not installed. "
            "Run: pip install ibm-watsonx-ai"
        ) from exc

    try:
        credentials = Credentials(url=url, api_key=api_key)
        client      = APIClient(credentials)
        model       = ModelInference(
            model_id   = model_id,
            api_client = client,
            project_id = project_id,
            params     = {
                GenParams.MAX_NEW_TOKENS: 600,
                GenParams.TEMPERATURE:    0.1,
            },
        )
        prompt = f"{_SYSTEM_PROMPT}\n\n{_build_user_message(text)}"
        result = model.generate_text(prompt=prompt)
        return result if isinstance(result, str) else str(result)

    except AnalysisError:
        raise
    except Exception as exc:
        raise AnalysisError(f"IBM Watsonx request failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyse_text(text: str) -> ThreatAnalysis:
    """
    Analyse extracted text for cybersecurity threats using IBM Watsonx.

    Returns a ThreatAnalysis dict with risk_level, threat_category,
    explanation, and recommendations.

    Raises AnalysisError on failure.
    """
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

    raw_content = _call_watsonx(text)
    parsed      = _extract_json(raw_content)
    return _validate_and_normalise(parsed)
