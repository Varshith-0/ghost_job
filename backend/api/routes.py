"""
JobShield AI — API Routes
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from models.schemas import (
    AnalysisResponse,
    AnalysisResult,
    HealthResponse,
    ModelInfo,
    ModelsResponse,
    FeedbackRequest,
    FeedbackResponse,
    FeedbackStatsResponse,
)
from services.llm_service import (
    analyse_job_text,
    list_ollama_models,
    get_avg_time,
    get_all_model_stats,
)
from services.feedback_service import (
    add_feedback,
    get_feedback_stats,
)
from services.pdf_service import extract_text_from_pdf
from services.text_service import clean_text, validate_text
from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Health ────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        model=settings.OLLAMA_MODEL,
    )


# ── Available Models ──────────────────────────────────────────

@router.get("/models", response_model=ModelsResponse, tags=["system"])
async def get_models():
    """Return locally-available Ollama models with average response times."""
    settings = get_settings()
    raw_models = await list_ollama_models()
    stats = get_all_model_stats()

    models = [
        ModelInfo(
            name=m["name"],
            size_mb=round(m.get("size", 0) / (1024 * 1024)),
            avg_time=stats.get(m["name"]),
        )
        for m in raw_models
    ]

    # Sort: smallest first (generally fastest)
    models.sort(key=lambda m: m.size_mb)

    return ModelsResponse(models=models, default=settings.OLLAMA_MODEL)


# ── Unified Analyze Endpoint ─────────────────────────────────

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    tags=["analysis"],
    summary="Analyse a job posting from text, PDF, or both",
)
async def analyze(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
):
    """
    Accepts an optional PDF file **and/or** optional text input.
    At least one must be provided.  If both are given the PDF text
    is extracted and **prepended** to the supplied text.
    """
    settings = get_settings()
    combined_text = ""

    # ── PDF path ──────────────────────────────────
    if file is not None:
        # Validate content type
        if file.content_type not in ("application/pdf",):
            raise HTTPException(
                status_code=422,
                detail="Only PDF files are accepted.",
            )

        contents = await file.read()
        max_bytes = settings.MAX_PDF_SIZE_MB * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=422,
                detail=f"PDF exceeds the {settings.MAX_PDF_SIZE_MB} MB limit.",
            )

        try:
            pdf_text = await extract_text_from_pdf(contents)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        combined_text += pdf_text

    # ── Text path ─────────────────────────────────
    if text:
        combined_text = (combined_text + "\n\n" + text).strip() if combined_text else text

    # ── Guard: at least one input ─────────────────
    if not combined_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Provide at least a PDF file or text input.",
        )

    # ── Clean, validate, analyse ──────────────────
    combined_text = clean_text(combined_text)
    error = validate_text(combined_text)
    if error:
        raise HTTPException(status_code=422, detail=error)

    try:
        result = await analyse_job_text(combined_text, model=model)
        return AnalysisResponse(success=True, data=AnalysisResult(**result))
    except Exception as exc:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Feedback (RLHF-style) ────────────────────────────────────

@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    tags=["feedback"],
    summary="Submit user feedback to teach all models",
)
async def submit_feedback(body: FeedbackRequest):
    """
    Accept a user correction on a previous analysis.
    The feedback is stored and used to enrich future prompts for
    ALL models (model-agnostic few-shot learning).
    """
    try:
        entry = add_feedback(
            job_text=body.job_text,
            original_score=body.original_score,
            original_risk=body.original_risk,
            original_reasons=body.original_reasons,
            corrected_score=body.corrected_score,
            corrected_risk=body.corrected_risk,
            user_explanation=body.user_explanation,
            is_fraud=body.is_fraud,
            model_used=body.model_used,
        )
        return FeedbackResponse(
            success=True,
            message="Feedback saved — all models will learn from this!",
            feedback_id=entry.get("id"),
        )
    except Exception as exc:
        logger.exception("Feedback submission failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get(
    "/feedback/stats",
    response_model=FeedbackStatsResponse,
    tags=["feedback"],
    summary="Get feedback statistics",
)
async def feedback_stats():
    """Return aggregated stats about collected user feedback."""
    return FeedbackStatsResponse(**get_feedback_stats())
