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
    <div className="flex-1 overflow-y-auto px-8 py-8 max-w-4xl">
      <div className="mb-10">
        <h2 className="text-3xl font-black tracking-tight text-white">
          Render Queue
        </h2>
        <p className="text-sm mt-2 text-text-secondary max-w-lg">
          Finalisiere dein Projekt und rendere es in professioneller Qualität für TikTok, Reels oder Shorts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            {/* Project Selection */}
            <div className="glass-panel p-6 rounded-[2rem]">
                <label className="text-[10px] font-black uppercase tracking-widest mb-4 block text-accent">
                Source Project
                </label>
                <div className="relative">
                    <select
                        className="w-full px-5 py-4 rounded-2xl bg-black/40 border border-white/5 focus:border-accent transition-all text-xs font-bold text-white outline-none appearance-none"
                        value={activeProjectId || ''}
                        onChange={(e) => setActiveProject(e.target.value || null)}
                    >
                        <option value="" disabled>Projekt auswählen</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        ▼
                    </div>
                </div>
                {activeProject && (
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Duration</span>
                            <span className="text-xs font-bold text-white">
                                {activeProject.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s
                            </span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Frames</span>
                            <span className="text-xs font-bold text-white">{activeProject.hyperframes.length}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quality Settings */}
            <div className="glass-panel p-6 rounded-[2rem]">
                <label className="text-[10px] font-black uppercase tracking-widest mb-4 block text-accent">
                Render Quality
                </label>
                <div className="grid grid-cols-1 gap-2">
                    {(['draft', 'standard', 'high'] as ExportQuality[]).map((q) => (
                        <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all border ${
                                quality === q 
                                    ? 'bg-accent/10 border-accent text-white shadow-lg shadow-accent/10' 
                                    : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20 hover:text-white'
                            }`}
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {q === 'draft' && 'Draft Mode'}
                                    {q === 'standard' && 'Standard High'}
                                    {q === 'high' && 'Maximum Cinematic'}
                                </span>
                                <span className="text-[9px] opacity-40">
                                    {q === 'draft' && 'Fast render, high compression'}
                                    {q === 'standard' && 'Balanced for social media'}
                                    {q === 'high' && 'Lossless visual perfection'}
                                </span>
                            </div>
                            {quality === q && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {/* Format Settings */}
            <div className="glass-panel p-6 rounded-[2rem]">
                <label className="text-[10px] font-black uppercase tracking-widest mb-4 block text-accent">
                    Output Format
                </label>
                <div className="flex gap-2">
                    {(['mp4', 'webm', 'gif'] as ExportFormat[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest border ${
                            format === f 
                                ? 'bg-white/10 border-white/20 text-white shadow-xl shadow-black/40' 
                                : 'bg-white/5 border-white/5 text-text-secondary hover:text-white'
                        }`}
                    >
                        {f}
                    </button>
                    ))}
                </div>

                <div className="mt-6 flex items-center gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeWatermark}
                            onChange={(e) => setIncludeWatermark(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/80 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </div>
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                        HyperForge Branding
                    </label>
                </div>
            </div>

            {/* Render Button & Status */}
            <div className="glass-panel p-8 rounded-[2rem] border-white/10 relative overflow-hidden group">
                {/* Background glow effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[80px] -mr-16 -mt-16 group-hover:bg-accent/40 transition-all duration-700" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">System Readiness</span>
                        <span className="text-[10px] font-bold text-success">STABLE</span>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={!activeProject || exporting}
                        className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                            activeProject 
                                ? 'premium-button text-white shadow-2xl shadow-accent/40' 
                                : 'bg-white/5 border border-white/5 text-text-secondary opacity-50 cursor-not-allowed'
                        }`}
                    >
                        {exporting ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Rendering...</span>
                            </div>
                        ) : (
                            activeProject ? 'Start Final Render' : 'Select Project'
                        )}
                    </button>

                    {/* Result Messages */}
                    {exportResult && (
                    <div className="mt-6 p-4 rounded-2xl bg-success/10 border border-success/20 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success">✓</div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-success uppercase tracking-widest">SUCCESS</p>
                                <a 
                                    href={exportResult} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs font-bold text-white hover:text-accent transition-colors underline underline-offset-4"
                                >
                                    Download Video Asset
                                </a>
                            </div>
                        </div>
                    </div>
                    )}

                    {exportError && (
                    <div className="mt-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-black text-danger uppercase tracking-widest mb-1">RENDER FAILED</p>
                        <p className="text-xs font-bold text-white/80">{exportError}</p>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
