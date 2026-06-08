"""Motion Template Registry.

Contains predefined motion profiles for all style categories:
- Smooth Zoom, Glide Transition, Morph, Bounce, Glitch, etc.
"""

from __future__ import annotations

from typing import Dict, List

from models.hyperframe import (
    EasingType,
    EffectType,
    FrameState,
    HyperFrame,
    MotionTemplate,
)

# ---------------------------------------------------------------------------
# Template definitions
# ---------------------------------------------------------------------------

TEMPLATES: Dict[str, MotionTemplate] = {}

def _register(t: MotionTemplate) -> MotionTemplate:
    TEMPLATES[t.id] = t
    return t

# ---- Transitions ----

SMOOTH_ZOOM = _register(MotionTemplate(
    id="smooth-zoom",
    name="Smooth Zoom",
    description="Langsamer, flüssiger Zoom-In-Effekt. Perfekt für Produkt-Highlights und Intros.",
    category="zoom",
    tags=["zoom", "smooth", "slow", "cinematic", "intro"],
    default_frames=[
        HyperFrame(
            id="zoom-in",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            end=FrameState(x=0, y=0, scale=1.8, rotation=0, opacity=1.0),
            duration=45,
            easing=EasingType.EASE_IN_OUT,
            effect=EffectType.NONE,
        ),
    ],
))

GLIDE_TRANSITION = _register(MotionTemplate(
    id="glide-transition",
    name="Glide Transition",
    description="Seitlicher Gleit-Übergang mit sanftem Ein- und Ausschwingen.",
    category="transition",
    tags=["glide", "slide", "transition", "smooth"],
    default_frames=[
        HyperFrame(
            id="glide",
            type="transition",
            start=FrameState(x=-200, y=0, scale=1.0, rotation=0, opacity=0.0),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=30,
            easing=EasingType.EASE_OUT,
            effect=EffectType.CROSSFADE,
        ),
    ],
))

MORPH = _register(MotionTemplate(
    id="morph",
    name="Morph",
    description="Weicher Form-Wechsel zwischen zwei Elementen mit Überblendung.",
    category="morph",
    tags=["morph", "blend", "shape", "transform"],
    default_frames=[
        HyperFrame(
            id="morph-main",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0, blur=0),
            end=FrameState(x=50, y=30, scale=1.3, rotation=10, opacity=0.8, blur=2),
            duration=40,
            easing=EasingType.EASE_IN_OUT,
            effect=EffectType.MORPH,
        ),
    ],
))

BOUNCE = _register(MotionTemplate(
    id="bounce",
    name="Bounce",
    description="Federnder Bounce-Effekt mit elastischem Overshoot.",
    category="bounce",
    tags=["bounce", "spring", "elastic", "playful"],
    default_frames=[
        HyperFrame(
            id="bounce-in",
            type="transition",
            start=FrameState(x=0, y=-200, scale=0.5, rotation=0, opacity=0.0),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=35,
            easing=EasingType.BOUNCE,
            effect=EffectType.NONE,
        ),
    ],
))

GLITCH = _register(MotionTemplate(
    id="glitch",
    name="Glitch",
    description="Digitaler Glitch-Effekt mit Störungen und Versatz. Für Gaming- & Tech-Content.",
    category="glitch",
    tags=["glitch", "digital", "cyber", "tech", "distort"],
    default_frames=[
        HyperFrame(
            id="glitch-1",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            end=FrameState(x=5, y=-3, scale=1.02, rotation=1, opacity=0.9),
            duration=4,
            easing=EasingType.LINEAR,
            effect=EffectType.GLITCH,
        ),
        HyperFrame(
            id="glitch-2",
            type="transition",
            start=FrameState(x=5, y=-3, scale=1.02, rotation=1, opacity=0.9),
            end=FrameState(x=-3, y=2, scale=0.98, rotation=-1, opacity=0.95),
            duration=3,
            easing=EasingType.LINEAR,
            effect=EffectType.GLITCH,
        ),
        HyperFrame(
            id="glitch-3",
            type="transition",
            start=FrameState(x=-3, y=2, scale=0.98, rotation=-1, opacity=0.95),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=5,
            easing=EasingType.EASE_OUT,
            effect=EffectType.GLITCH,
        ),
    ],
))

FADE_IN = _register(MotionTemplate(
    id="fade-in",
    name="Fade In",
    description="Klassisches Einblenden aus der Dunkelheit.",
    category="transition",
    tags=["fade", "appear", "classic", "simple"],
    default_frames=[
        HyperFrame(
            id="fade",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=0.0),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=20,
            easing=EasingType.EASE_IN,
            effect=EffectType.FADE,
        ),
    ],
))

