import { apiClient } from './apiClient';
import type { Pago, PagoForm } from '../types';

export const pagoService = {
  getAll: (filtros?: { jugador_id?: number }) => {
    const params = new URLSearchParams();
    if (filtros?.jugador_id) params.set('jugador_id', String(filtros.jugador_id));
    const qs = params.toString();
    return apiClient.get<Pago[]>(`/pagos${qs ? '?' + qs : ''}`);
  },

  create: (form: PagoForm) =>
    apiClient.post<Pago>('/pagos', form),

  update: (id: number, form: Partial<PagoForm>) =>
    apiClient.put<Pago>('/pagos', { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/pagos?id=${id}`),

  anular: (payload: { pago_id: number; motivo: string }) =>
    apiClient.post<Pago>('/pagos', { accion: 'anular', ...payload }),
};
