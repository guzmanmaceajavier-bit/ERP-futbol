import { apiClient } from './apiClient';
import type { Convocatoria } from '../types';

export const convocatoriaService = {
  getAll: (filters?: { partido_id?: number; categoria?: string }) => {
    const params = new URLSearchParams();
    if (filters?.partido_id) params.set('partido_id', String(filters.partido_id));
    if (filters?.categoria) params.set('categoria', filters.categoria);
    const qs = params.toString();
    return apiClient.get<Convocatoria[]>(`/convocatorias${qs ? '?' + qs : ''}`);
  },

  create: (data: { partido_id: number; categoria: string; convocados: any[] }) =>
    apiClient.post<Convocatoria>('/convocatorias', data),

  update: (id: number, data: { convocados: any[] }) =>
    apiClient.put<Convocatoria>('/convocatorias', { ...data, id }),

  remove: (id: number) =>
    apiClient.delete(`/convocatorias?id=${id}`),
};
