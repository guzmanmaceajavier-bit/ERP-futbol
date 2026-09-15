export type EstadoEntrenamiento = 'programado' | 'completado' | 'cancelado';

export interface Entrenamiento {
  id: number;
  fecha: string;
  hora: string;
  categoria: string;
  entrenador: string;
  lugar: string;
  tema: string;
  observaciones: string;
  estado: EstadoEntrenamiento;
  created_at: string;
}

export interface EntrenamientoForm {
  fecha: string;
  hora: string;
  categoria: string;
  entrenador: string;
  lugar: string;
  tema: string;
  observaciones: string;
  estado: EstadoEntrenamiento;
}
