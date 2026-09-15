import { apiClient } from './apiClient';
import type { Torneo, TorneoForm } from '../types';

export const torneoService = {
  getAll: () => apiClient.get<Torneo[]>('/torneos'),

  create: (form: TorneoForm) =>
    apiClient.post<Torneo>('/torneos', form),

  update: (id: number, form: Partial<TorneoForm>) =>
    apiClient.put<Torneo>(`/torneos?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/torneos?id=${id}`),
};
