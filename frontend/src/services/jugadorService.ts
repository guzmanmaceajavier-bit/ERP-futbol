import { apiClient } from './apiClient';
import type { Jugador, JugadorForm } from '../types';

export const jugadorService = {
  getAll: (filtros?: { genero?: string; categoria?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.genero) params.set('genero', filtros.genero);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);
    const qs = params.toString();
    return apiClient.get<Jugador[]>(`/jugadores${qs ? '?' + qs : ''}`);
  },

  create: (form: JugadorForm) =>
    apiClient.post<Jugador>('/jugadores', form),

  update: (id: number, form: Partial<JugadorForm>) =>
    apiClient.put<Jugador>(`/jugadores?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/jugadores?id=${id}`),
};
