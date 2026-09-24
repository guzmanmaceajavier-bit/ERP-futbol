import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { Icon } from '../ui/Icon';

interface MenuItem {
  to: string;
  label: string;
  roles: UserRole[];
  icon: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const MENU: MenuGroup[] = [
  {
    group: 'INICIO',
    items: [{ to: '/', label: 'Dashboard', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'inicio' }],
  },
  {
    group: 'ESCUELA',
    items: [
      { to: '/jugadores', label: 'Jugadores', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'usuarios' },
      { to: '/categorias', label: 'Categorias', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'archivar' },
      { to: '/profesores', label: 'Profesores', roles: ['super_admin', 'admin'], icon: 'usuario' },
      { to: '/asistencias', label: 'Asistencias', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'asistencias' },
      { to: '/torneos', label: 'Torneos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'torneos' },
    ],
  },
  {
    group: 'DEPORTIVO',
    items: [
      { to: '/entrenamientos', label: 'Entrenamientos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'entrenamientos' },
      { to: '/partidos', label: 'Partidos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'partidos' },
      { to: '/convocatorias', label: 'Convocatorias', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'convocatorias' },
    ],
  },
  {
    group: 'DINERO',
    items: [
      { to: '/pagos', label: 'Pagos', roles: ['super_admin', 'admin', 'tesorero'], icon: 'dinero' },
      { to: '/caja', label: 'Caja', roles: ['super_admin', 'admin', 'tesorero'], icon: 'caja' },
      { to: '/gastos', label: 'Gastos', roles: ['super_admin', 'admin', 'tesorero'], icon: 'efectivo' },
      { to: '/reportes', label: 'Reportes', roles: ['super_admin', 'admin', 'tesorero'], icon: 'grafica' },
    ],
  },
  {
    group: 'CANCHA',
    items: [
      { to: '/inventario', label: 'Inventario', roles: ['super_admin', 'admin', 'auxiliar', 'asistente', 'tesorero'], icon: 'inventario' },
      { to: '/notas', label: 'Notas', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'notas' },
    ],
  },
  {
    group: 'SISTEMA',
    items: [
      { to: '/alertas', label: 'Cobranzas', roles: ['super_admin', 'admin', 'tesorero'], icon: 'cobranzas' },
      { to: '/whatsapp', label: 'WhatsApp', roles: ['super_admin', 'admin', 'tesorero'], icon: 'whatsapp' },
      { to: '/bitacora', label: 'Bitacora', roles: ['super_admin'], icon: 'bitacora' },
      { to: '/configuracion', label: 'Configuracion', roles: ['super_admin'], icon: 'configuracion' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    INICIO: true, ESCUELA: true, DEPORTIVO: true, DINERO: true, CANCHA: true, SISTEMA: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleLogout = () => {
    if (window.confirm('Seguro que deseas cerrar sesion?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const renderIcon = (name: string, isActive: boolean) => (
    <Icon name={name} className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#22C55E]' : 'text-slate-500'}`} />
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-[#0B1120] border-r border-slate-700/50
          transform transition-all duration-300 ease-in-out flex flex-col
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-[68px]' : 'w-64'}`}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-sport text-lg font-bold text-white tracking-tight">
                ERP <span className="text-[#22C55E]">Futbol</span>
              </h1>
              {user && (
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.nombre}</p>
              )}
            </div>
          )}
          <button
            onClick={onToggleCollapsed}
            className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors hidden lg:block ${collapsed ? 'mx-auto' : ''}`}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <Icon name="izquierda" className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <Icon name="cerrar" className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          {MENU.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!user) return false;
              return item.roles.includes(user.role);
            });
            if (visibleItems.length === 0) return null;

            const isOpenGroup = openGroups[group.group] ?? true;

            return (
              <div key={group.group} className="mb-1">
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-400 transition-colors"
                  >
                    <span>{group.group}</span>
                    <Icon name="abajo" className={`w-3 h-3 transition-transform duration-200 ${isOpenGroup ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="px-3 py-2">
                    <div className="w-full h-px bg-slate-700/50" />
                  </div>
                )}

                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpenGroup || collapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5
                        ${
                          isActive
                            ? 'bg-[#22C55E]/10 text-[#22C55E] shadow-sm shadow-[#22C55E]/5'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`
                      }
                    >
                      {renderIcon(item.icon, false)}
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-3 border-t border-slate-700/50 flex-shrink-0 space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-slate-500 truncate">{user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'tesorero' ? 'Tesorero' : user.role === 'entrenador' || user.role === 'profe' ? 'Profesor' : 'Auxiliar'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 w-full rounded-lg text-sm text-slate-400
              hover:bg-red-500/10 hover:text-red-400 transition-colors`}
            title={collapsed ? 'Cerrar sesion' : undefined}
          >
            <Icon name="salir" className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Cerrar sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
