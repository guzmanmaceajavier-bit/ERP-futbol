export type EstadoCaja = 'abierta' | 'cerrada';

export interface CajaDiaria {
  fecha: string;
  saldo_inicial: number;
  total_ingresos?: number;
  total_gastos?: number;
  saldo_final?: number;
  estado: EstadoCaja;
  abierta_por?: number;
  cerrada_por?: number;
}

export interface CajaResumen {
  fecha: string;
  caja: CajaDiaria | null;
  ingresos: { total: number; cnt: number };
  gastos: { total: number; cnt: number };
  saldo: number;
  estado: EstadoCaja;
}

export type CajaAccion = 'abrir' | 'cerrar' | 'desbloquear';

export interface CajaAccionPayload {
  accion: CajaAccion;
  fecha?: string;
  saldo_inicial?: number;
  motivo?: string;
}
