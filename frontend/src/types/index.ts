export interface FrameState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string | null;
  blur: number;
}

export interface HyperFrame {
  id: string;
  type: string;
  label: string;
  duration: number;
  easing: string;
  effect: string;
  start: FrameState;
  end: FrameState;
  thumbnail?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  hyperframes: HyperFrame[];
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  hyperframes: HyperFrame[];
  isFree: boolean;
  tags: string[];
}

export type NavigationTab = 'templates' | 'projects' | 'export';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface DashboardState {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Projects
  activeProjectId: string | null;
  projects: Project[];
  setActiveProject: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Hyperframes
  selectedHyperframeId: string | null;
  setSelectedHyperframe: (id: string | null) => void;
  addHyperframe: (projectId: string, frame: HyperFrame) => void;
  updateHyperframe: (projectId: string, frameId: string, updates: Partial<HyperFrame>) => void;
  removeHyperframe: (projectId: string, frameId: string) => void;
  reorderHyperframes: (projectId: string, fromIndex: number, toIndex: number) => void;
  duplicateHyperframe: (projectId: string, frameId: string) => void;

  // Code view
  isCodeView: boolean;
  toggleCodeView: () => void;

  // Templates (from API)
  templates: Template[];
  templatesFallback: Template[];
  templatesLoading: LoadingState;
  templatesError: string | null;
  fetchTemplates: () => Promise<void>;
  fetchTemplateById: (id: string) => Promise<Template | null>;

  // Health / Engine status
  engineStatus: {
    status: string;
    version: string;
    ffmpegAvailable: boolean;
    opencvAvailable: boolean;
  } | null;
  engineLoading: LoadingState;
  checkEngineHealth: () => Promise<void>;
}