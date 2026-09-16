import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { isDemoMode } from '../services/demoStore';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => { setDemo(isDemoMode()); }, []);

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-sport text-lg font-bold text-white">ERP Futbol</h1>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {demo && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Modo demo — Los datos se guardan localmente en tu navegador
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
