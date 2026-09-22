export type TipoContrato = 'indefinido' | 'fijo' | 'prestacion' | 'hora';

export interface Profesor {
  id: number;
  nombre: string;
  telefono: string | null;
  especialidad: string | null;
  salario: number;
  fecha_ingreso: string | null;
  tipo_contrato: TipoContrato | null;
  categorias_asignadas: string[];
  activo: boolean;
}

export interface ProfesorForm {
  nombre: string;
  telefono: string;
  especialidad: string;
  salario: number;
  fecha_ingreso: string;
  tipo_contrato?: TipoContrato | '';
  categorias_asignadas?: string[];
}

export interface NominaPago {
  profesor_id: number;
  monto: number;
  fecha?: string;
  observacion?: string;
}
