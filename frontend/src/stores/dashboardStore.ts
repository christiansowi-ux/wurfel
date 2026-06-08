import { create } from 'zustand';
import type { DashboardState, HyperFrame, Project, Template, FrameState } from '../types';
import {
  checkHealth as apiCheckHealth,
  fetchTemplates as apiFetchTemplates,
  getTemplate as apiGetTemplate,
  type ApiMotionTemplate,
  type ApiHyperFrame,
  type ApiHealthResponse,
} from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert the engine's HyperFrame type to our frontend type */
function apiFrameToHyperFrame(apiFrame: ApiHyperFrame): HyperFrame {
  return {
    id: apiFrame.id,
    type: apiFrame.easing === 'bounce' ? 'bounce' : apiFrame.effect !== 'none' ? apiFrame.effect : 'transition',
    label: apiFrame.type.charAt(0).toUpperCase() + apiFrame.type.slice(1),
    duration: apiFrame.duration / 30,
    easing: apiFrame.easing,
    effect: apiFrame.effect,
    start: apiFrame.start,
    end: apiFrame.end,
  };
}

/** Convert engine template to our frontend Template type */
function apiTemplateToTemplate(apiTemplate: ApiMotionTemplate): Template {
  const freeCategories = ['transition', 'zoom', 'fade', 'glitch', 'bounce'];
  return {
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description,
    category: apiTemplate.category,
    thumbnail: apiTemplate.thumbnail_url || '',
    hyperframes: apiTemplate.default_frames.map(apiFrameToHyperFrame),
    isFree: freeCategories.includes(apiTemplate.category),
    tags: apiTemplate.tags,
  };
}

// ---------------------------------------------------------------------------
// Default / Initial State
// ---------------------------------------------------------------------------

const defaultFrameState: FrameState = {
  x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, color: null, blur: 0,
};

const defaultEndState: FrameState = {
  x: 100, y: 50, scale: 1.5, rotation: 15, opacity: 1.0, color: null, blur: 0,
};

const sampleHyperframes: HyperFrame[] = [
  { id: 'hf-1', type: 'zoom-in', label: 'Zoom In', duration: 1.5, easing: 'ease-out', effect: 'none', start: { ...defaultFrameState }, end: { ...defaultEndState, scale: 1.8, x: 0, y: 0 } },
  { id: 'hf-2', type: 'slide-left', label: 'Slide Left', duration: 1.0, easing: 'ease-out', effect: 'none', start: { ...defaultFrameState }, end: { ...defaultEndState, x: -200, y: 0, scale: 1.0, rotation: 0 } },
  { id: 'hf-3', type: 'fade', label: 'Crossfade', duration: 0.8, easing: 'ease-in-out', effect: 'fade', start: { ...defaultFrameState, opacity: 0 }, end: { ...defaultFrameState, opacity: 1 } },
  { id: 'hf-4', type: 'morph', label: 'Morph Circle', duration: 2.0, easing: 'ease-in-out', effect: 'morph', start: { ...defaultFrameState }, end: { ...defaultEndState, blur: 2 } },
  { id: 'hf-5', type: 'text-reveal', label: 'Text Reveal', duration: 1.2, easing: 'ease-out', effect: 'none', start: { ...defaultFrameState, y: 100, scale: 0.8, opacity: 0 }, end: { ...defaultFrameState, y: 0, scale: 1.0, opacity: 1 } },
];

const sampleProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Mein erstes Video',
    description: 'TikTok Viral Clip',
    hyperframes: [sampleHyperframes[0], sampleHyperframes[1]],
    createdAt: '2025-06-01T10:00:00Z',
    updatedAt: '2025-06-08T14:30:00Z',
  },
  {
    id: 'proj-2',
    name: 'Product Launch',
    description: 'Produktvorstellung mit dynamischen Effekten',
    hyperframes: [sampleHyperframes[4], sampleHyperframes[0], sampleHyperframes[2]],
    createdAt: '2025-06-05T09:00:00Z',
    updatedAt: '2025-06-07T16:45:00Z',
  },
];

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDashboardStore = create<DashboardState>((set) => ({
  // ---- Navigation ----
  activeTab: 'templates',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ---- Projects ----
  activeProjectId: null,
  projects: sampleProjects,
  setActiveProject: (id) => set({
    activeProjectId: id,
    selectedHyperframeId: null,
  }),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project],
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ),
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
  })),

  // ---- Hyperframes ----
  selectedHyperframeId: null,
  setSelectedHyperframe: (id) => set({ selectedHyperframeId: id }),

  addHyperframe: (projectId, frame) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId
        ? { ...p, hyperframes: [...p.hyperframes, frame], updatedAt: new Date().toISOString() }
        : p
    ),
  })),

  updateHyperframe: (projectId, frameId, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            hyperframes: p.hyperframes.map((hf) =>
              hf.id === frameId ? { ...hf, ...updates } : hf
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
  })),

  removeHyperframe: (projectId, frameId) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            hyperframes: p.hyperframes.filter((hf) => hf.id !== frameId),
            updatedAt: new Date().toISOString(),
          }
        : p
    ),
    selectedHyperframeId:
      state.selectedHyperframeId === frameId ? null : state.selectedHyperframeId,
  })),

  reorderHyperframes: (projectId, fromIndex, toIndex) => set((state) => ({
    projects: state.projects.map((p) => {
      if (p.id !== projectId) return p;
      const frames = [...p.hyperframes];
      const [moved] = frames.splice(fromIndex, 1);
      frames.splice(toIndex, 0, moved);
      return { ...p, hyperframes: frames, updatedAt: new Date().toISOString() };
    }),
  })),

  duplicateHyperframe: (projectId, frameId) => set((state) => ({
    projects: state.projects.map((p) => {
      if (p.id !== projectId) return p;
      const frame = p.hyperframes.find((hf) => hf.id === frameId);
      if (!frame) return p;
      const dup: HyperFrame = {
        ...frame,
        id: `${frame.id}-copy-${Date.now()}`,
        label: `${frame.label} (Kopie)`,
      };
      const idx = p.hyperframes.findIndex((hf) => hf.id === frameId);
      const frames = [...p.hyperframes];
      frames.splice(idx + 1, 0, dup);
      return { ...p, hyperframes: frames, updatedAt: new Date().toISOString() };
    }),
  })),

  // ---- Code view ----
  isCodeView: false,
  toggleCodeView: () => set((state) => ({ isCodeView: !state.isCodeView })),

  // ---- Templates (from API) ----
  templates: [],
  templatesLoading: 'idle',
  templatesError: null,

  fetchTemplates: async () => {
    set({ templatesLoading: 'loading', templatesError: null });
    try {
      const response = await apiFetchTemplates();
      const templates = response.templates.map(apiTemplateToTemplate);
      set({ templates, templatesLoading: 'success', templatesError: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      set({ templatesLoading: 'error', templatesError: message });
    }
  },

  fetchTemplateById: async (id) => {
    try {
      const apiTemplate = await apiGetTemplate(id);
      return apiTemplateToTemplate(apiTemplate);
    } catch (err) {
      console.error(`Failed to fetch template ${id}:`, err);
      return null;
    }
  },

  // ---- Health / Engine status ----
  engineStatus: null,
  engineLoading: 'idle',

  checkEngineHealth: async () => {
    set({ engineLoading: 'loading' });
    try {
      const health: ApiHealthResponse = await apiCheckHealth();
      set({
        engineStatus: {
          status: health.status,
          version: health.version,
          ffmpegAvailable: health.ffmpeg_available,
          opencvAvailable: health.opencv_available,
        },
        engineLoading: 'success',
      });
    } catch (err) {
      console.error('Engine health check failed:', err);
      set({
        engineStatus: { status: 'offline', version: '', ffmpegAvailable: false, opencvAvailable: false },
        engineLoading: 'error',
      });
    }
  },
}));