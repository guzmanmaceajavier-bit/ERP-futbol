import { useMemo } from 'react';
import { useApi } from './useApi';
import { categoriaService } from '../services/categoriaService';
import type { Categoria } from '../types';

export interface OpcionSelect {
  value: string;
  label: string;
}

/**
 * Fuente unica de verdad para los selects de categoria.
 * Los dropdowns deben leer de aqui (menu Categorias) y NO de la constante CATEGORIAS,
 * para que solo aparezcan las categorias realmente creadas.
 */
export function useCategorias() {
  const { data, loading, error, refetch } = useApi(() => categoriaService.getAll());

  const categorias: Categoria[] = useMemo(() => (data as Categoria[]) || [], [data]);

  const opciones: OpcionSelect[] = useMemo(
    () => categorias.map((c) => ({ value: c.nombre, label: c.nombre })),
    [categorias],
  );

  const nombres: string[] = useMemo(() => categorias.map((c) => c.nombre), [categorias]);

  const mapaMensualidad = useMemo(() => {
    const map: Record<string, number> = {};
    categorias.forEach((c) => {
      map[c.nombre] = c.mensualidad_base || 0;
    });
    return map;
  }, [categorias]);

  /** Mensualidad base de una categoria creada en el menu; 0 si no existe. */
  const mensualidadDe = (nombre: string): number => mapaMensualidad[nombre] ?? 0;

  /** true si la categoria existe en el menu Categorias. */
  const existe = (nombre: string): boolean => mapaMensualidad[nombre] !== undefined;

  return { categorias, opciones, nombres, mensualidadDe, existe, mapaMensualidad, loading, error, refetch };
}
