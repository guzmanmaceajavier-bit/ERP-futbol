import { apiClient } from './apiClient';
import type { Gasto, GastoForm } from '../types';

export const gastoService = {
  getAll: (filtros?: { fecha?: string; categoria?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.fecha) params.set('fecha', filtros.fecha);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);
    const qs = params.toString();
    return apiClient.get<Gasto[]>(`/gastos${qs ? '?' + qs : ''}`);
  },

  create: (form: GastoForm) =>
    apiClient.post<Gasto>('/gastos', form),

  update: (id: number, form: Partial<GastoForm>) =>
    apiClient.put<Gasto>(`/gastos?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/gastos?id=${id}`),
};
