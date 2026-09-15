export interface Torneo {
  id: number;
  nombre: string;
  tipo_genero?: string;
  categoria_requerida?: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  costo: number;
  observacion: string | null;
  convocados?: number;
  created_at: string;
}

export interface TorneoForm {
  nombre: string;
  tipo_genero: string;
  categoria_requerida: string;
  fecha_inicio: string;
  fecha_fin: string;
  lugar: string;
  costo: number;
  observacion: string;
}
