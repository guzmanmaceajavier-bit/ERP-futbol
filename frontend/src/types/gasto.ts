export interface Gasto {
  id: number;
  concepto: string;
  descripcion: string | null;
  monto: number;
  categoria: string;
  fecha: string;
  metodo_pago?: string;
  comprobante?: string | null;
  creado_por: number;
  creado_por_nombre?: string;
  anulado?: boolean;
  anulado_motivo?: string | null;
  anulado_por?: number | null;
  anulado_at?: string | null;
  created_at: string;
}

export interface GastoForm {
  concepto: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  metodo_pago?: string;
  comprobante?: string;
}

export interface GastoAnulacion {
  gasto_id: number;
  motivo: string;
}
