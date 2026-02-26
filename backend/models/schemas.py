"""
JobShield AI — Pydantic schemas for request/response models.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Response Models ───────────────────────────────────────────

class AnalysisResult(BaseModel):
    """Structured result returned by the LLM analysis pipeline."""
    fraud_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Fraud likelihood score (0-100).",
    )
    risk_level: str = Field(
        ...,
        pattern=r"^(Low|Medium|High)$",
        description="Risk classification derived from the score.",
    )
    reasons: list[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="Up to five concise reasons supporting the score.",
    )
    suspicious_phrases: list[str] = Field(
        default_factory=list,
        description="Exact phrases from the posting that raise red flags.",
    )


class AnalysisResponse(BaseModel):
    """Top-level API response wrapper."""
    success: bool = True
    data: AnalysisResult | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    """Health-check response."""
    status: str = "ok"
    version: str
    model: str


class ModelInfo(BaseModel):
    """Info about a single available model."""
    name: str
    size_mb: int
    avg_time: float | None = None  # seconds, None if no data yet


class ModelsResponse(BaseModel):
    """List of available Ollama models with timing info."""
    models: list[ModelInfo]
    default: str


# ── Feedback Models ───────────────────────────────────────────

class FeedbackRequest(BaseModel):
    """User feedback on an analysis result (RLHF-style correction)."""
    job_text: str = Field(
        ...,
        min_length=10,
        description="The original job posting text that was analysed.",
    )
    model_used: str = Field(
        default="unknown",
        description="Which model produced the original prediction (feedback teaches ALL models regardless).",
    )
    original_score: int = Field(
        ..., ge=0, le=100,
        description="The fraud score the model originally predicted.",
    )
    original_risk: str = Field(
        ..., pattern=r"^(Low|Medium|High)$",
        description="The risk level the model originally predicted.",
    )
    original_reasons: list[str] = Field(
        default_factory=list,
        description="The reasons the model originally gave.",
    )
    corrected_score: int = Field(
        ..., ge=0, le=100,
        description="The user's corrected fraud score.",
    )
    corrected_risk: str = Field(
        ..., pattern=r"^(Low|Medium|High)$",
        description="The user's corrected risk level.",
    )
    is_fraud: bool = Field(
        ...,
        description="User's verdict: True = this IS fraud, False = this is legitimate.",
    )
    user_explanation: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="User explanation of why this is/isn't fraud.",
    )


class FeedbackResponse(BaseModel):
    """Response after submitting feedback."""
    success: bool = True
    message: str = "Feedback saved — all models will learn from this!"
    feedback_id: str | None = None


class FeedbackStatsResponse(BaseModel):
    """Aggregated feedback statistics."""
    total_feedback: int = 0
    fraud_corrections: int = 0
    legit_corrections: int = 0
    avg_score_delta: float = 0
    fraud_patterns_count: int = 0
    legit_patterns_count: int = 0
