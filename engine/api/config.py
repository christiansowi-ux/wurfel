"""FastAPI application configuration and setup."""

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from pathlib import Path


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="HyperForge Studio — Hyperframe Engine",
        description="Local AI-powered frame interpolation engine for TikTok video generation.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS — allow frontend connections from any origin during development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Serve static thumbnails
    thumbnails_path = Path(__file__).parent.parent / "assets" / "thumbnails"
    if thumbnails_path.exists():
        app.mount("/thumbnails", StaticFiles(directory=str(thumbnails_path)), name="thumbnails")

    return app
