import { apiClient } from './apiClient';
import type { BitacoraEntry } from '../types';

export const bitacoraService = {
  getAll: (filtros?: { desde?: string; hasta?: string; modulo?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.desde) params.set('desde', filtros.desde);
    if (filtros?.hasta) params.set('hasta', filtros.hasta);
    if (filtros?.modulo) params.set('modulo', filtros.modulo);
    const qs = params.toString();
    return apiClient.get<BitacoraEntry[]>(`/bitacora${qs ? '?' + qs : ''}`);
  },
};
