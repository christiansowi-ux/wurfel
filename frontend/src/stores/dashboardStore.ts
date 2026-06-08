import { create } from 'zustand';
import type { DashboardState, Project, Template, HyperFrame } from '../types';

const sampleHyperframes: HyperFrame[] = [
  { id: 'hf-1', type: 'zoom-in', label: 'Zoom In', duration: 1.5, params: { start: 1.0, end: 1.3, easing: 'ease-out' } },
  { id: 'hf-2', type: 'slide-left', label: 'Slide Left', duration: 1.0, params: { direction: 'left', distance: 200 } },
  { id: 'hf-3', type: 'fade', label: 'Crossfade', duration: 0.8, params: { opacity: [0, 1] } },
  { id: 'hf-4', type: 'morph', label: 'Morph Circle', duration: 2.0, params: { shape: 'circle', blur: 0.5 } },
  { id: 'hf-5', type: 'text-reveal', label: 'Text Reveal', duration: 1.2, params: { text: 'HyperForge', animation: 'slide-up' } },
];

const sampleTemplates: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Smooth Zoom Transition',
    description: 'Professioneller Zoom-Effekt für nahtlose Übergänge',
    category: 'transition',
    thumbnail: '',
    hyperframes: [sampleHyperframes[0], sampleHyperframes[2]],
    isFree: true,
  },
  {
    id: 'tmpl-2',
    name: 'Dynamic Slide Pack',
    description: 'Slide-Animationen für schnelle Szenenwechsel',
    category: 'transition',
    thumbnail: '',
    hyperframes: [sampleHyperframes[1], sampleHyperframes[4]],
    isFree: true,
  },
  {
    id: 'tmpl-3',
    name: 'Morph Master',
    description: 'Flüssige Morphing-Effekte zwischen Objekten',
    category: 'morph',
    thumbnail: '',
    hyperframes: [sampleHyperframes[3]],
    isFree: false,
  },
  {
    id: 'tmpl-4',
    name: 'Text Overlay Pro',
    description: 'Cinematic Text-Animationen für dein Video',
    category: 'text-overlay',
    thumbnail: '',
    hyperframes: [sampleHyperframes[4]],
    isFree: false,
  },
  {
    id: 'tmpl-5',
    name: 'Quick Cut Combo',
    description: 'Schnelle Zooms kombiniert mit Crossfades',
    category: 'zoom',
    thumbnail: '',
    hyperframes: [sampleHyperframes[0], sampleHyperframes[2], sampleHyperframes[1]],
    isFree: true,
  },
  {
    id: 'tmpl-6',
    name: 'Glow Effect',
    description: 'Leuchtende Übergänge mit Blur-Effekten',
    category: 'effect',
    thumbnail: '',
    hyperframes: [sampleHyperframes[3], sampleHyperframes[2]],
    isFree: false,
  },
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

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'templates',
  activeProjectId: null,
  selectedHyperframeId: null,
  isCodeView: false,
  projects: sampleProjects,
  templates: sampleTemplates,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  setSelectedHyperframe: (id) => set({ selectedHyperframeId: id }),
  toggleCodeView: () => set((state) => ({ isCodeView: !state.isCodeView })),
}));