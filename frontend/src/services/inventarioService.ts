import { apiClient } from './apiClient';
import type { InventarioItem, InventarioForm } from '../types';

export const inventarioService = {
  getAll: () => apiClient.get<InventarioItem[]>('/inventario'),

  create: (form: InventarioForm) =>
    apiClient.post<InventarioItem>('/inventario', form),

  update: (id: number, form: Partial<InventarioForm>) =>
    apiClient.put<InventarioItem>(`/inventario?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/inventario?id=${id}`),
};
