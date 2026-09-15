import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const allActions = [
  { label: 'Registrar pago', path: '/pagos', color: 'bg-green-600', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { label: 'Registrar jugador', path: '/jugadores', color: 'bg-blue-600', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { label: 'Registrar gasto', path: '/gastos', color: 'bg-red-600', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z' },
  { label: 'Ver reportes', path: '/reportes', color: 'bg-purple-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const visible = allActions.filter(a => {
    if (['/pagos', '/gastos'].includes(a.path)) return hasRole('admin', 'super_admin');
    return true;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {visible.map(action => (
        <button
          key={action.path}
          onClick={() => navigate(action.path)}
          className={`flex items-center gap-3 p-4 ${action.color}/20 border border-slate-700 rounded-xl hover:border-slate-500 transition-all duration-200 group`}
        >
          <svg className={`w-5 h-5 ${action.color.replace('bg-', 'text-')} group-hover:text-white transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
          </svg>
          <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-medium">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
