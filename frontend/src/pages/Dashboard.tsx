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
    <div className="flex h-full w-full relative overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {renderMainContent()}
      </main>

      {/* Preview Panel */}
      <PreviewPanel />
    </div>
  );
}