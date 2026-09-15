import { apiClient } from './apiClient';
import type { Asistencia, AsistenciaPayload } from '../types';

export const asistenciaService = {
  getAll: (filtros?: { fecha?: string; jugador_id?: number }) => {
    const params = new URLSearchParams();
    if (filtros?.fecha) params.set('fecha', filtros.fecha);
    if (filtros?.jugador_id) params.set('jugador_id', String(filtros.jugador_id));
    const qs = params.toString();
    return apiClient.get<Asistencia[]>(`/asistencias${qs ? '?' + qs : ''}`);
  },

  save: (payload: AsistenciaPayload) =>
    apiClient.post('/asistencias', payload),
};
