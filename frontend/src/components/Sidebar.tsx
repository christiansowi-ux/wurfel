import { useEffect } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import type { NavigationTab } from '../types';

const navItems: { id: NavigationTab; label: string; icon: string }[] = [
  { id: 'templates', label: 'Templates', icon: '🎨' },
  { id: 'projects', label: 'Projekte', icon: '📁' },
  { id: 'export', label: 'Export', icon: '📤' },
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
    if (engineLoading === 'loading') return 'var(--warning)';
    if (engineStatus?.status === 'ok') return 'var(--success)';
    return 'var(--danger)';
  };

  const getStatusText = () => {
    if (engineLoading === 'loading') return 'Verbinde...';
    if (engineStatus?.status === 'ok') return `Engine ${engineStatus.version}`;
    return 'Offline';
  };

  return (
    <aside
      className="h-full flex flex-col border-r"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Brand / Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          H
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            HyperForge
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Studio
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: activeTab === item.id ? 'var(--accent)' : 'transparent',
              color: activeTab === item.id ? '#fff' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={toggleCodeView}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: isCodeView ? 'var(--bg-tertiary)' : 'transparent',
            color: isCodeView ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isCodeView ? 'var(--bg-tertiary)' : 'transparent';
          }}
        >
          <span className="text-lg">{'</>'}</span>
          <span>Code-Ansicht</span>
        </button>

        {/* Live Engine Status */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: getStatusColor(),
              animation: engineLoading === 'loading' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <div className="flex flex-col">
            <span>{getStatusText()}</span>
            {engineStatus?.status === 'ok' && (
              <span className="text-[10px] opacity-60">
                FFmpeg: {engineStatus.ffmpegAvailable ? '✓' : '✗'} | OpenCV: {engineStatus.opencvAvailable ? '✓' : '✗'}
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}