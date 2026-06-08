import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Timeline from '../components/Timeline';
import TemplatesGallery from '../components/TemplatesGallery';
import ExportPanel from '../components/ExportPanel';
import PreviewPanel from '../components/PreviewPanel';
import { useDashboardStore } from '../stores/dashboardStore';

export default function Dashboard() {
  const { activeTab, fetchTemplates, checkEngineHealth, templatesLoading } = useDashboardStore();

  // Initial data load
  useEffect(() => {
    checkEngineHealth();
    if (templatesLoading === 'idle') {
      fetchTemplates();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderMainContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplatesGallery />;
      case 'projects':
        return <Timeline />;
      case 'export':
        return <ExportPanel />;
      default:
        return <TemplatesGallery />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {renderMainContent()}
      </main>

      {/* Preview Panel */}
      <PreviewPanel />
    </div>
  );
}