import { useDashboardStore } from '../stores/dashboardStore';

export default function PreviewPanel() {
  const { activeProjectId, projects, selectedHyperframeId, isCodeView } = useDashboardStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const selectedFrame = activeProject?.hyperframes.find((hf) => hf.id === selectedHyperframeId);

  return (
    <div
      className="h-full flex flex-col border-l"
      style={{
        width: 'var(--preview-width)',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Live Preview
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--success)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Live
          </span>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full aspect-[9/16] max-h-[70vh] rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {selectedFrame ? (
            <div className="flex flex-col items-center gap-3 p-4 text-center">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: 'rgba(108, 92, 231, 0.15)' }}
              >
                <span className="animate-pulse">▶</span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedFrame.label}
              </p>
              <div className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span>{selectedFrame.duration}s</span>
                <span>•</span>
                <span style={{ color: 'var(--accent)' }}>{selectedFrame.type}</span>
              </div>
              {isCodeView && (
                <pre
                  className="w-full text-left text-xs p-3 rounded-lg mt-2 overflow-auto max-h-40"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {JSON.stringify({ start: selectedFrame.start, end: selectedFrame.end, easing: selectedFrame.easing, effect: selectedFrame.effect }, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                🎬
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Kein Hyperframe ausgewählt
              </p>
              <p className="text-xs max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                Wähle einen Hyperframe aus der Timeline oder einem Template aus, um die Vorschau zu sehen
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Info */}
      <div
        className="px-5 py-3 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>
            {activeProject
              ? `${activeProject.hyperframes.length} Hyperframes`
              : 'Kein Projekt aktiv'}
          </span>
          <span>
            {activeProject
              ? `${activeProject.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s`
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}