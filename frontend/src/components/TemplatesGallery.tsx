import { useEffect, useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

const categoryLabels: Record<string, string> = {
  all: 'Alle',
  transition: 'Transitions',
  zoom: 'Zooms',
  morph: 'Morphs',
  'text': 'Text Overlays',
  effect: 'Effects',
  bounce: 'Bounce',
  glitch: 'Glitch',
};

export default function TemplatesGallery() {
  const {
    templates,
    templatesLoading,
    templatesError,
    fetchTemplates,
    projects,
    setActiveProject,
    templatesFallback,
  } = useDashboardStore();

  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch templates from API on mount
  useEffect(() => {
    if (templatesLoading === 'idle') {
      fetchTemplates();
    }
  }, [templatesLoading, fetchTemplates]);

  const handleUseTemplate = async (_templateId: string) => {
    if (projects.length > 0) {
      setActiveProject(projects[0].id);
    }
  };

  // Use fallback templates if API failed
  const displayTemplates = templatesLoading === 'error' && templatesFallback.length > 0
    ? templatesFallback
    : templates;

  const categories = ['all', ...new Set(displayTemplates.map((t) => t.category))];

  const filteredTemplates = activeCategory === 'all' 
    ? displayTemplates 
    : displayTemplates.filter(t => t.category === activeCategory);

  // Loading state
  if (templatesLoading === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse bg-accent/20">
            🎨
          </div>
          <p className="text-sm text-text-secondary animate-pulse">
            Lade Premium Templates...
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayTemplates.length === 0 && templatesLoading === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center max-w-md glass-panel p-8 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 bg-danger/20">
            ⚠️
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Verbindung zur Engine fehlgeschlagen
          </h3>
          <p className="text-sm mb-4 text-text-secondary">
            {templatesError || 'Die Hyperframe Engine ist nicht erreichbar.'}
          </p>
          <button
            onClick={() => fetchTemplates()}
            className="premium-button px-6 py-2 rounded-xl text-sm font-medium text-white"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              Hyperframe Templates
            </h2>
            <p className="text-text-secondary mt-2 max-w-lg">
              Wähle aus einer Bibliothek von Profi-Animationen. Jedes Template wurde für maximale TikTok-Performance optimiert.
            </p>
          </div>
          {templatesLoading === 'error' && templatesFallback.length > 0 && (
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-[10px] font-bold text-warning uppercase tracking-wider">
                Offline Mode
              </span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 glass-panel rounded-2xl w-fit">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-accent text-white shadow-lg shadow-accent/30'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {categoryLabels[cat] || cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="premium-card group cursor-pointer"
            onClick={() => handleUseTemplate(template.id)}
          >
            {/* Preview Thumbnail */}
            <div className="aspect-[9/16] bg-black relative overflow-hidden">
              {template.thumbnail ? (
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-primary">
                   <div className="text-4xl opacity-20 group-hover:scale-125 transition-transform duration-500">
                    {template.category === 'transition' && '↔️'}
                    {template.category === 'zoom' && '🔍'}
                    {template.category === 'morph' && '🌀'}
                    {template.category === 'text' && '📝'}
                    {template.category === 'effect' && '✨'}
                    {template.category === 'bounce' && '🏀'}
                    {template.category === 'glitch' && '⚡'}
                  </div>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

              {!template.isFree && (
                <div className="absolute top-3 right-3 pro-badge px-2 py-0.5 rounded-md text-[10px] z-10">
                  PRO
                </div>
              )}
              
              <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-accent-hover uppercase tracking-widest bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md w-fit">
                  {template.category}
                </span>
                <span className="text-[9px] text-white/60 font-medium">
                  {template.hyperframes.length} Motion Frames
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5">
              <h4 className="text-sm font-bold text-white mb-2 group-hover:text-accent transition-colors">
                {template.name}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-4">
                {template.description}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                 <div className="flex gap-1">
                  {template.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] text-text-secondary uppercase">#{tag}</span>
                  ))}
                 </div>
                 <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
