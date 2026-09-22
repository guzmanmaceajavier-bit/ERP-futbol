export type EstadoAsistencia = 'presente' | 'ausente' | 'tarde' | 'justificada';

export interface Asistencia {
  id: number;
  jugador_id: number;
  fecha: string;
  presente: boolean;
  estado: EstadoAsistencia;
  observacion: string | null;
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
  tardes: number;
  justificadas: number;
  porcentaje: number;
}
