export type EstadoAsistencia = 'presente' | 'ausente' | 'ausente_con_excusa' | 'no_registrado' | 'tarde' | 'justificada';
export type TipoActividad = 'entrenamiento' | 'partido' | 'torneo' | 'general';

export interface Asistencia {
  id: number;
  jugador_id: number;
  fecha: string;
  presente: boolean;
  estado: EstadoAsistencia;
  observacion: string | null;
  // Excusa
  motivo?: string | null;
  medio?: string | null;
  fecha_excusa?: string | null;
  observacion_entrenador?: string | null;
  // Vinculo actividad
  entrenamiento_id?: number | null;
  tipo_actividad?: TipoActividad;
  actividad_id?: number | null;
  nombre?: string;
  apellidos?: string;
  categoria?: string;
  created_at: string;
}

export interface AsistenciaRegistro {
  jugador_id: number;
  fecha: string;
  presente: boolean;
  estado?: EstadoAsistencia;
  observacion?: string;
  motivo?: string | null;
  medio?: string | null;
  fecha_excusa?: string | null;
  observacion_entrenador?: string | null;
  entrenamiento_id?: number | null;
  tipo_actividad?: TipoActividad;
  actividad_id?: number | null;
}

export interface AsistenciaPayload {
  registros: AsistenciaRegistro[];
}

export interface AsistenciaResumen {
  jugador_id: number;
  jugador_nombre: string;
  categoria: string;
  total: number;
  presentes: number;
  ausencias: number;
  ausentes_con_excusa: number;
  no_registrados: number;
  tardes: number;
  justificadas: number;
  porcentaje: number;
}
