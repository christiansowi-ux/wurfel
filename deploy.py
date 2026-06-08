#!/usr/bin/env python3
"""
HyperForge Studio - Production Deployment Server
Serves both the frontend (React build) and the Hyperframe Engine API on a single port.
"""
import sys
import os
from pathlib import Path

# Add engine to path
sys.path.insert(0, str(Path(__file__).parent / "engine"))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(title="HyperForge Studio", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes (prefix with /api/v1)
app.include_router(router, prefix="/api/v1")

# Serve frontend build
frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("deploy:app", host="0.0.0.0", port=port, log_level="info")