import { apiClient } from './apiClient';
import type { CajaResumen, CajaAccionPayload } from '../types';

export const cajaService = {
  getResumen: (fecha?: string) => {
    const params = fecha ? `?fecha=${fecha}` : '';
    return apiClient.get<CajaResumen>(`/caja${params}`);
  },

  getResumenHoy: () =>
    apiClient.get<{ fecha: string; caja: any; ingresos: { total: number; cnt: number }; gastos: { total: number; cnt: number }; saldo: number; estado: string }>('/caja?resumen=hoy'),

  accion: (payload: CajaAccionPayload) =>
    apiClient.post('/caja', payload),
};
