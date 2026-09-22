export interface PeriodoMensual {
  id: number;
  jugador_id: number;
  anio: number;
  mes: number;
  objetivo: number;
  pagado: number;
  saldo: number;
  estado: 'pendiente' | 'abono' | 'completo' | 'beca';
  vencimiento?: string | null;
  notas: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PagoPeriodo {
  id: number;
  pago_id: number;
  periodo_id: number;
  monto_aplicado: number;
  created_at?: string;
}

export interface PeriodoResumen {
  jugador_id: number;
  nombre: string;
  categoria: string;
  telefono?: string;
  periodos: PeriodoMensual[];
  total_pagado: number;
  total_objetivo: number;
  saldo: number;
}

export interface SaldoFavor {
  id: number;
  jugador_id: number;
  monto: number;
  origen_pago_id: number | null;
  usado: boolean;
  usado_en_pago_id: number | null;
  notas: string | null;
  created_at?: string;
}
