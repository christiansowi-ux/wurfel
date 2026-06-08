import { useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

type ExportQuality = 'draft' | 'standard' | 'high';
type ExportFormat = 'mp4' | 'gif' | 'mov';

export default function ExportPanel() {
  const { projects, activeProjectId } = useDashboardStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [quality, setQuality] = useState<ExportQuality>('standard');
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [includeWatermark, setIncludeWatermark] = useState(true);

  const handleExport = () => {
    // Placeholder for export logic
    console.log('Exporting:', { project: activeProject?.name, quality, format, includeWatermark });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Export
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Konfiguriere und exportiere dein Video
        </p>
      </div>

      {/* Project Selection */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Projekt
        </label>
        <select
          className="w-full px-3 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            outline: 'none',
          }}
          value={activeProjectId || ''}
          onChange={(_e) => {
            // set active project
          }}
        >
          <option value="" disabled>
            Projekt auswählen
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.hyperframes.length} Frames)
            </option>
          ))}
        </select>
      </div>

      {/* Export Settings */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <label className="text-xs font-medium uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-secondary)' }}>
          Qualität
        </label>
        <div className="flex gap-2">
          {(['draft', 'standard', 'high'] as ExportQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: quality === q ? 'var(--accent)' : 'var(--bg-primary)',
                color: quality === q ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${quality === q ? 'var(--accent)' : 'var(--border-color)'}`,
              }}
            >
              {q === 'draft' && 'Entwurf'}
              {q === 'standard' && 'Standard'}
              {q === 'high' && 'Hoch'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Format
          </label>
          <div className="flex gap-2">
            {(['mp4', 'mov', 'gif'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="px-4 py-2 rounded-lg text-xs font-medium transition-all uppercase"
                style={{
                  backgroundColor: format === f ? 'var(--accent)' : 'var(--bg-primary)',
                  color: format === f ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${format === f ? 'var(--accent)' : 'var(--border-color)'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="watermark"
            checked={includeWatermark}
            onChange={(e) => setIncludeWatermark(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--accent)' }}
          />
          <label htmlFor="watermark" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            HyperForge Watermark hinzufügen
          </label>
        </div>
      </div>

      {/* Info & Export Button */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Geschätzte Größe
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {quality === 'draft' && '~2 MB/min'}
            {quality === 'standard' && '~8 MB/min'}
            {quality === 'high' && '~25 MB/min'}
          </span>
        </div>

        <button
          onClick={handleExport}
          disabled={!activeProject}
          className="w-full px-4 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            backgroundColor: activeProject ? 'var(--accent)' : 'var(--bg-primary)',
            color: activeProject ? '#fff' : 'var(--text-secondary)',
            opacity: activeProject ? 1 : 0.5,
            cursor: activeProject ? 'pointer' : 'not-allowed',
          }}
        >
          {activeProject ? 'Video exportieren' : 'Projekt auswählen'}
        </button>
      </div>
    </div>
  );
}