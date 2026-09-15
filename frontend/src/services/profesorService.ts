import { apiClient } from './apiClient';
import type { Profesor, ProfesorForm } from '../types';

export const profesorService = {
  getAll: () => apiClient.get<Profesor[]>('/profesores'),

  create: (form: ProfesorForm) =>
    apiClient.post<Profesor>('/profesores', form),

  update: (id: number, form: Partial<ProfesorForm>) =>
    apiClient.put<Profesor>(`/profesores?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/profesores?id=${id}`),

  pagarNomina: (profesorId: number, monto: number, observacion?: string) =>
    apiClient.patch('/profesores', { profesor_id: profesorId, monto, observacion }),
};
