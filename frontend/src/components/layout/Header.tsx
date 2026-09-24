import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400">
            <Icon name="menu" className="w-5 h-5" />
          </button>
        )}
        {title && <h2 className="font-sport text-lg font-bold text-white">{title}</h2>}
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 hidden sm:block">{user.nombre}</span>
          <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/30 flex items-center justify-center text-xs font-bold text-[#22C55E]">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}
