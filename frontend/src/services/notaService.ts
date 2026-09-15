import { apiClient } from './apiClient';
import type { Nota, NotaForm } from '../types';

export const notaService = {
  getAll: (jugadorId: number) =>
    apiClient.get<Nota[]>(`/notas?jugador_id=${jugadorId}`),

  create: (form: NotaForm) =>
    apiClient.post<Nota>('/notas', form),

  remove: (id: number) =>
    apiClient.delete(`/notas?id=${id}`),
};
