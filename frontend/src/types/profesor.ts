export interface Profesor {
  id: number;
  nombre: string;
  telefono: string | null;
  especialidad: string | null;
  salario: number;
  fecha_ingreso: string | null;
  activo: boolean;
}

export interface ProfesorForm {
  nombre: string;
  telefono: string;
  especialidad: string;
  salario: number;
  fecha_ingreso: string;
}

export interface NominaPago {
  profesor_id: number;
  monto: number;
  fecha?: string;
  observacion?: string;
}
