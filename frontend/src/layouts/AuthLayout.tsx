import { type ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-sport text-3xl font-bold text-white tracking-tight">
            ERP <span className="text-[#22C55E]">Futbol</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sistema de gestion de escuela de futbol</p>
        </div>
        {children}
      </div>
    </div>
  );
}
