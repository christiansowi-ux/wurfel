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
  isDragOver,
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
  isDragOver: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={() => onDrop(index)}
      onClick={onSelect}
      className={`group relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-300 cursor-grab active:cursor-grabbing select-none w-48 premium-card ${
        isSelected ? 'ring-2 ring-accent border-transparent' : ''
      } ${isDragOver ? 'translate-x-4' : ''}`}
    >
      {/* Drag handle indicator */}
      <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] opacity-20 group-hover:opacity-60 transition-opacity">
        ⠿
      </span>

      {/* Frame number badge */}
      <span className="absolute top-4 left-4 text-[10px] font-black px-2 py-0.5 rounded-lg bg-black/40 text-white/50 backdrop-blur-md">
        #{index + 1}
      </span>

      {/* Actions (visible on hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 flex gap-1.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-[10px]"
          title="Duplizieren"
        >
          📋
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-danger/20 hover:bg-danger/40 transition-colors text-danger text-xs"
          title="Löschen"
        >
          ✕
        </button>
      </div>

      {/* Frame Preview / Icon Area */}
      <div
        className={`w-full aspect-[4/3] rounded-2xl flex items-center justify-center text-3xl mt-4 transition-all duration-500 shadow-inner ${
          isSelected
            ? 'bg-gradient-to-br from-accent/30 to-accent/10 scale-105'
            : 'bg-black/20 group-hover:bg-white/5'
        }`}
      >
        <span className="group-hover:scale-125 transition-transform duration-500">
          {getFrameIcon(hf.type, hf.effect)}
        </span>
      </div>

      {/* Frame info */}
      <div className="w-full text-center">
        <p className={`text-xs font-bold truncate px-2 ${isSelected ? 'text-accent-hover' : 'text-white'}`}>
          {hf.label}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-60">
                {hf.duration.toFixed(1)}s
            </span>
            <span className="w-1 h-1 rounded-full bg-text-secondary/20" />
            <span className="text-[9px] font-bold text-accent uppercase tracking-wider">
                {hf.easing}
            </span>
        </div>
      </div>

      {/* Effect badge if any */}
      {hf.effect !== 'none' && (
        <span className="absolute bottom-16 right-4 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-white shadow-lg">
            {hf.effect.toUpperCase()}
        </span>
      )}
    </div>
  );
}

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
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Drag & Drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIdx(null);
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number) => {
      if (dragIndex !== null && dragIndex !== dropIndex && activeProject) {
        reorderHyperframes(activeProject.id, dragIndex, dropIndex);
      }
      setDragIndex(null);
      setDragOverIdx(null);
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
      effect: 'none' as const,
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
        <div className="text-center max-w-md glass-panel p-10 rounded-[2rem]">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 bg-white/5">
            📁
          </div>
          <h3 className="text-xl font-bold mb-3 text-white">
            Kein Projekt ausgewählt
          </h3>
          <p className="text-sm text-text-secondary">
            Wähle ein Projekt aus oder erstelle ein neues, um mit der Bearbeitung zu beginnen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-white">
                {activeProject.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/20 text-accent uppercase tracking-wider">
                    {activeProject.hyperframes.length} Hyperframes
                </span>
                <span className="text-[10px] font-bold text-text-secondary opacity-50 uppercase tracking-widest">
                    {activeProject.hyperframes.reduce((acc, hf) => acc + hf.duration, 0).toFixed(1)}s Gesamt
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Code view toggle */}
          <button
            onClick={toggleCodeView}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
              isCodeView 
                ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
                : 'bg-white/5 border-white/10 text-text-secondary hover:text-white'
            }`}
          >
            JSON Source
          </button>
          {/* Add frame */}
          <button
            onClick={handleAddFrame}
            className="premium-button px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Add Frame
          </button>
        </div>
      </div>

      {/* Project Selector */}
      <div className="px-8 py-4 flex gap-3 flex-wrap border-b border-white/5 bg-black/10">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setActiveProject(project.id)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
              project.id === activeProjectId 
                ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/20' 
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

      {/* Timeline Frames */}
      <div className="flex-1 overflow-x-auto px-8 py-8">
        {activeProject.hyperframes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-text-secondary mb-6">
              Noch keine Hyperframes in diesem Projekt
            </p>
            <button
              onClick={handleAddFrame}
              className="premium-button px-8 py-3 rounded-2xl text-sm font-bold text-white"
            >
              Ersten Frame hinzufügen
            </button>
          </div>
        ) : (
          <div className="flex gap-6 pb-4">
            {activeProject.hyperframes.map((hf, index) => (
              <div
                key={hf.id}
                className={`transition-all duration-300 ${
                  dragIndex === index ? 'opacity-20 scale-90' : 'opacity-100'
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
                  isDragOver={dragOverIdx === index}
                />
              </div>
            ))}
            
            {/* Quick Add Button at end of timeline */}
            <button 
                onClick={handleAddFrame}
                className="w-16 h-full flex flex-col items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-white/10 hover:border-accent/40 hover:bg-accent/5 transition-all text-text-secondary hover:text-accent group shrink-0 min-h-[220px]"
            >
                <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest vertical-text">Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Inspector Panel (appears when a frame is selected) */}
      {selectedHyperframeId && <HyperframeInspector />}
    </div>
  );
}
