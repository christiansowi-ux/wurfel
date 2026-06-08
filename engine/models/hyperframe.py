"""HyperFrame - Pydantic data models for the Hyperframe Engine.

Defines the JSON data types for Hyperframes, asset management,
and composition layers for real video compositing.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EasingType(str, Enum):
    """Supported easing functions for frame interpolation."""
    LINEAR = "linear"
    EASE_IN = "ease-in"
    EASE_OUT = "ease-out"
    EASE_IN_OUT = "ease-in-out"
    BOUNCE = "bounce"
    ELASTIC = "elastic"


class EffectType(str, Enum):
    """Supported visual effects for Hyperframes."""
    NONE = "none"
    MORPH = "morph"
    GLITCH = "glitch"
    BLUR = "blur"
    ZOOM_BLUR = "zoom-blur"
    SHAKE = "shake"
    FADE = "fade"
    CROSSFADE = "crossfade"


class FrameState(BaseModel):
    """Describes the visual state of a frame at a given point in time."""
    x: float = Field(default=0.0, description="X position in pixels")
    y: float = Field(default=0.0, description="Y position in pixels")
    scale: float = Field(default=1.0, ge=0.01, le=10.0, description="Scale factor")
    rotation: float = Field(default=0.0, description="Rotation in degrees")
    opacity: float = Field(default=1.0, ge=0.0, le=1.0, description="Opacity (0-1)")
    color: Optional[str] = Field(default=None, description="Hex color string (e.g. #FF0000)")
    blur: float = Field(default=0.0, ge=0.0, description="Gaussian blur radius")


class HyperFrame(BaseModel):
    """A single HyperFrame — defines a keyframe with start/end states and transition params."""
    id: str = Field(..., description="Unique identifier for the frame")
    type: str = Field(default="transition", description="Frame type: transition, static, effect")
    start: FrameState = Field(default_factory=FrameState, description="Starting visual state")
    end: FrameState = Field(default_factory=lambda: FrameState(x=100, y=50, scale=1.5, rotation=15), description="Ending visual state")
    duration: int = Field(default=30, ge=1, le=300, description="Duration in frames")
    easing: EasingType = Field(default=EasingType.EASE_IN_OUT, description="Easing function")
    effect: EffectType = Field(default=EffectType.NONE, description="Visual effect to apply")
    asset_id: Optional[str] = Field(default=None, description="Reference to an uploaded asset to animate")
    
    # Text/Caption Fields
    text: Optional[str] = Field(default=None, description="Caption text to render on frame")
    font_size: int = Field(default=48, ge=8, le=200, description="Font size in pixels")
    text_color: str = Field(default="#FFFFFF", description="Text color hex")
    text_position: str = Field(default="bottom", description="Text position: top, center, bottom, custom")


class CompositionLayer(BaseModel):
    """A layer in the video composition with an asset and hyperframe animation."""
    asset_id: str = Field(..., description="Asset ID (image/video) to use for this layer")
    hyperframes: List[HyperFrame] = Field(default_factory=list, description="Hyperframes animating this layer")
    z_index: int = Field(default=0, description="Layer order (higher = on top)")
    blend_mode: str = Field(default="normal", description="Blend mode: normal, multiply, screen, overlay")


class HyperFrameSequence(BaseModel):
    """A sequence of HyperFrames forming a complete animation."""
    id: str = Field(default="seq-001", description="Sequence identifier")
    frames: List[HyperFrame] = Field(default_factory=list, description="Ordered list of keyframes")
    width: int = Field(default=1080, ge=1, description="Canvas width in pixels")
    height: int = Field(default=1920, ge=1, description="Canvas height in pixels")
    fps: int = Field(default=30, ge=1, le=120, description="Frames per second")
    layers: List[CompositionLayer] = Field(default_factory=list, description="Composition layers with asset references")
    background_color: str = Field(default="#14141E", description="Background color hex")


class MotionTemplate(BaseModel):
    """A reusable motion template with preset parameters."""
    id: str = Field(..., description="Template identifier")
    name: str = Field(..., description="Human-readable name")
    description: str = Field(default="", description="Description of the motion style")
    category: str = Field(default="transition", description="Category: transition, zoom, morph, text, bounce, glitch")
    default_frames: List[HyperFrame] = Field(default_factory=list, description="Default keyframes for this template")
    tags: List[str] = Field(default_factory=list, description="Search tags")
    thumbnail_url: Optional[str] = Field(default=None, description="URL to preview thumbnail")


# --- Asset Models ---

class AssetInfo(BaseModel):
    """Information about an uploaded asset."""
    id: str = Field(..., description="Unique asset identifier")
    filename: str = Field(..., description="Original filename")
    mime_type: str = Field(..., description="MIME type (image/png, video/mp4, etc.)")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")
    file_size: int = Field(..., description="File size in bytes")
    duration_frames: Optional[int] = Field(default=None, description="Duration in frames (for videos)")


class UploadResponse(BaseModel):
    """Response after asset upload."""
    asset: AssetInfo = Field(..., description="Uploaded asset info")
    url: str = Field(..., description="URL to access the asset")


# --- API Models ---

class GenerateRequest(BaseModel):
    """Request body for POST /generate."""
    sequence: HyperFrameSequence = Field(..., description="The hyperframe sequence to render")
    template_id: Optional[str] = Field(default=None, description="Optional template ID to apply as base")
    output_format: str = Field(default="mp4", pattern="^(mp4|gif|webm)$", description="Output video format")
    quality: int = Field(default=23, ge=0, le=51, description="Video quality (lower = better, 0-51 for libx264 CRF)")
    interpolation_factor: float = Field(default=2.0, ge=1.0, le=10.0, description="Frame interpolation multiplier")


class GenerateResponse(BaseModel):
    """Response from POST /generate."""
    video_url: str = Field(..., description="URL to the generated video")
    preview_url: str = Field(..., description="URL to a preview thumbnail")
    duration_seconds: float = Field(..., description="Duration of the generated video in seconds")
    total_frames: int = Field(..., description="Total number of frames generated")
    generation_time_ms: float = Field(..., description="Generation time in milliseconds")
    hyperframes_used: int = Field(..., description="Number of hyperframes in the sequence")
    export_id: str = Field(..., description="Export ID for progress tracking and download")
    progress_url: str = Field(default="", description="URL to poll for generation progress")


class PreviewRequest(BaseModel):
    """Request body for POST /preview (lightweight, single frame)."""
    frame: HyperFrame = Field(..., description="Single hyperframe to preview")
    t: float = Field(default=0.5, ge=0.0, le=1.0, description="Normalized time position (0-1)")
    asset_id: Optional[str] = Field(default=None, description="Asset to preview with the frame")


class GenerateProgress(BaseModel):
    """Progress information for a generation job."""
    export_id: str = Field(..., description="Export ID")
    status: str = Field(..., description="Status: processing, completed, failed")
    progress: float = Field(default=0.0, ge=0.0, le=1.0, description="Progress from 0 to 1")
    current_frame: int = Field(default=0, description="Currently rendered frame")
    total_frames: int = Field(default=0, description="Total frames to render")
    message: str = Field(default="", description="Status message")


class HealthResponse(BaseModel):
    """Response from GET /health."""
    status: str = Field(default="ok", description="Service status")
    version: str = Field(default="0.1.0", description="Engine version")
    ffmpeg_available: bool = Field(default=False, description="Whether FFmpeg is installed")
    opencv_available: bool = Field(default=False, description="Whether OpenCV is available")
    assets_count: int = Field(default=0, description="Number of cached assets")
    frame_rate: Dict[str, Any] = Field(default_factory=dict, description="Frame rate capabilities")
class CaptionRequest(BaseModel):
    """Request body for POST /caption."""
    text: str = Field(..., description="The text to generate captions for")
    style: str = Field(default="default", description="Caption style: default, energetic, calm")
    duration_per_word: float = Field(default=0.5, description="Duration in seconds per word")
