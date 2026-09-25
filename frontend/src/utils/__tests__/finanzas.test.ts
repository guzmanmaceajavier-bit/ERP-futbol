import { describe, it, expect } from 'vitest';
import {
  calcularEstadoFinanciero,
  expandirPagoMeses,
  getProximoVencimientoDelPeriodo,
  calcularProgresoPeriodo,
} from '../finanzas';

describe('calcularEstadoFinanciero', () => {
  it('marca adelantado si el periodo lo indica', () => {
    const r = calcularEstadoFinanciero(null, null, 0, 'adelantado');
    expect(r.estado).toBe('adelantado');
    expect(r.label).toBe('Adelantado');
  });

  it('marca abono cuando hay saldo pendiente', () => {
    const r = calcularEstadoFinanciero(null, '2026-10-10', 20000, 'abono');
    expect(r.estado).toBe('abono');
    expect(r.color).toBe('amber');
  });

  it('marca vencido cuando la fecha ya paso', () => {
    const r = calcularEstadoFinanciero(null, '2020-01-01', 50000);
    expect(r.estado).toBe('vencido');
    expect(r.color).toBe('red');
    expect(r.diasAtraso).toBeGreaterThan(0);
  });

  it('marca vence_hoy cuando vence el dia de hoy', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const r = calcularEstadoFinanciero(null, hoy, 30000);
    expect(r.estado).toBe('vence_hoy');
  });

  it('marca al_dia cuando no hay saldo ni vencimiento', () => {
    const r = calcularEstadoFinanciero(null, null, 0);
    expect(r.estado).toBe('al_dia');
    expect(r.color).toBe('green');
  });

  it('marca vencido si hay saldo pero no hay vencimiento conocido', () => {
    const r = calcularEstadoFinanciero(null, null, 40000);
    expect(r.estado).toBe('vencido');
  });
});

describe('expandirPagoMeses', () => {
  it('un pago completo genera un periodo completo', () => {
    const r = expandirPagoMeses(50000, 50000);
    expect(r.mesesCompletos).toBe(1);
    expect(r.resto).toBe(0);
    expect(r.detalle).toHaveLength(1);
    expect(r.detalle[0].estado).toBe('completo');
  });

  it('adelantado de 150.000 con mensualidad 50.000 genera 3 periodos completos', () => {
    const r = expandirPagoMeses(150000, 50000);
    expect(r.mesesCompletos).toBe(3);
    expect(r.resto).toBe(0);
    expect(r.detalle).toHaveLength(3);
    expect(r.detalle.every((d) => d.estado === 'completo')).toBe(true);
  });

  it('pago mixto de 125.000 con mensualidad 50.000 genera 2 completos y 1 abono de 25.000', () => {
    const r = expandirPagoMeses(125000, 50000);
    expect(r.mesesCompletos).toBe(2);
    expect(r.resto).toBe(25000);
    expect(r.detalle).toHaveLength(3);
    expect(r.detalle[2].estado).toBe('abono');
    expect(r.detalle[2].pagado).toBe(25000);
  });

  it('abono parcial genera un unico periodo abono', () => {
    const r = expandirPagoMeses(20000, 50000);
    expect(r.mesesCompletos).toBe(0);
    expect(r.resto).toBe(20000);
    expect(r.detalle).toHaveLength(1);
    expect(r.detalle[0].estado).toBe('abono');
  });

  it('no divide si la mensualidad es 0', () => {
    const r = expandirPagoMeses(50000, 0);
    expect(r.mesesCompletos).toBe(0);
    expect(r.detalle).toHaveLength(0);
    expect(r.resto).toBe(50000);
  });
});

describe('getProximoVencimientoDelPeriodo', () => {
  it('devuelve null si no hay periodos', () => {
    expect(getProximoVencimientoDelPeriodo([])).toBeNull();
  });

  it('elige el periodo pendiente mas antiguo', () => {
    const venc = getProximoVencimientoDelPeriodo([
      { id: 2, anio: 2026, mes: 11, estado: 'pendiente', vencimiento: '2026-11-10' } as any,
      { id: 1, anio: 2026, mes: 10, estado: 'pendiente', vencimiento: '2026-10-10' } as any,
    ]);
    expect(venc).toBe('2026-10-10');
  });

  it('ignora los periodos pagados', () => {
    const venc = getProximoVencimientoDelPeriodo([
      { id: 1, anio: 2026, mes: 10, estado: 'completo', vencimiento: '2026-10-10' } as any,
    ]);
    expect(venc).toBeNull();
  });

  it('arma el vencimiento con el dia 5 si el periodo no trae fecha', () => {
    const venc = getProximoVencimientoDelPeriodo([
      { id: 1, anio: 2026, mes: 3, estado: 'pendiente', vencimiento: null } as any,
    ]);
    expect(venc).toBe('2026-03-05');
  });
});

describe('calcularProgresoPeriodo', () => {
  it('periodo sin abonar queda en 0%', () => {
    const r = calcularProgresoPeriodo({ pagado: 0, objetivo: 50000, estado: 'pendiente' } as any);
    expect(r.porcentaje).toBe(0);
    expect(r.estado).toBe('pendiente');
  });

  it('periodo con la mitad pagada queda en 50%', () => {
    const r = calcularProgresoPeriodo({ pagado: 25000, objetivo: 50000, estado: 'abono' } as any);
    expect(r.porcentaje).toBe(50);
    expect(r.estado).toBe('abono');
  });

  it('nunca supera el 100%', () => {
    const r = calcularProgresoPeriodo({ pagado: 60000, objetivo: 50000, estado: 'completo' } as any);
    expect(r.porcentaje).toBe(100);
  });
});
