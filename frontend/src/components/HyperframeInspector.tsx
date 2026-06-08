import { useCallback } from 'react';
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
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[10px] w-12 shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: 'var(--accent)',
          backgroundColor: 'var(--border-color)',
        }}
      />
      <span className="text-[10px] w-10 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
        {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State editor for a single FrameState (start or end)
// ---------------------------------------------------------------------------

function FrameStateEditor({
  label,
  state,
  onChange,
}: {
  label: string;
  state: FrameState;
  onChange: (s: FrameState) => void;
}) {
  const set = (key: keyof FrameState) => (val: number) => {
    onChange({ ...state, [key]: key === 'opacity' || key === 'scale' || key === 'blur' ? val : Math.round(val) });
  };

  return (
    <div className="mb-3">
      <h5 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
        {label}
      </h5>
      <div className="space-y-1.5">
        <SliderField label="X" value={state.x} min={-500} max={500} step={1} onChange={set('x')} />
        <SliderField label="Y" value={state.y} min={-500} max={500} step={1} onChange={set('y')} />
        <SliderField label="Scale" value={state.scale} min={0.1} max={5} step={0.1} onChange={set('scale')} />
        <SliderField label="Rotate" value={state.rotation} min={-180} max={180} step={1} onChange={set('rotation')} />
        <SliderField label="Opacity" value={state.opacity} min={0} max={1} step={0.05} onChange={set('opacity')} />
        <SliderField label="Blur" value={state.blur} min={0} max={20} step={0.5} onChange={set('blur')} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inspector Panel — shows when a Hyperframe is selected
// ---------------------------------------------------------------------------

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

  const project = projects.find((p) => p.id === activeProjectId);
  const hf = project?.hyperframes.find((f) => f.id === selectedHyperframeId);

  if (!project || !hf) return null;

  const update = useCallback(
    (updates: Partial<typeof hf>) => {
      updateHyperframe(project.id, hf.id, updates);
    },
    [project.id, hf.id, updateHyperframe],
  );

  return (
    <div
      className="border-t overflow-y-auto"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-primary)',
        maxHeight: '45vh',
      }}
    >
      <div className="px-6 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {hf.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {hf.id}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => duplicateHyperframe(project.id, hf.id)}
              className="px-2 py-1 text-[10px] rounded transition-all"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
              title="Duplizieren"
            >
              📋
            </button>
            <button
              onClick={() => removeHyperframe(project.id, hf.id)}
              className="px-2 py-1 text-[10px] rounded transition-all"
              style={{ color: 'var(--danger)', backgroundColor: 'rgba(231, 76, 60, 0.1)' }}
              title="Löschen"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Type & Duration row */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Typ
            </label>
            <input
              className="w-full px-2 py-1.5 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              value={hf.type}
              onChange={(e) => update({ type: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Duration (s)
            </label>
            <input
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              className="w-full px-2 py-1.5 rounded text-xs"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              value={hf.duration}
              onChange={(e) => update({ duration: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
            />
          </div>
        </div>

        {/* Easing selector */}
        <div className="mb-3">
          <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
            Easing
          </label>
          <select
            className="w-full px-2 py-1.5 rounded text-xs"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
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

        {/* Effect selector */}
        <div className="mb-3">
          <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
            Effect
          </label>
          <select
            className="w-full px-2 py-1.5 rounded text-xs"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            value={hf.effect}
            onChange={(e) => update({ effect: e.target.value })}
          >
            <option value="none">None</option>
            <option value="morph">Morph</option>
            <option value="glitch">Glitch</option>
            <option value="blur">Blur</option>
            <option value="zoom-blur">Zoom Blur</option>
            <option value="shake">Shake</option>
            <option value="fade">Fade</option>
            <option value="crossfade">Crossfade</option>
          </select>
        </div>

        {/* Keyframe State Editors */}
        <FrameStateEditor label="Start State" state={hf.start} onChange={(s) => update({ start: s })} />
        <FrameStateEditor label="End State" state={hf.end} onChange={(s) => update({ end: s })} />

        {/* Code View */}
        {isCodeView && (
          <div className="mt-2">
            <label className="text-[10px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>
              Raw JSON
            </label>
            <pre
              className="text-[10px] p-2 rounded overflow-auto max-h-40"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            >
              {JSON.stringify({ ...hf, start: hf.start, end: hf.end }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}