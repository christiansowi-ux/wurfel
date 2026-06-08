"""API Routes — REST endpoints for the Hyperframe Engine.

Endpoints:
- GET  /api/v1/health          — Service health check
- GET  /api/v1/templates       — List all motion templates
- GET  /api/v1/templates/{id}  — Get template by ID
- POST /api/v1/assets          — Upload an image/video asset
- GET  /api/v1/assets/{id}     — Get asset info
- POST /api/v1/generate        — Generate a video from hyperframes + assets
- POST /api/v1/preview         — Preview a single interpolated frame
- GET  /api/v1/generate/progress/{export_id} — Poll generation progress
- GET  /api/v1/export/{id}     — Download generated video
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

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from hyperframe import (
    HyperframeEngine,
    interpolate_frame_state,
    render_frame,
    load_asset,
    store_asset,
    get_asset_info,
    progress_tracker,
)
from models.hyperframe import (
    EasingType,
    EffectType,
    FrameState,
    GenerateRequest,
    GenerateResponse,
    GenerateProgress,
    HealthResponse,
    HyperFrame,
    HyperFrameSequence,
    MotionTemplate,
    PreviewRequest,
    UploadResponse,
    AssetInfo,
)
from templates import list_templates, get_template, get_categories

# ---------------------------------------------------------------------------
# Router & engine instance
# ---------------------------------------------------------------------------

router = APIRouter()
engine = HyperframeEngine()
engine.initialize()

# In-memory store for generated videos
_generated_videos: Dict[str, bytes] = {}

# Output directory for exports
OUTPUT_DIR = Path(tempfile.gettempdir()) / "hyperforge_exports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _check_ffmpeg() -> bool:
    import subprocess
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def _check_opencv() -> bool:
    try:
        import cv2  # noqa: F401
        return True
    except ImportError:
        return False


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        version="0.1.0",
        ffmpeg_available=_check_ffmpeg(),
        opencv_available=_check_opencv(),
        assets_count=len(os.listdir(Path.home() / ".hyperforge" / "assets")) 
            if (Path.home() / ".hyperforge" / "assets").exists() else 0,
        frame_rate={
            "supported_fps": [24, 25, 30, 60],
            "max_resolution": "1080x1920",
        },
    )


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

@router.get("/templates")
async def list_all_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
):
    templates = list_templates(category)
    categories = get_categories()
    return {
        "templates": templates,
        "categories": categories,
        "count": len(templates),
    }


@router.get("/templates/{template_id}")
async def get_template_by_id(template_id: str):
    template = get_template(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return template


# ---------------------------------------------------------------------------
# Assets — Upload & Management
# ---------------------------------------------------------------------------

@router.post("/assets", response_model=UploadResponse)
async def upload_asset(file: UploadFile = File(...)):
    """Upload an image or video asset for use in compositions."""
    # Generate asset ID
    asset_id = str(uuid.uuid4())[:8]
    
    # Read file bytes
    contents = await file.read()
    
    # Determine basic info
    filename = file.filename or "unknown"
    mime_type = file.content_type or "image/png"
    file_size = len(contents)
    
    try:
        # Store via engine (validates it's an image)
        img = engine.store_asset_from_bytes(asset_id, contents)
        width, height = img.size
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    return UploadResponse(
        asset=AssetInfo(
            id=asset_id,
            filename=filename,
            mime_type=mime_type,
            width=width,
            height=height,
            file_size=file_size,
        ),
        url=f"/api/v1/assets/{asset_id}/file",
    )


@router.get("/assets/{asset_id}")
async def get_asset_info_endpoint(asset_id: str):
    """Get metadata about an uploaded asset."""
    info = get_asset_info(asset_id)
    if info is None:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    return info


@router.get("/assets/{asset_id}/file")
async def get_asset_file(asset_id: str):
    """Download the original asset file."""
    asset_dir = Path(os.path.expanduser("~")) / ".hyperforge" / "assets"
    for ext in [".png", ".jpg", ".jpeg", ".webp"]:
        path = asset_dir / f"{asset_id}{ext}"
        if path.exists():
            media_type = {
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
            }.get(ext, "application/octet-stream")
            return FileResponse(str(path), media_type=media_type)
    
    # Try any matching file
    for f in asset_dir.iterdir():
        if f.stem == asset_id:
            return FileResponse(str(f))
    
    raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' file not found")


# ---------------------------------------------------------------------------
# Generate — Full Video Pipeline
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """Generate a video from hyperframe sequence + optional assets.
    
    Supports:
    - Asset-based compositing (real images/videos)
    - Layered composition with z-ordering
    - Frame interpolation for smooth motion
    - FFmpeg or PIL fallback encoding
    - Progress tracking via /generate/progress/{id}
    """
    start_time = time.time()
    
    # Apply template if specified
    sequence = request.sequence
    if request.template_id:
        template = get_template(request.template_id)
        if template and template.default_frames:
            # Prepend template frames to the sequence
            if sequence.layers:
                for layer in sequence.layers:
                    layer.hyperframes = template.default_frames + layer.hyperframes
            else:
                sequence.frames = template.default_frames + sequence.frames
    
    # Initialize engine if needed
    if not engine._initialized:
        engine.initialize()
    
    # Apply interpolation
    if request.interpolation_factor > 1.0:
        sequence = engine.interpolate_sequence(sequence, request.interpolation_factor)
    
    # Create export ID and track progress
    export_id = str(uuid.uuid4())[:8]
    total_frames = engine._count_frames(sequence)
    progress_tracker.create_job(export_id, total_frames, "Rendering frames...")
    
    # Generate frames with progress callback
    def progress_cb(current, total):
        progress_tracker.update(export_id, current, total)
    
    frames = engine.generate_frames(
        sequence,
        progress_callback=progress_cb,
        export_id=export_id,
    )
    total_frames = len(frames)
    duration_sec = engine.estimate_duration(sequence)
    
    # Encode video
    if _check_ffmpeg():
        progress_tracker.update(export_id, total_frames, total_frames, "Encoding video with FFmpeg...")
        video_bytes = _encode_with_ffmpeg(
            frames, sequence.fps, sequence.width, sequence.height,
            request.output_format, request.quality, export_id,
        )
    else:
        progress_tracker.update(export_id, total_frames, total_frames, "Encoding video (PIL fallback)...")
        video_bytes = _encode_fallback(frames, sequence.fps, request.output_format, export_id)
    
    # Store video
    _generated_videos[export_id] = video_bytes
    progress_tracker.complete(export_id, "Generation complete")
    
    elapsed = (time.time() - start_time) * 1000  # ms
    
    return GenerateResponse(
        video_url=f"/api/v1/export/{export_id}.{request.output_format}",
        preview_url=f"/api/v1/preview/{export_id}.png",
        duration_seconds=duration_sec,
        total_frames=total_frames,
        generation_time_ms=round(elapsed, 2),
        hyperframes_used=len(sequence.frames) if sequence.frames else 
            sum(len(l.hyperframes) for l in sequence.layers),
        export_id=export_id,
        progress_url=f"/api/v1/generate/progress/{export_id}",
    )


# ---------------------------------------------------------------------------
# Progress Tracking
# ---------------------------------------------------------------------------

@router.get("/generate/progress/{export_id}", response_model=GenerateProgress)
async def get_generation_progress(export_id: str):
    """Poll the progress of a video generation job."""
    progress = progress_tracker.get_progress(export_id)
    if progress is None:
        raise HTTPException(status_code=404, detail=f"No job found for export '{export_id}'")
    
    return GenerateProgress(
        export_id=export_id,
        status=progress["status"],
        progress=progress["progress"],
        current_frame=progress["current_frame"],
        total_frames=progress["total_frames"],
        message=progress["message"],
    )


# ---------------------------------------------------------------------------
# Preview
# ---------------------------------------------------------------------------

@router.post("/preview")
async def preview_frame(request: PreviewRequest):
    """Preview a single interpolated frame with optional asset."""
    from io import BytesIO
    
    hf = request.frame
    state = interpolate_frame_state(hf.start, hf.end, request.t, hf.easing)
    
    asset = None
    if request.asset_id:
        asset = load_asset(request.asset_id)
    
    img = render_frame(state, 1080, 1920, hf.effect, asset=asset)
    
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")


@router.get("/preview/{export_id}")
async def get_preview_thumbnail(export_id: str):
    """Get a preview thumbnail for a completed export."""
    from io import BytesIO
    
    if export_id not in _generated_videos:
        raise HTTPException(status_code=404, detail=f"Export '{export_id}' not found")
    
    # We don't store thumbnails separately, so return a placeholder approach
    # In production, extract first frame of the video
    raise HTTPException(status_code=404, detail="Thumbnail not available yet")


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

@router.get("/export/{export_id}")
async def get_export(export_id: str):
    """Get a generated video file by its export ID."""
    base_id = export_id.rsplit(".", 1)[0] if "." in export_id else export_id
    ext = export_id.rsplit(".", 1)[1] if "." in export_id else "mp4"
    
    if base_id in _generated_videos:
        video_bytes = _generated_videos[base_id]
        media_type = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "gif": "image/gif",
        }.get(ext, "application/octet-stream")
        
        return StreamingResponse(
            io.BytesIO(video_bytes),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="hyperforge_{base_id}.{ext}"',
                "Content-Length": str(len(video_bytes)),
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
    """Encode frames into a video using FFmpeg with high quality settings."""
    import subprocess
    
    frame_dir = OUTPUT_DIR / f"frames_{export_id}"
    frame_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        for i, frame in enumerate(frames):
            frame_path = frame_dir / f"frame_{i:06d}.png"
            frame.save(str(frame_path))
        
        output_path = OUTPUT_DIR / f"{export_id}.{output_format}"
        crf = max(0, min(51, quality))
        
        if output_format == "gif":
            cmd = [
                "ffmpeg", "-y",
                "-framerate", str(fps),
                "-i", str(frame_dir / "frame_%06d.png"),
                "-vf", f"fps={fps},scale={width}:{height}:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer",
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
                "-cpu-used", "2",
                "-row-mt", "1",
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
                "-profile:v", "high",
                "-level", "4.2",
                str(output_path),
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr[:500]}")
        
        with open(str(output_path), "rb") as f:
            return f.read()
            
    except subprocess.TimeoutExpired:
        raise RuntimeError("FFmpeg encoding timed out")
    finally:
        import shutil
        shutil.rmtree(frame_dir, ignore_errors=True)
        output_path = OUTPUT_DIR / f"{export_id}.{output_format}"
        if output_path.exists():
            output_path.unlink(missing_ok=True)


def _encode_fallback(frames: list, fps: int, output_format: str, export_id: str) -> bytes:
    """Fallback encoding using PIL (GIF/WebP). No FFmpeg required."""
    from io import BytesIO
    from PIL import Image as PILImage
    
    buf = BytesIO()
    
    if output_format == "gif":
        frames_pil = [f.convert("RGBA") for f in frames]
        # Optimize palette for better quality
        first = frames_pil[0].convert("P", palette=PILImage.Palette.ADAPTIVE, colors=256)
        others = []
        for f in frames_pil[1:]:
            # Convert each frame with same palette
            others.append(f.convert("P", palette=first.palette))
        
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
        # WebP
        frames_pil = [f.convert("RGBA") for f in frames]
        frames_pil[0].save(
            buf,
            format="WEBP",
            save_all=True,
            append_images=frames_pil[1:],
            duration=1000 // fps,
            loop=0,
            lossless=False,
            quality=85,
            method=6,
        )
    
    buf.seek(0)
    return buf.getvalue()