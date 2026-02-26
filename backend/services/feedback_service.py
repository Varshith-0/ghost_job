"""
JobShield AI — Feedback Service (RLHF-style Dynamic Few-Shot Learning)

Stores user feedback on predictions and enriches future prompts with
the most relevant past corrections.  Because feedback is injected into
the prompt at inference time (not stored per-model), ALL models benefit
instantly from every single piece of feedback.

Storage: a local JSON file (`feedback_store.json`).
"""

from __future__ import annotations

import json
import logging
import os
import hashlib
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────
_STORE_DIR = Path(__file__).resolve().parent.parent / "data"
_STORE_FILE = _STORE_DIR / "feedback_store.json"
_PATTERNS_FILE = _STORE_DIR / "learned_patterns.json"


# ── Helpers ───────────────────────────────────────────────────

def _ensure_store() -> None:
    """Create the data directory and empty store file if missing."""
    _STORE_DIR.mkdir(parents=True, exist_ok=True)
    if not _STORE_FILE.exists():
        _STORE_FILE.write_text("[]", encoding="utf-8")
    if not _PATTERNS_FILE.exists():
        _PATTERNS_FILE.write_text(
            json.dumps({"fraud_patterns": [], "legit_patterns": []}, indent=2),
            encoding="utf-8",
        )


