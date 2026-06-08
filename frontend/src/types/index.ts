export interface HyperFrame {
  id: string;
  type: string;
  label: string;
  duration: number;
  params: Record<string, unknown>;
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
  category: 'transition' | 'zoom' | 'morph' | 'text-overlay' | 'effect';
  thumbnail: string;
  hyperframes: HyperFrame[];
  isFree: boolean;
}

export type NavigationTab = 'templates' | 'projects' | 'export';

export interface DashboardState {
  activeTab: NavigationTab;
  activeProjectId: string | null;
  selectedHyperframeId: string | null;
  isCodeView: boolean;
  projects: Project[];
  templates: Template[];
  setActiveTab: (tab: NavigationTab) => void;
  setActiveProject: (id: string | null) => void;
  setSelectedHyperframe: (id: string | null) => void;
  toggleCodeView: () => void;
}