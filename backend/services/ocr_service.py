"""
JobShield AI — OCR Service

Extracts text from uploaded images using Tesseract OCR via pytesseract.
Images are processed entirely in memory — nothing is saved to disk.
"""

from __future__ import annotations

import io
import logging

from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


async def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extract text from an image byte stream using Tesseract OCR.

    The image is loaded into memory via Pillow and never written to disk.
    Raises ``ValueError`` when no readable text is found.
    """
    try:
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.error("Failed to open image: %s", exc)
        raise ValueError("The uploaded file is not a valid image.") from exc

    try:
        text = pytesseract.image_to_string(image)
    except Exception as exc:
        logger.error("OCR extraction failed: %s", exc)
        raise ValueError(
            "OCR failed. Make sure Tesseract is installed "
            "(brew install tesseract on macOS)."
        ) from exc

    text = text.strip()
    if not text:
        raise ValueError(
            "No readable text found in the image. "
            "The image may be too blurry or contain no text."
        )

    logger.info("OCR extracted %d characters from image", len(text))
    return text
