export type TipoNota = 'administrativa' | 'deportiva' | 'disciplinaria' | 'medica' | 'otra';
export type VisibilidadNota = 'publica' | 'privada';

export interface Nota {
  id: number;
  jugador_id: number;
  nota: string;
  tipo: TipoNota;
  visibilidad: VisibilidadNota;
  creado_por: number;
  creador_nombre?: string;
  created_at: string;
  updated_at?: string;
}

export interface NotaForm {
  jugador_id: number;
  nota: string;
  tipo?: TipoNota;
  visibilidad?: VisibilidadNota;
}
