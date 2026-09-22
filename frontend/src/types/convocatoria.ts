export type EstadoConvocado = 'convocado' | 'confirmado' | 'no_asistira' | 'pendiente';

export interface Convocado {
  jugador_id: number;
  jugador_nombre: string;
  categoria: string;
  seleccionado: boolean;
  estado?: EstadoConvocado;
  observacion?: string;
}

export interface Convocatoria {
  id: number;
  partido_id: number;
  rival?: string;
  fecha?: string;
  categoria: string;
  convocados: Convocado[];
  created_at: string;
}
