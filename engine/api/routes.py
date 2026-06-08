"""API Routes — REST endpoints for the Hyperframe Engine.

Endpoints:
- GET  /health        — Service health check
- GET  /templates     — List all motion templates
- POST /generate      — Generate a video from hyperframe sequence
- POST /preview       — Preview a single interpolated frame
- GET  /export/{id}   — Get generated video file
"""

from __future__ import annotations

import io
import json
import os
import tempfile
import time
import uuid
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from hyperframe import HyperframeEngine
from models.hyperframe import (
    EasingType,
    EffectType,
    FrameState,
    GenerateRequest,
    GenerateResponse,
    HealthResponse,
    HyperFrame,
    HyperFrameSequence,
    MotionTemplate,
    PreviewRequest,
)
from templates import list_templates, get_template, get_categories

# ---------------------------------------------------------------------------
# Router & engine instance
# ---------------------------------------------------------------------------

router = APIRouter()
engine = HyperframeEngine()

# In-memory store for generated videos (in production, use object storage)
_generated_videos: Dict[str, bytes] = {}

# Output directory for exports
OUTPUT_DIR = Path(tempfile.gettempdir()) / "hyperforge_exports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _check_ffmpeg() -> bool:
    """Check if FFmpeg is available on the system."""
    import subprocess
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def _check_opencv() -> bool:
    """Check if OpenCV is importable."""
    try:
        import cv2  # noqa: F401
        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint — returns engine status and capabilities."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        ffmpeg_available=_check_ffmpeg(),
        opencv_available=_check_opencv(),
        frame_rate={
            "supported_fps": [24, 25, 30, 60],
            "max_resolution": "1080x1920",
        },
    )


@router.get("/templates")
async def list_all_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """List all available motion templates, optionally filtered by category."""
    templates = list_templates(category)
    categories = get_categories()
    return {
        "templates": templates,
        "categories": categories,
        "count": len(templates),
    }


@router.get("/templates/{template_id}")
async def get_template_by_id(template_id: str):
    """Get a specific motion template by ID."""
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return template


@router.post("/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """Generate a video from a hyperframe sequence.

    Applies frame interpolation, renders all frames, and composites
    into a video file using either FFmpeg or PIL-based fallback.
    """
    start_time = time.time()

    # Apply template if specified
    sequence = request.sequence
    if request.template_id:
        template = get_template(request.template_id)
        if template and template.default_frames:
            # Prepend template frames to the sequence
            sequence.frames = template.default_frames + sequence.frames

    # Initialize engine if needed
    if not engine._initialized:
        engine.initialize()

    # Generate frames
    frames = engine.generate_frames(sequence)
    total_frames = len(frames)
    duration_sec = engine.estimate_duration(sequence)

    # Try to use FFmpeg for video encoding
    video_bytes = None
    export_id = str(uuid.uuid4())[:8]

    if _check_ffmpeg():
        video_bytes = _encode_with_ffmpeg(
            frames, sequence.fps, sequence.width, sequence.height,
            request.output_format, request.quality, export_id,
        )
    else:
        # Fallback: encode as animated WebP / GIF using PIL
        video_bytes = _encode_fallback(frames, sequence.fps, request.output_format, export_id)

    # Store in memory
    _generated_videos[export_id] = video_bytes

    elapsed = (time.time() - start_time) * 1000  # ms

    return GenerateResponse(
        video_url=f"/export/{export_id}.{request.output_format}",
        preview_url=f"/preview/{export_id}.png",
        duration_seconds=duration_sec,
        total_frames=total_frames,
        generation_time_ms=round(elapsed, 2),
        hyperframes_used=len(sequence.frames),
    )


@router.post("/preview")
async def preview_frame(request: PreviewRequest):
    """Preview a single interpolated frame at a given time position."""
    from io import BytesIO

    hf = request.frame
    state = interpolate_frame_state(hf.start, hf.end, request.t, hf.easing)
    img = render_frame(state, 1080, 1920, hf.effect)

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@router.get("/export/{export_id}")
async def get_export(export_id: str):
    """Get a generated video file by its export ID."""
    # Strip extension for lookup
    base_id = export_id.rsplit(".", 1)[0]

    if base_id in _generated_videos:
        video_bytes = _generated_videos[base_id]
        ext = export_id.rsplit(".", 1)[1] if "." in export_id else "mp4"
        media_type = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "gif": "image/gif",
        }.get(ext, "application/octet-stream")

        return StreamingResponse(
            io.BytesIO(video_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="hyperframe_{export_id}"',
            },
        )

    raise HTTPException(status_code=404, detail=f"Export '{export_id}' not found")


# ---------------------------------------------------------------------------
# Video encoding helpers
# ---------------------------------------------------------------------------

def _encode_with_ffmpeg(
    frames: list,
    fps: int,
    width: int,
    height: int,
    output_format: str,
    quality: int,
    export_id: str,
) -> bytes:
    """Encode frames into a video using FFmpeg."""
    import subprocess

    # Save frames as temporary PNGs
    frame_dir = OUTPUT_DIR / f"frames_{export_id}"
    frame_dir.mkdir(parents=True, exist_ok=True)

    for i, frame in enumerate(frames):
        frame_path = frame_dir / f"frame_{i:06d}.png"
        frame.save(str(frame_path))

    output_path = OUTPUT_DIR / f"{export_id}.{output_format}"

    # Build FFmpeg command
    crf = max(0, min(51, quality))

    if output_format == "gif":
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", str(frame_dir / "frame_%06d.png"),
            "-vf", f"fps={fps},scale={width}:{height}:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
            "-loop", "0",
            str(output_path),
        ]
    elif output_format == "webm":
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", str(frame_dir / "frame_%06d.png"),
            "-c:v", "libvpx-vp9",
            "-crf", str(crf),
            "-b:v", "0",
            "-pix_fmt", "yuva420p",
            str(output_path),
        ]
    else:  # mp4
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(fps),
            "-i", str(frame_dir / "frame_%06d.png"),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", str(crf),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            str(output_path),
        ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        raise RuntimeError("FFmpeg encoding timed out")
    finally:
        # Clean up frame directory
        import shutil
        shutil.rmtree(frame_dir, ignore_errors=True)

    # Read the output file
    with open(str(output_path), "rb") as f:
        video_bytes = f.read()

    # Clean up output file
    output_path.unlink(missing_ok=True)

    return video_bytes


def _encode_fallback(frames: list, fps: int, output_format: str, export_id: str) -> bytes:
    """Fallback encoding using PIL (GIF/WebP). No FFmpeg required."""
    from io import BytesIO
    from PIL import Image

    buf = BytesIO()

    if output_format == "gif":
        # Save as GIF
        frames_pil = [f.convert("RGBA") for f in frames]
        # Convert first frame to RGB with palette
        first = frames_pil[0].convert("P", palette=Image.Palette.ADAPTIVE)
        others = [f.convert("P", palette=first.palette) if f.mode != "P" else f for f in frames_pil[1:]]
        first.save(
            buf,
            format="GIF",
            save_all=True,
            append_images=others,
            duration=1000 // fps,
            loop=0,
            optimize=True,
        )
    else:
        # Save as animated WebP
        frames_pil = [f.convert("RGBA") for f in frames]
        frames_pil[0].save(
            buf,
            format="WEBP",
            save_all=True,
            append_images=frames_pil[1:],
            duration=1000 // fps,
            loop=0,
            lossless=False,
            quality=80,
        )

    buf.seek(0)
    return buf.getvalue()


# Need these for /preview endpoint
from hyperframe import interpolate_frame_state, render_frame