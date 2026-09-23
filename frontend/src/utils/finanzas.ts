import { MENSUALIDAD_POR_CATEGORIA, type CategoriaNombre } from './constants';
import type { Pago } from '../types/pago';
import type { PeriodoMensual } from '../types/periodo';

export type EstadoFinanciero = 'al_dia' | 'proximo_vencer' | 'vence_hoy' | 'vencido' | 'abono' | 'adelantado';

export interface EstadoFinancieroInfo {
  estado: EstadoFinanciero;
  label: string;
  color: 'green' | 'yellow' | 'red' | 'amber' | 'blue';
  diasAtraso?: number;
  diasFaltantes?: number;
}

export function getMensualidad(categoria: string): number {
  return MENSUALIDAD_POR_CATEGORIA[categoria as CategoriaNombre] ?? 0;
}

export function calcularProximoPago(ultimoPagoFecha: string | null): string | null {
  if (!ultimoPagoFecha) return null;
  const d = new Date(ultimoPagoFecha.includes('T') ? ultimoPagoFecha : `${ultimoPagoFecha}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export function calcularEstadoFinanciero(
  ultimoPagoFecha: string | null,
  proximoVencimiento: string | null,
  saldoPendiente: number,
  periodoEstado?: string
): EstadoFinancieroInfo {
  if (saldoPendiente > 0 && periodoEstado === 'abono') {
    return { estado: 'abono', label: 'Pago parcial', color: 'amber' };
  }

  if (!proximoVencimiento) {
    if (saldoPendiente <= 0) return { estado: 'al_dia', label: 'Al dia', color: 'green' };
    return { estado: 'vencido', label: 'Vencido', color: 'red' };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(proximoVencimiento.includes('T') ? proximoVencimiento : `${proximoVencimiento}T00:00:00`);
  if (isNaN(venc.getTime())) {
    return { estado: saldoPendiente <= 0 ? 'al_dia' : 'vencido', label: saldoPendiente <= 0 ? 'Al dia' : 'Vencido', color: saldoPendiente <= 0 ? 'green' : 'red' };
  }
  venc.setHours(0, 0, 0, 0);

  const diffMs = venc.getTime() - hoy.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return { estado: 'vence_hoy', label: 'Vence hoy', color: 'red' };
  if (diffDias < 0) return { estado: 'vencido', label: `Vencido hace ${Math.abs(diffDias)} dias`, color: 'red', diasAtraso: Math.abs(diffDias) };
  if (diffDias <= 5) return { estado: 'proximo_vencer', label: `Proximo a vencer`, color: 'yellow', diasFaltantes: diffDias };
  return { estado: 'al_dia', label: 'Al dia', color: 'green', diasFaltantes: diffDias };
}

export function calcularProgresoPeriodo(periodo: PeriodoMensual | null | undefined): { pagado: number; saldo: number; porcentaje: number; estado: string } {
  if (!periodo) return { pagado: 0, saldo: 0, porcentaje: 0, estado: 'pendiente' };
  const pagado = periodo.pagado || 0;
  const objetivo = periodo.objetivo || 0;
  const saldo = Math.max(0, objetivo - pagado);
  const porcentaje = objetivo > 0 ? Math.min(100, Math.round((pagado / objetivo) * 100)) : 0;
  let estado = periodo.estado;
  if (pagado === 0) estado = 'pendiente';
  else if (pagado < objetivo) estado = 'abono';
  else estado = 'completo';
  return { pagado, saldo, porcentaje, estado };
}

export function expandirPagoMeses(monto: number, mensualidad: number): { mesesCompletos: number; resto: number; detalle: { mes: number; pagado: number; estado: string }[] } {
  if (mensualidad <= 0 || monto <= 0) return { mesesCompletos: 0, resto: monto, detalle: [] };
  const mesesCompletos = Math.floor(monto / mensualidad);
  const resto = monto % mensualidad;
  const detalle: { mes: number; pagado: number; estado: string }[] = [];
  for (let i = 0; i < mesesCompletos; i++) {
    detalle.push({ mes: i + 1, pagado: mensualidad, estado: 'completo' });
  }
  if (resto > 0) {
    detalle.push({ mes: mesesCompletos + 1, pagado: resto, estado: 'abono' });
  }
  return { mesesCompletos, resto, detalle };
}

export function formatearVencimiento(fecha: string | null, estado: EstadoFinancieroInfo): string {
  if (!fecha) return estado.label;
  const d = new Date(fecha.includes('T') ? fecha : `${fecha}T00:00:00`);
  const txt = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  if (estado.estado === 'vencido' && estado.diasAtraso) return `${txt} · Vencido hace ${estado.diasAtraso} dias`;
  if (estado.estado === 'proximo_vencer' && estado.diasFaltantes) return `${txt} · Faltan ${estado.diasFaltantes} dias`;
  if (estado.estado === 'vence_hoy') return `${txt} · Vence hoy`;
  return txt;
}
