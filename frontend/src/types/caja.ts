export type EstadoCaja = 'abierta' | 'cerrada';
export type TipoMovimientoCaja = 'ingreso' | 'gasto' | 'anulacion' | 'ajuste';

export interface MovimientoCaja {
  id: number;
  fecha: string;
  tipo: TipoMovimientoCaja;
  concepto: string;
  monto: number;
  referencia_id?: number | null;
  referencia_tipo?: string | null;
  usuario_id: number;
  usuario_nombre?: string;
  created_at: string;
}

export interface CajaDiaria {
  fecha: string;
  saldo_inicial: number;
  saldo_sistema?: number;
  saldo_contado?: number | null;
  diferencia?: number | null;
  total_ingresos?: number;
  total_gastos?: number;
  saldo_final?: number;
  estado: EstadoCaja;
  abierta_por?: number;
  cerrada_por?: number;
  hora_apertura?: string;
  hora_cierre?: string;
  movimientos?: MovimientoCaja[];
}

export interface CajaResumen {
  fecha: string;
  caja: CajaDiaria | null;
  ingresos: { total: number; cnt: number };
  gastos: { total: number; cnt: number };
  saldo: number;
  saldo_sistema?: number;
  estado: EstadoCaja;
}

export type CajaAccion = 'abrir' | 'cerrar' | 'desbloquear';

export interface CajaAccionPayload {
  accion: CajaAccion;
  fecha?: string;
  saldo_inicial?: number;
  saldo_contado?: number;
  motivo?: string;
}
