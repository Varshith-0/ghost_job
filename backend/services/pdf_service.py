"""
JobShield AI — PDF Service

Extracts text content from uploaded PDF files using PyMuPDF (fitz).
"""

from __future__ import annotations

import logging
import io

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from a PDF byte stream.

    Raises ``ValueError`` when the PDF contains no extractable text.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as exc:
        logger.error("Failed to open PDF: %s", exc)
        raise ValueError("The uploaded file is not a valid PDF.") from exc

    pages_text: list[str] = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text and text.strip():
            pages_text.append(text.strip())
        else:
            logger.debug("Page %d: no extractable text", page_num)

    doc.close()

    full_text = "\n\n".join(pages_text).strip()
    if not full_text:
        raise ValueError(
            "No readable text found in the PDF. "
            "The file may be scanned/image-based."
        )

    logger.info(
        "Extracted %d characters from %d page(s)",
        len(full_text),
        len(pages_text),
    )
    return full_text
