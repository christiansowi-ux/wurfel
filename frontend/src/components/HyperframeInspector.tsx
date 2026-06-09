import { useCallback, useState } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import type { FrameState } from '../types';

// ---------------------------------------------------------------------------
// Slider input component for keyframe values
// ---------------------------------------------------------------------------

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const id = `slider-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            {label}
        </label>
        <span className="text-[10px] font-mono font-bold text-accent">
            {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-accent"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inspector Panel — shows when a Hyperframe is selected
// ---------------------------------------------------------------------------

type InspectorTab = 'general' | 'transform' | 'effects' | 'code';

export default function HyperframeInspector() {
  const {
    projects,
    activeProjectId,
    selectedHyperframeId,
    updateHyperframe,
    removeHyperframe,
    duplicateHyperframe,
    isCodeView,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<InspectorTab>('general');

  const project = projects.find((p) => p.id === activeProjectId);
  const hf = project?.hyperframes.find((f) => f.id === selectedHyperframeId);

  if (!project || !hf) return null;

  const update = useCallback(
    (updates: Partial<typeof hf>) => {
      updateHyperframe(project.id, hf.id, updates);
    },
    [project.id, hf.id, updateHyperframe],
  );

  const updateState = (key: 'start' | 'end', field: keyof FrameState, val: any) => {
    const newState = { ...hf[key], [field]: val };
    update({ [key]: newState });
  };

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'transform', label: 'Transform' },
    { id: 'effects', label: 'Effects' },
    { id: 'code', label: 'Source' },
  ];

  return (
    <div className="border-t border-white/5 bg-bg-primary/90 backdrop-blur-2xl overflow-hidden flex flex-col h-[50vh]">
      {/* Tabs Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-2 ${
                    activeTab === tab.id ? 'text-accent' : 'text-text-secondary hover:text-white'
                }`}
            >
                {tab.label}
                {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
                )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            <button
              onClick={() => duplicateHyperframe(project.id, hf.id)}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs hover:bg-white/10 transition-colors"
              title="Duplicate"
            >
              📋
            </button>
            <button
              onClick={() => removeHyperframe(project.id, hf.id)}
              className="w-8 h-8 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-xs text-danger hover:bg-danger/20 transition-colors"
              title="Delete"
            >
              🗑️
            </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-6">
                <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">Properties</h4>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Label</label>
                        <input
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-accent transition-all text-xs font-bold text-white outline-none"
                            value={hf.label}
                            onChange={(e) => update({ label: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Duration (s)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-accent transition-all text-xs font-bold text-white outline-none"
                                value={hf.duration}
                                onChange={(e) => update({ duration: parseFloat(e.target.value) || 0.1 })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Easing</label>
                            <select
                                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-accent transition-all text-xs font-bold text-white outline-none appearance-none"
                                value={hf.easing}
                                onChange={(e) => update({ easing: e.target.value })}
                            >
                                <option value="linear">Linear</option>
                                <option value="ease-in">Ease In</option>
                                <option value="ease-out">Ease Out</option>
                                <option value="ease-in-out">Ease In Out</option>
                                <option value="bounce">Bounce</option>
                                <option value="elastic">Elastic</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h4 className="text-[11px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">Text Overlay</h4>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Caption Text</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-accent transition-all text-xs font-medium text-white outline-none min-h-[80px] resize-none"
                            placeholder="Enter text..."
                            value={hf.text || ''}
                            onChange={(e) => update({ text: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Text Color</label>
                            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                                <input
                                    type="color"
                                    className="w-6 h-6 rounded-lg bg-transparent border-none cursor-pointer"
                                    value={hf.text_color || '#FFFFFF'}
                                    onChange={(e) => update({ text_color: e.target.value })}
                                />
                                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{hf.text_color || '#FFFFFF'}</span>
                            </div>
                        </div>
                        <div>
                             <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">Size</label>
                             <input
                                type="number"
                                className="w-20 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 focus:border-accent transition-all text-xs font-bold text-white outline-none"
                                value={hf.font_size || 48}
                                onChange={(e) => update({ font_size: parseInt(e.target.value) || 48 })}
                            />
                        </div>
                    </div>
                </div>
            </section>
          </div>
        )}

        {activeTab === 'transform' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <h4 className="text-[11px] font-black text-accent uppercase tracking-widest border-b border-accent/20 pb-2">Start State</h4>
                <div className="grid grid-cols-2 gap-3">
                    <SliderField label="X Pos" value={hf.start.x} min={-500} max={500} step={1} onChange={(v) => updateState('start', 'x', v)} />
                    <SliderField label="Y Pos" value={hf.start.y} min={-500} max={500} step={1} onChange={(v) => updateState('start', 'y', v)} />
                    <SliderField label="Scale" value={hf.start.scale} min={0.1} max={5} step={0.01} onChange={(v) => updateState('start', 'scale', v)} />
                    <SliderField label="Rotation" value={hf.start.rotation} min={-180} max={180} step={1} onChange={(v) => updateState('start', 'rotation', v)} />
                    <SliderField label="Opacity" value={hf.start.opacity} min={0} max={1} step={0.01} onChange={(v) => updateState('start', 'opacity', v)} />
                    <SliderField label="Blur" value={hf.start.blur} min={0} max={50} step={0.5} onChange={(v) => updateState('start', 'blur', v)} />
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-[11px] font-black text-accent-hover uppercase tracking-widest border-b border-accent/20 pb-2">End State</h4>
                <div className="grid grid-cols-2 gap-3">
                    <SliderField label="X Pos" value={hf.end.x} min={-500} max={500} step={1} onChange={(v) => updateState('end', 'x', v)} />
                    <SliderField label="Y Pos" value={hf.end.y} min={-500} max={500} step={1} onChange={(v) => updateState('end', 'y', v)} />
                    <SliderField label="Scale" value={hf.end.scale} min={0.1} max={5} step={0.01} onChange={(v) => updateState('end', 'scale', v)} />
                    <SliderField label="Rotation" value={hf.end.rotation} min={-180} max={180} step={1} onChange={(v) => updateState('end', 'rotation', v)} />
                    <SliderField label="Opacity" value={hf.end.opacity} min={0} max={1} step={0.01} onChange={(v) => updateState('end', 'opacity', v)} />
                    <SliderField label="Blur" value={hf.end.blur} min={0} max={50} step={0.5} onChange={(v) => updateState('end', 'blur', v)} />
                </div>
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="max-w-xl space-y-8">
             <div>
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-4">Visual Effect Engine</label>
                <div className="grid grid-cols-3 gap-3">
                    {['none', 'morph', 'glitch', 'blur', 'zoom-blur', 'shake', 'fade', 'crossfade'].map(fx => (
                        <button
                            key={fx}
                            onClick={() => update({ effect: fx as any })}
                            className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                hf.effect === fx 
                                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
                                    : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20 hover:text-white'
                            }`}
                        >
                            {fx}
                        </button>
                    ))}
                </div>
             </div>
             
             <div className="glass-panel p-6 rounded-[2rem] border-accent/20">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-xl text-accent">
                        ✨
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-white">Advanced Post-Processing</h5>
                        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold mt-1">Status: Optimized for Mobile</p>
                    </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                    Die Hyperframe Engine nutzt Hardware-Beschleunigung für flüssige Effekte. Effekte werden Frame für Frame berechnet und in Echtzeit interpoliert.
                </p>
             </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="h-full">
            <pre className="p-6 rounded-[2rem] bg-black/40 border border-white/5 text-[10px] font-mono text-accent-hover overflow-auto h-full shadow-inner">
              {JSON.stringify(hf, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
