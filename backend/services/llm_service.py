"""
JobShield AI — LLM Service

Communicates with a local Ollama instance.
Optimised for speed.  Tracks per-model average response times.
Includes retry logic, structured prompt, and graceful fallback.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from typing import Any

import httpx

from config import get_settings
from utils.json_parser import parse_llm_json, fallback_result
from services.feedback_service import build_feedback_prompt_section

logger = logging.getLogger(__name__)

# ── Compact prompt — every token counts for speed ─────────────
PROMPT_TEMPLATE = """\
Analyze this job posting for fraud. Return ONLY valid JSON, no other text.

Scoring: fraud_score 0-100, risk_level Low(0-30)/Medium(31-70)/High(71-100).
Give 3-5 short reasons and list suspicious phrases from the text.

JSON format:
{{"fraud_score":N,"risk_level":"Low|Medium|High","reasons":["..."],"suspicious_phrases":["..."]}}
{feedback_context}
Job posting:
{job_text}
"""

# ── Per-model timing tracker ──────────────────────────────────
_model_times: dict[str, list[float]] = defaultdict(list)
_MAX_SAMPLES = 20  # rolling window


def record_model_time(model: str, seconds: float) -> None:
    """Record a response time sample for a model."""
    samples = _model_times[model]
    samples.append(seconds)
    if len(samples) > _MAX_SAMPLES:
        _model_times[model] = samples[-_MAX_SAMPLES:]


def get_avg_time(model: str) -> float | None:
    """Return rolling average response time for a model, or None if no data."""
    samples = _model_times.get(model)
    if not samples:
        return None
    return round(sum(samples) / len(samples), 1)


def get_all_model_stats() -> dict[str, float | None]:
    """Return avg times for every model we've seen."""
    return {m: get_avg_time(m) for m in _model_times}


# ── Reusable HTTP client ──────────────────────────────────────
_http_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    """Lazy-init a shared async HTTP client."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        settings = get_settings()
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.OLLAMA_TIMEOUT, connect=10),
        )
    return _http_client


# ── Ollama helpers ────────────────────────────────────────────

async def list_ollama_models() -> list[dict[str, Any]]:
    """Fetch the list of locally-available Ollama models."""
    settings = get_settings()
    url = f"{settings.OLLAMA_BASE_URL}/api/tags"
    try:
        client = _get_client()
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json().get("models", [])
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to list Ollama models: %s", exc)
        return []


async def preload_model(model: str | None = None) -> None:
    """Send an empty keep-alive so the model is loaded in memory."""
    settings = get_settings()
    model = model or settings.OLLAMA_MODEL
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    try:
        client = _get_client()
        await client.post(url, json={
            "model": model,
            "prompt": "",
            "keep_alive": "10m",
        })
        logger.info("Model %s preloaded into memory.", model)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Model preload failed (non-fatal): %s", exc)


async def _call_ollama(prompt: str, model: str | None = None) -> str | None:
    """Send a prompt to the Ollama generate endpoint and return the response text."""
    settings = get_settings()
    model = model or settings.OLLAMA_MODEL
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "10m",
        "options": {
            "temperature": 0.2,
            "num_predict": 512,
            "num_ctx": 2048,
            "top_k": 20,
            "top_p": 0.8,
            "repeat_penalty": 1.1,
        },
    }
    try:
        client = _get_client()
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "")
    except httpx.HTTPStatusError as exc:
        logger.error("Ollama HTTP error %s: %s", exc.response.status_code, exc)
    except httpx.RequestError as exc:
        logger.error("Ollama request error: %s", exc)
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected Ollama error: %s", exc)
    return None


async def analyse_job_text(
    job_text: str,
    model: str | None = None,
) -> dict[str, Any]:
    """Analyse a job posting using the local LLM.

    * Accepts an optional *model* override.
    * Tracks wall-clock time per model.
    * Retries once on parse failure.
    * Returns a safe fallback if both attempts fail.
    """
    settings = get_settings()
    model = model or settings.OLLAMA_MODEL

    # Truncate — speed matters
    if len(job_text) > 2500:
        job_text = job_text[:2500]

    # Inject relevant user feedback so ALL models learn instantly
    feedback_section = build_feedback_prompt_section(job_text)
    prompt = PROMPT_TEMPLATE.format(
        job_text=job_text,
        feedback_context=feedback_section,
    )

    t0 = time.monotonic()

    for attempt in range(1, 3):  # max 2 attempts
        logger.info("LLM analysis attempt %d (model=%s)", attempt, model)
        raw = await _call_ollama(prompt, model=model)
        if raw is None:
            logger.warning("Ollama returned no response on attempt %d", attempt)
            continue

        result = parse_llm_json(raw)
        if result is not None:
            elapsed = round(time.monotonic() - t0, 1)
            record_model_time(model, elapsed)
            logger.info(
                "LLM analysis succeeded on attempt %d (%.1fs, model=%s)",
                attempt, elapsed, model,
            )
            return result

        logger.warning("JSON parse failed on attempt %d — retrying", attempt)

    elapsed = round(time.monotonic() - t0, 1)
    record_model_time(model, elapsed)
    logger.error("Both LLM attempts failed; returning fallback.")
    return fallback_result()
