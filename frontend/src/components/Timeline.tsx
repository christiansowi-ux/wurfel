import { useState, useCallback, useRef } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import HyperframeInspector from './HyperframeInspector';

// ---------------------------------------------------------------------------
// Icons per effect type
// ---------------------------------------------------------------------------

function getFrameIcon(type: string, effect: string): string {
  if (effect === 'morph') return '🌀';
  if (effect === 'glitch') return '⚡';
  if (effect === 'shake') return '📳';
  if (effect === 'blur' || effect === 'zoom-blur') return '🌫️';
  if (effect === 'fade' || effect === 'crossfade') return '🌅';
  if (type === 'zoom-in' || type === 'zoom') return '🔍';
  if (type === 'slide-left' || type === 'slide') return '➡️';
  if (type === 'bounce') return '🏀';
  if (type.includes('text')) return '📝';
  if (type === 'transition') return '↔️';
  if (type === 'effect') return '✨';
  return '🎬';
}

// ---------------------------------------------------------------------------
// Draggable frame card
// ---------------------------------------------------------------------------

function DraggableFrameCard({
  hf,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  hf: { id: string; label: string; duration: number; type: string; effect: string; easing: string };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={() => onDrop(index)}
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none w-40"
      style={{
        backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.12)' : 'var(--bg-tertiary)',
        border: `1px solid ${
          isSelected ? 'var(--accent)' : 'var(--border-color)'
        }`,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.backgroundColor = 'rgba(108, 92, 231, 0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        }
      }}
    >
      {/* Drag handle indicator */}
      <span
        className="absolute top-1 left-1 text-[9px] opacity-0 group-hover:opacity-40 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        ⠿
      </span>

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

      {/* Actions (top-right, visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="text-[10px] px-1 py-0.5 rounded transition-all hover:scale-110"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)' }}
          title="Duplizieren"
        >
          📋
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-[10px] px-1 py-0.5 rounded transition-all hover:scale-110"
          style={{ color: 'var(--danger)', backgroundColor: 'rgba(231, 76, 60, 0.1)' }}
          title="Löschen"
        >
          ✕
        </button>
      </div>

      {/* Frame icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mt-3"
        style={{
          backgroundColor: isSelected
            ? 'rgba(108, 92, 231, 0.2)'
            : 'rgba(255,255,255,0.04)',
        }}
      >
        {getFrameIcon(hf.type, hf.effect)}
      </div>

      {/* Frame info */}
      <div className="text-center">
        <p
          className="text-sm font-medium truncate max-w-[120px]"
          style={{
            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
          }}
        >
          {hf.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {hf.duration.toFixed(1)}s
          {hf.effect !== 'none' && ` • ${hf.effect}`}
        </p>
      </div>

      {/* Easing badge */}
      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.1)' : 'var(--bg-primary)',
          color: 'var(--text-secondary)',
        }}
      >
        {hf.easing}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

export default function Timeline() {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    selectedHyperframeId,
    setSelectedHyperframe,
    addHyperframe,
    removeHyperframe,
    duplicateHyperframe,
    reorderHyperframes,
    isCodeView,
    toggleCodeView,
  } = useDashboardStore();

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  // Drag & Drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    dragOverIndex.current = null;
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (dragIndex !== null && dragIndex !== dropIndex && activeProject) {
        reorderHyperframes(activeProject.id, dragIndex, dropIndex);
      }
      setDragIndex(null);
      dragOverIndex.current = null;
    },
    [dragIndex, activeProject, reorderHyperframes],
  );

  // Add a new blank frame
  const handleAddFrame = useCallback(() => {
    if (!activeProject) return;
    const newFrame = {
      id: `hf-${Date.now()}`,
      type: 'transition',
      label: `Frame ${activeProject.hyperframes.length + 1}`,
      duration: 1.0,
      easing: 'ease-in-out',
      effect: 'none',
      start: { x: 0, y: 0, scale: 1.0, rotation: 0, opacity: 1.0, color: null, blur: 0 },
      end: { x: 100, y: 50, scale: 1.5, rotation: 15, opacity: 1.0, color: null, blur: 0 },
    };
    addHyperframe(activeProject.id, newFrame);
    setSelectedHyperframe(newFrame.id);
  }, [activeProject, addHyperframe, setSelectedHyperframe]);

  // No project selected
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
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {activeProject.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Code view toggle */}
          <button
            onClick={toggleCodeView}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: isCodeView ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: isCodeView ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${isCodeView ? 'var(--accent)' : 'var(--border-color)'}`,
            }}
          >
            {'</>'} JSON
          </button>
          {/* Add frame */}
          <button
            onClick={handleAddFrame}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            + Frame
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-6 py-3 flex gap-2 flex-wrap border-b" style={{ borderColor: 'var(--border-color)' }}>
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
            <span className="ml-1.5 opacity-70">({project.updatedAt.slice(0, 10)})</span>
          </button>
        ))}
      </div>

      {/* Timeline Frames */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeProject.hyperframes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Noch keine Hyperframes in diesem Projekt
            </p>
            <button
              onClick={handleAddFrame}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              Ersten Frame hinzufügen
            </button>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {activeProject.hyperframes.map((hf, index) => (
              <div
                key={hf.id}
                className={`transition-opacity duration-150 ${
                  dragIndex === index ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <DraggableFrameCard
                  hf={hf}
                  index={index}
                  isSelected={selectedHyperframeId === hf.id}
                  onSelect={() => setSelectedHyperframe(hf.id)}
                  onDelete={() => removeHyperframe(activeProject.id, hf.id)}
                  onDuplicate={() => duplicateHyperframe(activeProject.id, hf.id)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspector Panel (appears when a frame is selected) */}
      {selectedHyperframeId && <HyperframeInspector />}
    </div>
  );
}