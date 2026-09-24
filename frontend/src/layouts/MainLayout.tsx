import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Icon } from '../components/ui/Icon';
import { isDemoMode } from '../services/demoStore';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => { setDemo(isDemoMode()); }, []);

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
          >
            <Icon name="menu" className="w-6 h-6" />
          </button>
          <h1 className="font-sport text-lg font-bold text-white">ERP Futbol</h1>
        </header>

        <main className="p-4 lg:p-6">
          {demo && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2">
              <Icon name="alerta" className="w-4 h-4 shrink-0" />
              Modo demo — Los datos se guardan localmente en tu navegador
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
