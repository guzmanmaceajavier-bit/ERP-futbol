import { type ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  className?: string;
}

export function KPICard({ label, value, icon, color, className = '' }: KPICardProps) {
  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-2xl p-5 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="font-mono text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}