def _load_entries() -> list[dict[str, Any]]:
    _ensure_store()
    try:
        return json.loads(_STORE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_entries(entries: list[dict[str, Any]]) -> None:
    _ensure_store()
    _STORE_FILE.write_text(json.dumps(entries, indent=2), encoding="utf-8")


def _load_patterns() -> dict[str, list[str]]:
    _ensure_store()
    try:
        return json.loads(_PATTERNS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"fraud_patterns": [], "legit_patterns": []}


def _save_patterns(patterns: dict[str, list[str]]) -> None:
    _ensure_store()
    _PATTERNS_FILE.write_text(json.dumps(patterns, indent=2), encoding="utf-8")


def _text_hash(text: str) -> str:
    """Short deterministic hash of the job text for dedup / lookup."""
    return hashlib.sha256(text.strip().lower().encode()).hexdigest()[:16]


def _simple_similarity(a: str, b: str) -> float:
    """Cheap word-overlap Jaccard similarity (no external deps)."""
    wa = set(a.lower().split())
    wb = set(b.lower().split())
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


# ── Public API ────────────────────────────────────────────────

def add_feedback(
    job_text: str,
    original_score: int,
    original_risk: str,
    original_reasons: list[str],
    corrected_score: int,
    corrected_risk: str,
    user_explanation: str,
    is_fraud: bool,
    model_used: str = "unknown",
) -> dict[str, Any]:
    """
    Store a piece of user feedback and update learned patterns.

    Returns the saved feedback entry.
    """
    entries = _load_entries()

    entry: dict[str, Any] = {
        "id": _text_hash(job_text) + f"-{int(time.time())}",
        "timestamp": time.time(),
        "job_text_preview": job_text[:500],
        "job_text_hash": _text_hash(job_text),
        "model_used": model_used,
        "original": {
            "fraud_score": original_score,
            "risk_level": original_risk,
            "reasons": original_reasons,
        },
        "corrected": {
            "fraud_score": corrected_score,
            "risk_level": corrected_risk,
            "is_fraud": is_fraud,
        },
        "user_explanation": user_explanation,
    }

    entries.append(entry)
    _save_entries(entries)

    # Update learned patterns from user explanation
    _update_patterns(user_explanation, is_fraud)

    logger.info(
        "Feedback stored (score %d→%d, %s). Total entries: %d",
        original_score, corrected_score,
        "fraud" if is_fraud else "legit",
        len(entries),
    )

    return entry


def _update_patterns(explanation: str, is_fraud: bool) -> None:
    """Extract and store new patterns from the user's explanation."""
    if not explanation or len(explanation.strip()) < 10:
        return

    patterns = _load_patterns()
    key = "fraud_patterns" if is_fraud else "legit_patterns"

    # Avoid exact duplicates
    normalised = explanation.strip().lower()
    existing = {p.lower() for p in patterns[key]}
    if normalised not in existing:
        patterns[key].append(explanation.strip())
        # Keep a reasonable cap
        if len(patterns[key]) > 200:
            patterns[key] = patterns[key][-200:]
        _save_patterns(patterns)


def get_relevant_feedback(job_text: str, top_k: int = 3) -> list[dict[str, Any]]:
    """
    Retrieve the top-k most relevant past feedback entries for a given
    job text, using word-overlap similarity.
    """
    entries = _load_entries()
    if not entries:
        return []

    scored = []
    for entry in entries:
        sim = _simple_similarity(job_text, entry.get("job_text_preview", ""))
        scored.append((sim, entry))

    scored.sort(key=lambda x: x[0], reverse=True)

    # Only include entries with meaningful similarity
    return [e for sim, e in scored[:top_k] if sim > 0.05]


def build_feedback_prompt_section(job_text: str) -> str:
    """
    Build a prompt section with relevant past feedback examples and
    learned patterns.  This gets injected into every LLM call so that
    ALL models benefit instantly.
    """
    parts: list[str] = []

    # ── Learned patterns ──────────────────────────────────────
    patterns = _load_patterns()
    fraud_pats = patterns.get("fraud_patterns", [])[-10:]   # last 10
    legit_pats = patterns.get("legit_patterns", [])[-10:]

    if fraud_pats or legit_pats:
        parts.append("=== LEARNED FROM USER FEEDBACK ===")
        if fraud_pats:
            parts.append("Known FRAUD indicators (from real users):")
            for p in fraud_pats:
                parts.append(f"  - {p}")
        if legit_pats:
            parts.append("Known LEGITIMATE indicators (from real users):")
            for p in legit_pats:
                parts.append(f"  - {p}")
        parts.append("")

    # ── Relevant few-shot examples ────────────────────────────
    examples = get_relevant_feedback(job_text, top_k=3)
    if examples:
        parts.append("=== PAST CORRECTIONS (learn from these) ===")
        for i, ex in enumerate(examples, 1):
            orig = ex.get("original", {})
            corr = ex.get("corrected", {})
            explanation = ex.get("user_explanation", "")
            preview = ex.get("job_text_preview", "")[:200]

            parts.append(f"Example {i}:")
            parts.append(f"  Posting snippet: \"{preview}\"")
            parts.append(
                f"  Model predicted: score={orig.get('fraud_score')}, "
                f"risk={orig.get('risk_level')}"
            )
            parts.append(
                f"  User corrected:  score={corr.get('fraud_score')}, "
                f"risk={corr.get('risk_level')}, "
                f"is_fraud={corr.get('is_fraud')}"
            )
            if explanation:
                parts.append(f"  User explanation: \"{explanation}\"")
            parts.append("")

    if not parts:
        return ""

    return "\n".join(parts)


def get_feedback_stats() -> dict[str, Any]:
    """Return statistics about collected feedback."""
    entries = _load_entries()
    patterns = _load_patterns()

    total = len(entries)
    if total == 0:
        return {
            "total_feedback": 0,
            "fraud_corrections": 0,
            "legit_corrections": 0,
            "avg_score_delta": 0,
            "fraud_patterns_count": len(patterns.get("fraud_patterns", [])),
            "legit_patterns_count": len(patterns.get("legit_patterns", [])),
        }

    fraud_count = sum(
        1 for e in entries if e.get("corrected", {}).get("is_fraud", False)
    )
    legit_count = total - fraud_count

    deltas = [
        abs(
            e.get("corrected", {}).get("fraud_score", 0)
            - e.get("original", {}).get("fraud_score", 0)
        )
        for e in entries
    ]
    avg_delta = round(sum(deltas) / len(deltas), 1) if deltas else 0

    return {
        "total_feedback": total,
        "fraud_corrections": fraud_count,
        "legit_corrections": legit_count,
        "avg_score_delta": avg_delta,
        "fraud_patterns_count": len(patterns.get("fraud_patterns", [])),
        "legit_patterns_count": len(patterns.get("legit_patterns", [])),
    }
