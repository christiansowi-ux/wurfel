/**
 * HyperForge Studio — API Service
 *
 * Typed HTTP client for the Hyperframe Engine REST API.
 * All functions return promises that resolve to typed response objects.
 */

// Base URL for the engine API
// In production, use the deployed backend URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

// ---------------------------------------------------------------------------
// Types matching the engine's Pydantic models
// ---------------------------------------------------------------------------

export interface FrameState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string | null;
  blur: number;
}

export interface ApiHyperFrame {
  id: string;
  type: string;
  start: FrameState;
  end: FrameState;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  effect: 'none' | 'morph' | 'glitch' | 'blur' | 'zoom-blur' | 'shake' | 'fade' | 'crossfade';
  text?: string;
  font_size?: number;
  text_color?: string;
  text_position?: 'top' | 'center' | 'bottom' | 'custom';
}

export interface ApiMotionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  default_frames: ApiHyperFrame[];
  tags: string[];
  thumbnail_url: string | null;
}

export interface ApiTemplatesResponse {
  templates: ApiMotionTemplate[];
  categories: string[];
  count: number;
}

export interface ApiHealthResponse {
  status: string;
  version: string;
  ffmpeg_available: boolean;
  opencv_available: boolean;
  frame_rate: {
    supported_fps: number[];
    max_resolution: string;
  };
}

export interface GenerateRequest {
  sequence: {
    id: string;
    frames: ApiHyperFrame[];
    width: number;
    height: number;
    fps: number;
  };
  template_id?: string;
  output_format: 'mp4' | 'gif' | 'webm';
  quality?: number;
}

export interface GenerateResponse {
  video_url: string;
  preview_url: string;
  duration_seconds: number;
  total_frames: number;
  generation_time_ms: number;
  hyperframes_used: number;
}

export interface PreviewRequest {
  frame: ApiHyperFrame;
  t: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  detail: string;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody.detail) {
        detail = errorBody.detail;
      }
    } catch {
      // ignore parse error
    }
    throw new ApiClientError(response.status, detail);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** GET /health — Engine health check */
export async function checkHealth(): Promise<ApiHealthResponse> {
  return request<ApiHealthResponse>('/health');
}

/** GET /templates — List all motion templates, optionally filtered by category */
export async function fetchTemplates(
  category?: string,
): Promise<ApiTemplatesResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<ApiTemplatesResponse>(`/templates${query}`);
}

/** GET /templates/:id — Get a specific template by ID */
export async function getTemplate(
  templateId: string,
): Promise<ApiMotionTemplate> {
  return request<ApiMotionTemplate>(`/templates/${templateId}`);
}

/** POST /generate — Generate a video from a hyperframe sequence */
export async function generateVideo(
  req: GenerateRequest,
): Promise<GenerateResponse> {
  return request<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

/** POST /preview — Preview a single interpolated frame */
export async function previewFrame(
  req: PreviewRequest,
): Promise<Blob> {
  const url = `${API_BASE}/preview`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new ApiClientError(response.status, 'Preview generation failed');
  }

  return response.blob();
}

/** GET /export/:exportId — Download a generated video */
export function getExportUrl(exportId: string): string {
  return `${API_BASE}/export/${exportId}`;
}