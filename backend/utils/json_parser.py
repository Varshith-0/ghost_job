"""
JobShield AI — Robust JSON parser for LLM output.

The LLM sometimes wraps its JSON in markdown fences or adds trailing
commentary.  This module extracts the first valid JSON object from
arbitrary text and validates it against the expected schema.
"""

from __future__ import annotations

import json
import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Precompiled patterns for extracting JSON
_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*(\{.*?\})\s*```", re.DOTALL)
_JSON_OBJECT_RE = re.compile(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", re.DOTALL)


def _extract_json_string(raw: str) -> str | None:
    """Try multiple strategies to pull a JSON object string from LLM output."""
    # Strategy 1: fenced code block
    m = _JSON_BLOCK_RE.search(raw)
    if m:
        return m.group(1).strip()

    # Strategy 2: first bare JSON object
    m = _JSON_OBJECT_RE.search(raw)
    if m:
        return m.group(0).strip()

    return None


def _validate_structure(data: dict[str, Any]) -> dict[str, Any]:
    """Normalise and validate the expected keys/types.

    Performs light coercion so minor LLM deviations don't cause failures.
    """
    # fraud_score
    score = data.get("fraud_score")
    if score is None:
        raise ValueError("Missing 'fraud_score'")
    score = int(score)
    score = max(0, min(100, score))
    data["fraud_score"] = score

    # risk_level — derive from score if missing/invalid
    valid_levels = {"Low", "Medium", "High"}
    level = data.get("risk_level", "")
    if level not in valid_levels:
        if score <= 30:
            level = "Low"
        elif score <= 70:
            level = "Medium"
        else:
            level = "High"
    data["risk_level"] = level

    # reasons — guarantee list of 1-5 strings
    reasons = data.get("reasons", [])
    if not isinstance(reasons, list):
        reasons = [str(reasons)]
    reasons = [str(r) for r in reasons if str(r).strip()][:5]
    if not reasons:
        reasons = ["Insufficient evidence to provide detailed reasoning."]
    data["reasons"] = reasons

    # suspicious_phrases
    phrases = data.get("suspicious_phrases", [])
    if not isinstance(phrases, list):
        phrases = [str(phrases)]
    data["suspicious_phrases"] = [str(p) for p in phrases]

    return data


def parse_llm_json(raw_text: str) -> dict[str, Any] | None:
    """Parse and validate the LLM's raw text output into a clean dict.

    Returns ``None`` if the text cannot be parsed at all.
    """
    json_str = _extract_json_string(raw_text)
    if json_str is None:
        logger.warning("Could not locate JSON object in LLM output.")
        return None

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as exc:
        logger.warning("JSON decode failed: %s", exc)
        return None

    if not isinstance(data, dict):
        logger.warning("Parsed JSON is not a dict: %s", type(data))
        return None

    try:
        return _validate_structure(data)
    except (ValueError, TypeError, KeyError) as exc:
        logger.warning("JSON structure validation failed: %s", exc)
        return None


def fallback_result() -> dict[str, Any]:
    """Return a safe fallback when the LLM produces no usable output."""
    return {
        "fraud_score": 0,
        "risk_level": "Low",
        "reasons": ["Model response invalid"],
        "suspicious_phrases": [],
    }
