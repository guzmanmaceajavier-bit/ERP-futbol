export interface Categoria {
  id: number;
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id: number | null;
  profesor_nombre: string | null;
  total_jugadores: number;
  activo: boolean;
  edad_min: number | null;
  edad_max: number | null;
  horario: string | null;
  dias_entrenamiento: string | null;
  cancha: string | null;
  cupo_maximo: number | null;
  created_at: string;
}

export interface CategoriaForm {
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id?: number | null;
  edad_min?: number | null;
  edad_max?: number | null;
  horario?: string;
  dias_entrenamiento?: string;
  cancha?: string;
  cupo_maximo?: number | null;
}

export type { Categoria as CategoriaItem };
