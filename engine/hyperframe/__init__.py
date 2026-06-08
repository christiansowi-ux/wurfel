"""Core Hyperframe Engine — Frame interpolation & tweening logic.

Takes keyframes (HyperFrames) and automatically computes all intermediate
frames using easing functions and frame interpolation. Acts as a tweening
system with AI-supported interpolation.
"""

from __future__ import annotations

import math
import time
from typing import Generator, List, Optional, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from models.hyperframe import (
    EasingType,
    EffectType,
    FrameState,
    HyperFrame,
    HyperFrameSequence,
)


# ---------------------------------------------------------------------------
# Easing functions — each takes t in [0, 1] and returns eased t in [0, 1]
# ---------------------------------------------------------------------------

def _ease_linear(t: float) -> float:
    return t


def _ease_in_quad(t: float) -> float:
    return t * t


def _ease_out_quad(t: float) -> float:
    return 1 - (1 - t) * (1 - t)


def _ease_in_out_quad(t: float) -> float:
    if t < 0.5:
        return 2 * t * t
    return 1 - (-2 * t + 2) ** 2 / 2


def _ease_bounce(t: float) -> float:
    """Simulates a bouncing ball effect with overshoot."""
    n1 = 7.5625
    d1 = 2.75
    if t < 1 / d1:
        return n1 * t * t
    elif t < 2 / d1:
        t -= 1.5 / d1
        return n1 * t * t + 0.75
    elif t < 2.5 / d1:
        t -= 2.25 / d1
        return n1 * t * t + 0.9375
    else:
        t -= 2.625 / d1
        return n1 * t * t + 0.984375


def _ease_elastic(t: float) -> float:
    """Simulates an elastic stretching effect."""
    if t == 0 or t == 1:
        return t
    return -2 ** (10 * t - 10) * math.sin((t * 10 - 10.75) * (2 * math.pi / 3))


_EASING_FUNCTIONS = {
    EasingType.LINEAR: _ease_linear,
    EasingType.EASE_IN: _ease_in_quad,
    EasingType.EASE_OUT: _ease_out_quad,
    EasingType.EASE_IN_OUT: _ease_in_out_quad,
    EasingType.BOUNCE: _ease_bounce,
    EasingType.ELASTIC: _ease_elastic,
}


def apply_easing(t: float, easing: EasingType) -> float:
    """Apply an easing function to a normalized time t in [0, 1]."""
    func = _EASING_FUNCTIONS.get(easing, _ease_linear)
    return func(t)


# ---------------------------------------------------------------------------
# Frame state interpolation
# ---------------------------------------------------------------------------

def interpolate_frame_state(
    start: FrameState,
    end: FrameState,
    t: float,
    easing: EasingType = EasingType.LINEAR,
) -> FrameState:
    """Interpolate between two FrameStates at normalized time t."""
    eased_t = apply_easing(t, easing)

    return FrameState(
        x=start.x + (end.x - start.x) * eased_t,
        y=start.y + (end.y - start.y) * eased_t,
        scale=start.scale + (end.scale - start.scale) * eased_t,
        rotation=start.rotation + (end.rotation - start.rotation) * eased_t,
        opacity=start.opacity + (end.opacity - start.opacity) * eased_t,
        color=end.color if t >= 0.5 else start.color,  # snap color at midpoint
        blur=start.blur + (end.blur - start.blur) * eased_t,
    )


def resolve_frames(sequence: HyperFrameSequence) -> Generator[Tuple[int, FrameState, Optional[EffectType]], None, None]:
    """Generate all intermediate frames for a HyperFrameSequence.

    Yields:
        Tuple of (frame_index, interpolated FrameState, optional EffectType)
    """
    frame_index = 0
    for hf in sequence.frames:
        for i in range(hf.duration):
            t = i / max(hf.duration - 1, 1)  # normalized [0, 1]
            state = interpolate_frame_state(hf.start, hf.end, t, hf.easing)
            yield (frame_index, state, hf.effect if hf.effect != EffectType.NONE else None)
            frame_index += 1


# ---------------------------------------------------------------------------
# Frame rendering engine — generates actual image frames
# ---------------------------------------------------------------------------

