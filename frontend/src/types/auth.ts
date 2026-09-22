export type UserRole = 'super_admin' | 'admin' | 'tesorero' | 'entrenador' | 'profe' | 'auxiliar' | 'asistente';

export interface User {
  id: number;
  username: string;
  nombre: string;
  role: UserRole;
  activo?: boolean;
  ultimo_acceso?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;
}

export interface RegisterPayload {
  username: string;
  password: string;
  nombre: string;
  role: UserRole;
}

export interface VerifyResponse {
  valido: boolean;
  usuario: User;
}
