import { useDashboardStore } from '../stores/dashboardStore';

export default function Timeline() {
  const { projects, activeProjectId, setActiveProject, selectedHyperframeId, setSelectedHyperframe } = useDashboardStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            📁
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Kein Projekt ausgewählt
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Wähle ein Projekt aus oder erstelle ein neues, um mit der Bearbeitung zu beginnen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {activeProject.name}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(108, 92, 231, 0.15)',
              color: 'var(--accent)',
            }}
          >
            {activeProject.hyperframes.length} Frames
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            + Frame hinzufügen
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-6 py-3 flex gap-2 flex-wrap">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setActiveProject(project.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: project.id === activeProjectId ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: project.id === activeProjectId ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${project.id === activeProjectId ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            {project.name}
          </button>
        ))}
      </div>

      {/* Timeline Frames */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex gap-3 flex-wrap">
          {activeProject.hyperframes.map((hf, index) => (
            <button
              key={hf.id}
              onClick={() => setSelectedHyperframe(hf.id)}
              className="group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 cursor-pointer w-40"
              style={{
                backgroundColor: selectedHyperframeId === hf.id ? 'rgba(108, 92, 231, 0.12)' : 'var(--bg-tertiary)',
                border: `1px solid ${
                  selectedHyperframeId === hf.id ? 'var(--accent)' : 'var(--border-color)'
                }`,
              }}
              onMouseEnter={(e) => {
                if (selectedHyperframeId !== hf.id) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedHyperframeId !== hf.id) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
            >
              {/* Frame number badge */}
              <span
                className="absolute top-2 left-2 text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                }}
              >
                #{index + 1}
              </span>

              {/* Frame icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{
                  backgroundColor: selectedHyperframeId === hf.id
                    ? 'rgba(108, 92, 231, 0.2)'
                    : 'rgba(255,255,255,0.04)',
                }}
              >
                {hf.type === 'zoom-in' && '🔍'}
                {hf.type === 'slide-left' && '➡️'}
                {hf.type === 'fade' && '🌫️'}
                {hf.type === 'morph' && '🌀'}
                {hf.type === 'text-reveal' && '📝'}
              </div>

              {/* Frame info */}
              <div className="text-center">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: selectedHyperframeId === hf.id ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  {hf.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {hf.duration}s • {hf.type}
                </p>
              </div>

              {/* Delete button */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                <span
                  className="text-xs px-1 cursor-pointer"
                  style={{ color: 'var(--danger)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  ✕
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor (if enabled) */}
      {selectedHyperframeId && (
        <div
          className="border-t px-6 py-3"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Hyperframe JSON
            </span>
            <span className="text-xs" style={{ color: 'var(--accent)' }}>
              editable
            </span>
          </div>
          <pre
            className="text-xs p-3 rounded-lg overflow-auto max-h-32"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {JSON.stringify(
              activeProject.hyperframes.find((hf) => hf.id === selectedHyperframeId),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}