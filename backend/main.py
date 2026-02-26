"""
JobShield AI — Application Entry Point
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from api.routes import router as api_router
from services.llm_service import preload_model

# ── Logging ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App factory ───────────────────────────────────────────────
settings = get_settings()


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Preload the LLM into memory at startup so the first request is fast."""
    logger.info("Preloading model %s…", settings.OLLAMA_MODEL)
    await preload_model()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["system"])
async def root():
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION} is running."}
