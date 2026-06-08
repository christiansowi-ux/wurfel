"""HyperForge Studio — Hyperframe Engine

FastAPI application entry point.

Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
from pathlib import Path

# Ensure the engine package is importable
sys.path.insert(0, str(Path(__file__).parent))

from api.config import create_app
from api.routes import router

# Create the FastAPI application
app = create_app()

# Register API routes
app.include_router(router, prefix="/api/v1")

# Root redirect
from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )