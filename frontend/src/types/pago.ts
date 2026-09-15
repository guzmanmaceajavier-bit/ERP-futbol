export type EstadoPago = 'completo' | 'abono' | 'vencido';
export type TipoPago = 'completo' | 'abono' | 'adelantado';

export interface Pago {
  id: number;
  jugador_id: number;
  jugador?: string;
  jugador_telefono?: string;
  jugador_categoria?: string;
  monto: number;
  fecha: string;
  tipo: TipoPago;
  observacion: string | null;
  mes_pago: string | null;
  cantidad_meses: number;
  recibo_numero: string;
  vencimiento: string;
  estado_pago: EstadoPago;
  saldo_pendiente: number;
  created_at: string;
}

export interface PagoForm {
  jugador_id: number;
  monto: number;
  fecha: string;
  tipo: TipoPago;
  observacion: string;
  mes_pago: string;
  cantidad_meses: number;
  meses_cubiertos?: { anio: number; mes: number }[];
}
