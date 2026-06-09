import { useEffect } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import type { NavigationTab } from '../types';

const navItems: { id: NavigationTab; label: string; icon: JSX.Element }[] = [
  { 
    id: 'templates', 
    label: 'Templates', 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> 
  },
  { 
    id: 'projects', 
    label: 'Projects', 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> 
  },
  { 
    id: 'export', 
    label: 'Export', 
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> 
  },
];

export default function Sidebar() {
  const {
    activeTab, setActiveTab,
    isCodeView, toggleCodeView,
    engineStatus, engineLoading,
    checkEngineHealth,
  } = useDashboardStore();

  // Check engine health on mount and periodically
  useEffect(() => {
    checkEngineHealth();
    const interval = setInterval(checkEngineHealth, 15000);
    return () => clearInterval(interval);
  }, [checkEngineHealth]);

  const getStatusColor = () => {
    if (engineLoading === 'loading') return 'bg-warning';
    if (engineStatus?.status === 'ok') return 'bg-success shadow-[0_0_10px_rgba(0,206,201,0.5)]';
    return 'bg-danger';
  };

  const getStatusText = () => {
    if (engineLoading === 'loading') return 'CONNECTING...';
    if (engineStatus?.status === 'ok') return `ENGINE v${engineStatus.version || '1.0'}`;
    return 'OFFLINE';
  };

  return (
    <aside
      className="h-full flex flex-col border-r border-white/5 bg-bg-primary/80 backdrop-blur-2xl"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-3 px-8 py-8 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/40 relative group overflow-hidden">
           <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain z-10" />
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white leading-none">
            HYPER<span className="text-accent">FORGE</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 leading-none mt-1">
            Studio
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-accent text-white shadow-xl shadow-accent/20 translate-x-1' 
                : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-white' : 'text-text-secondary'} transition-colors`}>
              {item.icon}
            </div>
            <span className="tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 py-8 border-t border-white/5 space-y-4">
        <button
          onClick={toggleCodeView}
          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
            isCodeView 
              ? 'bg-bg-tertiary text-accent ring-1 ring-accent/30 shadow-inner shadow-accent/5' 
              : 'text-text-secondary hover:text-white hover:bg-white/5'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="tracking-wide">Code View</span>
        </button>

        {/* Live Engine Status */}
        <div className="px-5 py-4 rounded-2xl bg-black/30 border border-white/5 group">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${engineLoading === 'loading' ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-white transition-colors">
                {getStatusText()}
            </span>
          </div>
          {engineStatus?.status === 'ok' && (
            <div className="flex flex-col gap-1.5 opacity-40 group-hover:opacity-70 transition-opacity">
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter text-white">
                    <span>FFmpeg Engine</span>
                    <span className={engineStatus.ffmpegAvailable ? 'text-success' : 'text-danger'}>
                        {engineStatus.ffmpegAvailable ? 'READY' : 'MISSING'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-tighter text-white">
                    <span>OpenCV Logic</span>
                    <span className={engineStatus.opencvAvailable ? 'text-success' : 'text-danger'}>
                        {engineStatus.opencvAvailable ? 'READY' : 'MISSING'}
                    </span>
                </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
