import { apiClient } from './apiClient';
import type { Categoria, CategoriaForm } from '../types';

export const categoriaService = {
  getAll: () => apiClient.get<Categoria[]>('/categorias'),

  create: (form: CategoriaForm) =>
    apiClient.post<Categoria>('/categorias', form),

  update: (id: number, form: Partial<CategoriaForm>) =>
    apiClient.put<Categoria>(`/categorias?id=${id}`, { ...form, id }),

  remove: (id: number) =>
    apiClient.delete(`/categorias?id=${id}`),
};
