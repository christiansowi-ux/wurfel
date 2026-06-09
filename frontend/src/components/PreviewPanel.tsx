import { useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';

export default function PreviewPanel() {
  const { activeProjectId, projects, selectedHyperframeId, isCodeView } = useDashboardStore();
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const selectedFrame = activeProject?.hyperframes.find((hf) => hf.id === selectedHyperframeId);

  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      className="h-full flex flex-col border-l border-white/5 bg-bg-primary/50 backdrop-blur-xl"
      style={{ width: 'var(--preview-width)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
          Hyper Preview
        </h2>
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-success/10 border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-bold text-success uppercase tracking-wider">
            Realtime
          </span>
        </div>
      </div>

      {/* Preview Canvas (TikTok Look) */}
      <div className="flex-1 flex items-center justify-center p-6 bg-black/20">
        <div
          className="w-full aspect-[9/16] max-h-[75vh] rounded-[2.5rem] relative overflow-hidden shadow-2xl ring-1 ring-white/10 group"
          style={{ backgroundColor: '#000' }}
        >
          {selectedFrame ? (
            <div className="w-full h-full relative">
              {/* Fake Video Content */}
              <div className="absolute inset-0 bg-gradient-to-br from-bg-tertiary/20 via-black to-bg-primary/40 flex items-center justify-center">
                 <div className="text-6xl opacity-10 group-hover:opacity-20 transition-opacity">
                    {selectedFrame.type === 'zoom' ? '🔍' : '🎬'}
                 </div>
              </div>

              {/* TikTok UI Overlays */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Top: Live Indicator */}
                <div className="flex justify-between items-start">
                    <div className="px-3 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white/80">
                        HD 60FPS
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <span className="text-xs text-white">⚙️</span>
                    </div>
                </div>

                {/* Right Side: Interaction Icons */}
                <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors">
                            ❤️
                        </div>
                        <span className="text-[10px] font-bold text-white shadow-sm">1.2M</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors">
                            💬
                        </div>
                        <span className="text-[10px] font-bold text-white shadow-sm">842</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors">
                            🔖
                        </div>
                        <span className="text-[10px] font-bold text-white shadow-sm">45K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg hover:bg-white/20 transition-colors">
                            ⤴️
                        </div>
                    </div>
                </div>

                {/* Bottom: Info Overlay */}
                <div className="flex flex-col gap-2 max-w-[80%]">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        @hyperforge_pro <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded-sm">FOLLOW</span>
                    </h3>
                    <p className="text-xs text-white/90 line-clamp-2">
                        Testing the new {selectedFrame.label} effect in HyperForge Studio. Look at that {selectedFrame.easing} easing! 🚀 #hyperforge #ai
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">🎵</span>
                        <div className="overflow-hidden w-40">
                            <p className="text-[10px] text-white/80 whitespace-nowrap animate-[marquee_10s_linear_infinite]">
                                Original Audio - HyperForge Studio AI
                            </p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Play/Pause Button (Large Center) */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity ${isPlaying ? 'bg-transparent' : ''}`}
              >
                <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white text-2xl transition-transform ${isPlaying ? 'scale-0' : 'scale-100'}`}>
                    {isPlaying ? '⏸' : '▶'}
                </div>
              </button>

              {/* Progress Bar (TikTok Bottom) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div 
                    className="h-full bg-accent relative" 
                    style={{ width: isPlaying ? '100%' : '35%', transition: isPlaying ? 'width 5s linear' : 'none' }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-10 h-full justify-center">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-2">
                🎬
              </div>
              <h3 className="text-lg font-bold text-white">
                No Preview
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-[180px]">
                Wähle einen Hyperframe aus, um ihn im TikTok-Player zu testen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Code / Meta Info */}
      <div className="px-6 py-6 border-t border-white/5">
        {selectedFrame && isCodeView ? (
          <div className="glass-panel p-4 rounded-2xl">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">Frame Data</span>
                <span className="text-[10px] text-white/30 font-mono">ID: {selectedFrame.id}</span>
             </div>
             <pre className="text-[10px] font-mono text-text-secondary overflow-x-auto max-h-32">
                {JSON.stringify({ 
                    easing: selectedFrame.easing, 
                    effect: selectedFrame.effect,
                    duration: selectedFrame.duration,
                    pos: selectedFrame.end.x + ',' + selectedFrame.end.y
                }, null, 2)}
             </pre>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary font-medium">Export Estimate</span>
                <span className="text-xs text-white font-bold">~1.2 Seconds</span>
            </div>
            <button className="premium-button w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Render High Quality
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
