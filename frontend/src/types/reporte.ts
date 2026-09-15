export type ReporteTipo =
  | 'recaudado-por-mes'
  | 'recaudado-por-categoria'
  | 'estado-cuenta'
  | 'exportar-completo';

export interface ReporteMensual {
  mes: string;
  total: number;
  cantidad: number;
}

export interface ReporteCategoria {
  categoria: string;
  total: number;
  cantidad?: number;
  al_dia?: number;
}

export interface ReporteEstadoCuenta {
  categoria: string;
  total: number;
  al_dia: number;
  promedio_pagado?: number;
}