def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color (e.g. '#FF0000') to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def render_frame(
    state: FrameState,
    width: int = 1080,
    height: int = 1920,
    effect: Optional[EffectType] = None,
    base_image: Optional[Image.Image] = None,
) -> Image.Image:
    """Render a single frame from a FrameState.

    This is a reference renderer that creates animated geometric content.
    In production, this would composite existing video/image assets.

    Args:
        state: The interpolated frame state to render.
        width: Canvas width in pixels.
        height: Canvas height in pixels.
        effect: Optional visual effect to apply.
        base_image: Optional base image to transform.

    Returns:
        A PIL Image of the rendered frame.
    """
    if base_image is not None:
        img = base_image.copy()
    else:
        # Create a colored gradient background as reference content
        img = Image.new("RGBA", (width, height), (20, 20, 30, 255))
        draw = ImageDraw.Draw(img)

        # Draw a reference shape that moves/transforms with the frame state
        cx, cy = width // 2, height // 2
        size = 200 * state.scale

        # Center position plus state offset
        px = cx + state.x
        py = cy + state.y

        # Choose color
        if state.color:
            color = _hex_to_rgb(state.color)
        else:
            # Dynamic color based on position
            r = int(100 + 155 * (state.x / width + 0.5))
            g = int(50 + 100 * (state.y / height + 0.5))
            b = int(150 + 105 * (state.scale - 1) / 9)
            color = (min(r, 255), min(g, 255), min(b, 255))

        # Draw a shape — rectangle that rotates and scales
        rect = [
            px - size / 2, py - size / 2,
            px + size / 2, py + size / 2,
        ]

        # Draw filled rectangle
        draw.rectangle(rect, fill=color + (int(state.opacity * 255),), outline=None)

        # Draw a circle inside
        r_inner = size * 0.3
        bbox = [px - r_inner, py - r_inner, px + r_inner, py + r_inner]
        inner_color = (min(r + 60, 255), min(g + 60, 255), min(b + 60, 255))
        draw.ellipse(bbox, fill=inner_color + (int(state.opacity * 255),))

    # Apply blur effect
    if state.blur > 0:
        blur_radius = max(0, state.blur)
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # Apply glitch effect (simple RGB shift simulation)
    if effect == EffectType.GLITCH:
        r_ch, g_ch, b_ch, a_ch = img.split()
        import random
        shift = random.randint(-15, 15)
        shifted_r = Image.new("RGBA", img.size)
        shifted_r.paste(r_ch, (shift, 0))
        img = Image.merge("RGBA", (shifted_r.split()[0], g_ch, b_ch, a_ch))

    # Apply shake effect (pixel displacement)
    if effect == EffectType.SHAKE:
        import random
        dx = random.randint(-10, 10)
        dy = random.randint(-5, 5)
        img = img.transform(img.size, Image.AFFINE, (1, 0, dx, 0, 1, dy))

    return img


# ---------------------------------------------------------------------------
# Main generation pipeline
# ---------------------------------------------------------------------------

class HyperframeEngine:
    """Main engine that orchestrates frame generation and video composition."""

    def __init__(self):
        self._initialized = False

    def initialize(self):
        """Initialize engine resources (models, etc.)."""
        self._initialized = True

    def generate_frames(
        self,
        sequence: HyperFrameSequence,
        progress_callback=None,
    ) -> List[Image.Image]:
        """Generate all frames for a HyperFrameSequence.

        Args:
            sequence: The sequence to generate.
            progress_callback: Optional callable(frame_index, total) for progress.

        Returns:
            List of PIL Image objects, one per generated frame.
        """
        frames = []
        resolved = list(resolve_frames(sequence))

        for i, (frame_idx, state, effect) in enumerate(resolved):
            img = render_frame(state, sequence.width, sequence.height, effect)
            frames.append(img)
            if progress_callback:
                progress_callback(i + 1, len(resolved))

        return frames

    def estimate_duration(self, sequence: HyperFrameSequence) -> float:
        """Estimate the duration of a sequence in seconds."""
        total_frames = sum(hf.duration for hf in sequence.frames)
        return total_frames / max(sequence.fps, 1)

    def interpolate_sequence(
        self,
        sequence: HyperFrameSequence,
        interpolation_factor: float = 2.0,
    ) -> HyperFrameSequence:
        """Apply frame interpolation to create smoother motion.

        This uses linear blending between consecutive frames to simulate
        AI-assisted frame interpolation.

        Args:
            sequence: Original sequence.
            interpolation_factor: How many intermediate frames per original frame.

        Returns:
            New sequence with interpolated frames.
        """
        if interpolation_factor <= 1.0:
            return sequence

        new_frames = []
        for hf in sequence.frames:
            original_duration = hf.duration
            new_duration = int(original_duration * interpolation_factor)

            # Create micro-keyframes for smoother interpolation
            for i in range(int(interpolation_factor)):
                sub_factor = i / interpolation_factor
                sub_start = FrameState(
                    x=hf.start.x + (hf.end.x - hf.start.x) * sub_factor,
                    y=hf.start.y + (hf.end.y - hf.start.y) * sub_factor,
                    scale=hf.start.scale + (hf.end.scale - hf.start.scale) * sub_factor,
                    rotation=hf.start.rotation + (hf.end.rotation - hf.start.rotation) * sub_factor,
                    opacity=hf.start.opacity + (hf.end.opacity - hf.start.opacity) * sub_factor,
                    blur=hf.start.blur + (hf.end.blur - hf.start.blur) * sub_factor,
                )

                next_factor = min((i + 1) / interpolation_factor, 1.0)
                sub_end = FrameState(
                    x=hf.start.x + (hf.end.x - hf.start.x) * next_factor,
                    y=hf.start.y + (hf.end.y - hf.start.y) * next_factor,
                    scale=hf.start.scale + (hf.end.scale - hf.start.scale) * next_factor,
                    rotation=hf.start.rotation + (hf.end.rotation - hf.start.rotation) * next_factor,
                    opacity=hf.start.opacity + (hf.end.opacity - hf.start.opacity) * next_factor,
                    blur=hf.start.blur + (hf.end.blur - hf.start.blur) * next_factor,
                )

                new_frames.append(HyperFrame(
                    id=f"{hf.id}-sub-{i}",
                    type=hf.type,
                    start=sub_start,
                    end=sub_end,
                    duration=new_duration // int(interpolation_factor),
                    easing=hf.easing,
                    effect=hf.effect,
                ))

        return HyperFrameSequence(
            id=sequence.id,
            frames=new_frames,
            width=sequence.width,
            height=sequence.height,
            fps=sequence.fps,
        )