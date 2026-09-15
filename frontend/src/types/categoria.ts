export interface Categoria {
  id: number;
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id: number | null;
  profesor_nombre: string | null;
  total_jugadores: number;
  activo: boolean;
  created_at: string;
}

export interface CategoriaForm {
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id?: number | null;
}

export type { Categoria as CategoriaItem };
