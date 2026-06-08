# HyperFrame Engine

Lokale KI-gestützte Frame-Interpolations-Engine für HyperForge Studio.

## Architektur

```
engine/
├── main.py                 # FastAPI Application Entry Point
├── requirements.txt        # Python Dependencies
├── api/
│   ├── __init__.py
│   ├── config.py           # CORS & App Configuration
│   └── routes.py           # REST Endpoints
├── hyperframe/
│   ├── __init__.py         # Core Engine (Interpolation + Rendering)
│   └── engine.py           # Engine reference
├── models/
│   ├── __init__.py         # Pydantic Model Exports
│   └── hyperframe.py       # Data Models
└── templates/
    ├── __init__.py         # Template Registry + Definitions
    └── registry.py         # Registry re-export
```

## REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check + capabilities |
| `/api/v1/templates` | GET | List all motion templates |
| `/api/v1/templates/{id}` | GET | Get template by ID |
| `/api/v1/generate` | POST | Generate video from hyperframes |
| `/api/v1/preview` | POST | Preview single frame |
| `/api/v1/export/{id}` | GET | Download generated video |

## Motion Templates

| Template ID | Category | Description |
|-------------|----------|-------------|
| `smooth-zoom` | zoom | Langsamer Zoom-In |
| `glide-transition` | transition | Seitlicher Gleit-Übergang |
| `morph` | morph | Weicher Form-Wechsel |
| `bounce` | bounce | Federnder Bounce-Effekt |
| `glitch` | glitch | Digitaler Glitch-Effekt |
| `fade-in` | transition | Klassisches Einblenden |
| `shake` | effect | Schnelle Rüttel-Bewegung |
| `text-slide-up` | text | Text gleitet von unten herein |
| `warp-zoom` | zoom | Zoom mit Verzerrung + Blur |
| `smooth-pan` | transition | Horizontale Kamerafahrt |

## Development

```bash
cd engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Hyperframe Format

```json
{
  "id": "hf-001",
  "type": "transition",
  "start": { "x": 0, "y": 0, "scale": 1, "rotation": 0, "opacity": 1 },
  "end": { "x": 100, "y": 50, "scale": 1.5, "rotation": 15, "opacity": 1 },
  "duration": 30,
  "easing": "ease-in-out",
  "effect": "morph"
}
```