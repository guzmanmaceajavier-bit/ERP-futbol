import { apiClient } from './apiClient';
import type { Alerta } from '../types';

export const alertaService = {
  getAll: () => apiClient.get<Alerta[]>('/alertas'),

  accion: (payload: { accion: string; alerta_id?: string | number; titulo?: string; mensaje?: string; jugador_id?: number; fecha_vencimiento?: string; alertas_ids?: (string | number)[] }) =>
    apiClient.post('/alertas', payload),

  update: (id: string | number, form: { titulo?: string; mensaje?: string; fecha_vencimiento?: string }) =>
    apiClient.put('/alertas', { ...form, id }),

  remove: (id: string | number) =>
    apiClient.delete(`/alertas?id=${id}`),
};
