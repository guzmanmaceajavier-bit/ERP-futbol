import { apiClient } from './apiClient';
import type { Partido, PartidoForm } from '../types';

export const partidoService = {
  getAll: (filters?: { categoria?: string; estado?: string; desde?: string; hasta?: string }) => {
    const params = new URLSearchParams();
    if (filters?.categoria) params.set('categoria', filters.categoria);
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.desde) params.set('desde', filters.desde);
    if (filters?.hasta) params.set('hasta', filters.hasta);
    const qs = params.toString();
    return apiClient.get<Partido[]>(`/partidos${qs ? '?' + qs : ''}`);
  },

  create: (form: PartidoForm) =>
    apiClient.post<Partido>('/partidos', form),

  update: (id: number, form: Partial<PartidoForm>) =>
    apiClient.put<Partido>('/partidos', { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/partidos?id=${id}`),
};
