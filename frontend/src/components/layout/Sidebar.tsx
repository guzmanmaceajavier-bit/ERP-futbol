import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

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
    items: [{ to: '/', label: 'Dashboard', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }],
  },
  {
    group: 'ESCUELA',
    items: [
      { to: '/jugadores', label: 'Jugadores', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { to: '/categorias', label: 'Categorias', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { to: '/profesores', label: 'Profesores', roles: ['super_admin', 'admin'], icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { to: '/asistencias', label: 'Asistencias', roles: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { to: '/torneos', label: 'Torneos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    ],
  },
  {
    group: 'DEPORTIVO',
    items: [
      { to: '/entrenamientos', label: 'Entrenamientos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { to: '/partidos', label: 'Partidos', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/convocatorias', label: 'Convocatorias', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    ],
  },
  {
    group: 'DINERO',
    items: [
      { to: '/pagos', label: 'Pagos', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { to: '/caja', label: 'Caja', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/gastos', label: 'Gastos', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1' },
      { to: '/reportes', label: 'Reportes', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  {
    group: 'CANCHA',
    items: [
      { to: '/inventario', label: 'Inventario', roles: ['super_admin', 'admin', 'auxiliar', 'asistente', 'tesorero'], icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { to: '/notas', label: 'Notas', roles: ['super_admin', 'admin', 'entrenador', 'profe'], icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    ],
  },
  {
    group: 'SISTEMA',
    items: [
      { to: '/alertas', label: 'Cobranzas', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { to: '/whatsapp', label: 'WhatsApp', roles: ['super_admin', 'admin', 'tesorero'], icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { to: '/bitacora', label: 'Bitacora', roles: ['super_admin'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { to: '/configuracion', label: 'Configuracion', roles: ['super_admin'], icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
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

  const renderIcon = (d: string, isActive: boolean) => (
    <svg className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#22C55E]' : 'text-slate-500'}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
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
            <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isOpenGroup ? 'rotate-0' : '-rotate-90'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
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
            <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Cerrar sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
