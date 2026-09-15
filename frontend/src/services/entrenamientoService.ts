import { apiClient } from './apiClient';
import type { Entrenamiento, EntrenamientoForm } from '../types';

export const entrenamientoService = {
  getAll: (filters?: { categoria?: string; estado?: string; desde?: string; hasta?: string }) => {
    const params = new URLSearchParams();
    if (filters?.categoria) params.set('categoria', filters.categoria);
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.desde) params.set('desde', filters.desde);
    if (filters?.hasta) params.set('hasta', filters.hasta);
    const qs = params.toString();
    return apiClient.get<Entrenamiento[]>(`/entrenamientos${qs ? '?' + qs : ''}`);
  },

  create: (form: EntrenamientoForm) =>
    apiClient.post<Entrenamiento>('/entrenamientos', form),

  update: (id: number, form: Partial<EntrenamientoForm>) =>
    apiClient.put<Entrenamiento>('/entrenamientos', { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/entrenamientos?id=${id}`),
};
