"""
JobShield AI — Text Service

Pre-processes raw job-posting text before sending it to the LLM.
"""

from __future__ import annotations

import re
import logging

from config import get_settings

logger = logging.getLogger(__name__)


def clean_text(raw: str) -> str:
    """Normalise whitespace, strip control characters, and truncate if needed."""
    settings = get_settings()

    # Remove null bytes and non-printable chars (keep newlines/tabs)
    text = re.sub(r"[^\x20-\x7E\n\t]", " ", raw)

    # Collapse runs of whitespace (but preserve paragraph breaks)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    if len(text) > settings.MAX_TEXT_LENGTH:
        logger.warning(
            "Text truncated from %d to %d characters",
            len(text),
            settings.MAX_TEXT_LENGTH,
        )
        text = text[: settings.MAX_TEXT_LENGTH]

    return text


def validate_text(text: str) -> str | None:
    """Return an error message if the text is unsuitable, else ``None``."""
    if not text or len(text.strip()) < 20:
        return "The provided text is too short for a meaningful analysis (minimum 20 characters)."
    return None
