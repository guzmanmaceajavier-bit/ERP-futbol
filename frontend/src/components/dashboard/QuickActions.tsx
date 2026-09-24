import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../ui/Icon';

const allActions = [
  { label: 'Registrar pago', path: '/pagos', color: 'bg-green-600', icon: 'agregar' as const },
  { label: 'Registrar jugador', path: '/jugadores', color: 'bg-blue-600', icon: 'usuarios' as const },
  { label: 'Registrar gasto', path: '/gastos', color: 'bg-red-600', icon: 'billetera' as const },
  { label: 'Ver reportes', path: '/reportes', color: 'bg-purple-600', icon: 'grafica' as const },
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
          <Icon name={action.icon} className={`w-5 h-5 ${action.color.replace('bg-', 'text-')} group-hover:text-white transition-colors`} />
          <span className="text-xs text-slate-300 group-hover:text-white transition-colors font-medium">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
