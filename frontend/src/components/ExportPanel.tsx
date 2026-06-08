import { useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { generateVideo, type GenerateRequest } from '../services/api';

type ExportQuality = 'draft' | 'standard' | 'high';
type ExportFormat = 'mp4' | 'gif' | 'webm';

export default function ExportPanel() {
  const { projects, activeProjectId, setActiveProject } = useDashboardStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const [quality, setQuality] = useState<ExportQuality>('standard');
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!activeProject) return;

    setExporting(true);
    setExportResult(null);
    setExportError(null);

    try {
      const crf = quality === 'draft' ? 35 : quality === 'standard' ? 23 : 18;
      const req: GenerateRequest = {
        sequence: {
          id: activeProject.id,
          frames: activeProject.hyperframes.map((hf) => ({
            id: hf.id,
            type: hf.type,
            start: hf.start,
            end: hf.end,
            duration: Math.round(hf.duration * 30),
            easing: hf.easing as GenerateRequest['sequence']['frames'][0]['easing'],
            effect: hf.effect as GenerateRequest['sequence']['frames'][0]['effect'],
          })),
          width: 1080,
          height: 1920,
          fps: 30,
        },
        output_format: format,
        quality: crf,
      };

      const result = await generateVideo(req);
      setExportResult(result.video_url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export fehlgeschlagen';
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Export
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Konfiguriere und exportiere dein Video über die Hyperframe Engine
        </p>
      </div>

      {/* Project Selection */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
          Projekt auswählen
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
          onChange={(e) => setActiveProject(e.target.value || null)}
        >
          <option value="" disabled>
            Projekt auswählen
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.hyperframes.length} Frames,{' '}
              {p.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s)
            </option>
          ))}
        </select>
        {activeProject && (
          <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {activeProject.hyperframes.length} Hyperframes •{' '}
            {activeProject.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s Gesamtdauer
          </div>
        )}
      </div>

      {/* Export Settings */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
      >
        <label className="text-xs font-medium uppercase tracking-wider mb-3 block" style={{ color: 'var(--text-secondary)' }}>
          Qualität (CRF: niedriger = besser)
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
              {q === 'draft' && 'Entwurf (CRF 35)'}
              {q === 'standard' && 'Standard (CRF 23)'}
              {q === 'high' && 'Hoch (CRF 18)'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Format
          </label>
          <div className="flex gap-2">
            {(['mp4', 'webm', 'gif'] as ExportFormat[]).map((f) => (
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
          disabled={!activeProject || exporting}
          className="w-full px-4 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            backgroundColor: activeProject ? 'var(--accent)' : 'var(--bg-primary)',
            color: activeProject ? '#fff' : 'var(--text-secondary)',
            opacity: activeProject ? (exporting ? 0.7 : 1) : 0.5,
            cursor: activeProject ? (exporting ? 'wait' : 'pointer') : 'not-allowed',
          }}
        >
          {exporting
            ? 'Exportiere...'
            : activeProject
              ? 'Video exportieren'
              : 'Projekt auswählen'}
        </button>

        {/* Result */}
        {exportResult && (
          <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(0, 206, 201, 0.1)', color: 'var(--success)' }}>
            ✅ Video exportiert!{' '}
            <a href={exportResult} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent)' }}>
              Download
            </a>
          </div>
        )}

        {exportError && (
          <div className="mt-3 p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger)' }}>
            ❌ {exportError}
          </div>
        )}
      </div>
    </div>
  );
}