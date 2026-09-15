import { apiClient } from './apiClient';
import type { ReporteMensual, ReporteCategoria, ReporteEstadoCuenta } from '../types';

export const reporteService = {
  getPorMes: () =>
    apiClient.get<ReporteMensual[]>('/reportes?tipo=recaudado-por-mes'),

  getPorCategoria: () =>
    apiClient.get<ReporteCategoria[]>('/reportes?tipo=recaudado-por-categoria'),

  getEstadoCuenta: () =>
    apiClient.get<ReporteEstadoCuenta[]>('/reportes?tipo=estado-cuenta'),

  exportarCompleto: () =>
    apiClient.get('/reportes?tipo=exportar-completo'),
};
