export interface Gasto {
  id: number;
  concepto: string;
  descripcion: string | null;
  monto: number;
  categoria: string;
  fecha: string;
  creado_por: number;
  creado_por_nombre?: string;
  created_at: string;
}

export interface GastoForm {
  concepto: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
}
