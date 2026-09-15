import { apiClient } from './apiClient';
import type { PeriodoMensual, PeriodoResumen } from '../types';

export const periodoService = {
  getAll: (filters?: { jugador_id?: number; anio?: number }) => {
    const params = new URLSearchParams();
    if (filters?.jugador_id) params.set('jugador_id', String(filters.jugador_id));
    if (filters?.anio) params.set('anio', String(filters.anio));
    const qs = params.toString();
    return apiClient.get<PeriodoMensual[]>(`/periodos${qs ? '?' + qs : ''}`);
  },

  getResumen: (anio?: number) => {
    const params = anio ? `?resumen=true&anio=${anio}` : '?resumen=true';
    return apiClient.get<PeriodoResumen[]>(`/periodos${params}`);
  },

  generar: (jugador_id: number, anio: number) =>
    apiClient.post('/periodos', { accion: 'generar', jugador_id, anio }),

  upsert: (data: { jugador_id: number; anio: number; mes: number; objetivo?: number; estado?: string; notas?: string }) =>
    apiClient.post('/periodos', { accion: 'upsert', ...data }),

  update: (id: number, data: { estado?: string; notas?: string; pagado?: number }) =>
    apiClient.patch('/periodos', { id, ...data }),
};
