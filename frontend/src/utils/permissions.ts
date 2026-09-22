import type { UserRole } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  tesorero: 3,
  entrenador: 2,
  profe: 2,
  auxiliar: 1,
  asistente: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export const PERMISOS: Record<string, UserRole[]> = {
  jugadores: ['super_admin', 'admin', 'tesorero', 'entrenador', 'profe', 'auxiliar', 'asistente'],
  pagos: ['super_admin', 'admin', 'tesorero'],
  caja: ['super_admin', 'admin', 'tesorero'],
  gastos: ['super_admin', 'admin', 'tesorero'],
  reportes: ['super_admin', 'admin', 'tesorero'],
  categorias: ['super_admin', 'admin', 'entrenador', 'profe'],
  profesores: ['super_admin', 'admin'],
  asistencias: ['super_admin', 'admin', 'entrenador', 'profe', 'auxiliar', 'asistente'],
  entrenamientos: ['super_admin', 'admin', 'entrenador', 'profe'],
  partidos: ['super_admin', 'admin', 'entrenador', 'profe'],
  convocatorias: ['super_admin', 'admin', 'entrenador', 'profe'],
  torneos: ['super_admin', 'admin', 'entrenador', 'profe'],
  inventario: ['super_admin', 'admin', 'auxiliar', 'asistente', 'tesorero'],
  notas: ['super_admin', 'admin', 'entrenador', 'profe'],
  cobranzas: ['super_admin', 'admin', 'tesorero'],
  whatsapp: ['super_admin', 'admin', 'tesorero'],
  bitacora: ['super_admin'],
  configuracion: ['super_admin'],
};
