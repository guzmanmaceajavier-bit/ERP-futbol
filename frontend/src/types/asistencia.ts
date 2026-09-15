export interface Asistencia {
  id: number;
  jugador_id: number;
  fecha: string;
  presente: boolean;
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
  observacion?: string;
}

export interface AsistenciaPayload {
  registros: AsistenciaRegistro[];
}