SHAKE = _register(MotionTemplate(
    id="shake",
    name="Shake",
    description="Schnelle Rüttel-Bewegung für Emphasis und dynamische Momente.",
    category="effect",
    tags=["shake", "impact", "emphasis", "dynamic"],
    default_frames=[
        HyperFrame(
            id="shake-1",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            end=FrameState(x=8, y=0, scale=1.0, rotation=2, opacity=1.0),
            duration=2,
            easing=EasingType.LINEAR,
            effect=EffectType.SHAKE,
        ),
        HyperFrame(
            id="shake-2",
            type="transition",
            start=FrameState(x=8, y=0, scale=1.0, rotation=2, opacity=1.0),
            end=FrameState(x=-6, y=2, scale=1.0, rotation=-1, opacity=1.0),
            duration=2,
            easing=EasingType.LINEAR,
            effect=EffectType.SHAKE,
        ),
        HyperFrame(
            id="shake-3",
            type="transition",
            start=FrameState(x=-6, y=2, scale=1.0, rotation=-1, opacity=1.0),
            end=FrameState(x=4, y=-1, scale=1.0, rotation=0, opacity=1.0),
            duration=2,
            easing=EasingType.LINEAR,
            effect=EffectType.SHAKE,
        ),
        HyperFrame(
            id="shake-4",
            type="transition",
            start=FrameState(x=4, y=-1, scale=1.0, rotation=0, opacity=1.0),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=3,
            easing=EasingType.EASE_OUT,
            effect=EffectType.SHAKE,
        ),
    ],
))

TEXT_SLIDE_UP = _register(MotionTemplate(
    id="text-slide-up",
    name="Text Slide Up",
    description="Text-Overlay gleitet flüssig von unten herein. Ideal für Captions und Titles.",
    category="text",
    tags=["text", "slide", "caption", "title", "overlay"],
    default_frames=[
        HyperFrame(
            id="text-appear",
            type="transition",
            start=FrameState(x=0, y=100, scale=0.8, rotation=0, opacity=0.0),
            end=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0),
            duration=25,
            easing=EasingType.EASE_OUT,
            effect=EffectType.NONE,
        ),
    ],
))

WARP_ZOOM = _register(MotionTemplate(
    id="warp-zoom",
    name="Warp Zoom",
    description="Zoom mit leichter Verzerrung und Blur – surrealer Effekt für Träume/Flashbacks.",
    category="zoom",
    tags=["warp", "zoom", "blur", "surreal", "dream"],
    default_frames=[
        HyperFrame(
            id="warp",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.0, rotation=0, opacity=1.0, blur=0),
            end=FrameState(x=30, y=20, scale=2.5, rotation=5, opacity=0.7, blur=8),
            duration=50,
            easing=EasingType.EASE_IN,
            effect=EffectType.ZOOM_BLUR,
        ),
    ],
))

SMOOTH_PAN = _register(MotionTemplate(
    id="smooth-pan",
    name="Smooth Pan",
    description="Langsame horizontale Kamerafahrt. Perfekt für Panoramen und Landschaften.",
    category="transition",
    tags=["pan", "horizontal", "cinematic", "landscape"],
    default_frames=[
        HyperFrame(
            id="pan",
            type="transition",
            start=FrameState(x=0, y=0, scale=1.2, rotation=0, opacity=1.0),
            end=FrameState(x=-300, y=0, scale=1.2, rotation=0, opacity=1.0),
            duration=60,
            easing=EasingType.LINEAR,
            effect=EffectType.NONE,
        ),
    ],
))

# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------

def get_template(template_id: str) -> MotionTemplate | None:
    """Get a template by its ID, or None if not found."""
    return TEMPLATES.get(template_id)


def list_templates(category: str | None = None) -> List[MotionTemplate]:
    """List all templates, optionally filtered by category."""
    if category:
        return [t for t in TEMPLATES.values() if t.category == category]
    return list(TEMPLATES.values())


def get_categories() -> List[str]:
    """Get all unique template categories."""
    return sorted({t.category for t in TEMPLATES.values()})


def apply_template(sequence, template_id: str):
    """Apply a template's default frames to an existing sequence."""
    template = get_template(template_id)
    if not template:
        raise ValueError(f"Template '{template_id}' not found")
    # Merge template frames with existing sequence frames
    if not sequence.frames:
        sequence.frames = [f.model_copy(deep=True) for f in template.default_frames]
    else:
        sequence.frames.extend(template.default_frames)
    return sequence