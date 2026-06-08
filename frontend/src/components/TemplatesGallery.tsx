import { useDashboardStore } from '../stores/dashboardStore';

const categoryLabels: Record<string, string> = {
  transition: 'Transitions',
  zoom: 'Zooms',
  morph: 'Morphs',
  'text-overlay': 'Text Overlays',
  effect: 'Effects',
};

export default function TemplatesGallery() {
  const { templates, setActiveProject, projects } = useDashboardStore();

  const categories = [...new Set(templates.map((t) => t.category))];

  const handleUseTemplate = (templateId: string) => {
    // Create a new project from template or switch to first project
    if (projects.length > 0) {
      setActiveProject(projects[0].id);
    }
  };

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
                      {template.category === 'text-overlay' && '📝'}
                      {template.category === 'effect' && '✨'}
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