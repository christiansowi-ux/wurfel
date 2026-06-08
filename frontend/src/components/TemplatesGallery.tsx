import { useEffect } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

const categoryLabels: Record<string, string> = {
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
    fetchTemplateById,
  } = useDashboardStore();

  // Fetch templates from API on mount
  useEffect(() => {
    if (templatesLoading === 'idle') {
      fetchTemplates();
    }
  }, [templatesLoading, fetchTemplates]);

  const handleUseTemplate = async (templateId: string) => {
    // If we have a project, switch to it
    if (projects.length > 0) {
      setActiveProject(projects[0].id);
    }
    // In future: create new project from template
    try {
      const template = await fetchTemplateById(templateId);
      if (template) {
        console.log('Template loaded:', template.name);
      }
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  // Loading state
  if (templatesLoading === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: 'rgba(108, 92, 231, 0.15)' }}
          >
            🎨
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lade Templates von der Engine...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (templatesLoading === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)' }}
          >
            ⚠️
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Verbindung zur Engine fehlgeschlagen
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {templatesError || 'Die Hyperframe Engine ist nicht erreichbar. Starte den Engine-Server auf Port 8000.'}
          </p>
          <button
            onClick={() => fetchTemplates()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const categories = [...new Set(templates.map((t) => t.category))];

  // Empty state
  if (templates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Keine Templates gefunden
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Hyperframe Templates
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Kuratierte Motion-Animationen – bereit für dein nächstes TikTok-Video
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            {categoryLabels[category] || category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates
              .filter((t) => t.category === category)
              .map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl overflow-hidden transition-all duration-200 cursor-pointer group"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Preview Thumbnail */}
                  <div
                    className="aspect-video flex items-center justify-center relative"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div className="text-4xl opacity-30 select-none">
                      {template.category === 'transition' && '↔️'}
                      {template.category === 'zoom' && '🔍'}
                      {template.category === 'morph' && '🌀'}
                      {template.category === 'text' && '📝'}
                      {template.category === 'effect' && '✨'}
                      {template.category === 'bounce' && '🏀'}
                      {template.category === 'glitch' && '⚡'}
                    </div>
                    {template.isFree && (
                      <span
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: 'rgba(0, 206, 201, 0.15)',
                          color: 'var(--success)',
                        }}
                      >
                        Free
                      </span>
                    )}
                    {!template.isFree && (
                      <span
                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: 'rgba(108, 92, 231, 0.15)',
                          color: 'var(--accent)',
                        }}
                      >
                        Pro
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {template.name}
                    </h4>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {template.hyperframes.length} Frames
                        {template.tags.length > 0 && (
                          <span className="ml-2 opacity-60">• {template.tags.slice(0, 2).join(', ')}</span>
                        )}
                      </span>
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          backgroundColor: template.isFree ? 'var(--accent)' : 'var(--bg-primary)',
                          color: template.isFree ? '#fff' : 'var(--text-secondary)',
                          border: template.isFree ? 'none' : '1px solid var(--border-color)',
                        }}
                        onMouseEnter={(e) => {
                          if (!template.isFree) {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!template.isFree) {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }
                        }}
                      >
                        {template.isFree ? 'Nutzen' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}