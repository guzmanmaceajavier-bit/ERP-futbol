import { describe, it, expect } from 'vitest';
import { calcularEdad, formatEdad, formatCurrency, formatDate, todayISO } from '../formatters';

describe('calcularEdad', () => {
  it('devuelve null sin fecha', () => {
    expect(calcularEdad(null)).toBeNull();
    expect(calcularEdad('')).toBeNull();
    expect(calcularEdad(undefined)).toBeNull();
  });

  it('devuelve null con fecha invalida', () => {
    expect(calcularEdad('no-es-fecha')).toBeNull();
  });

  it('calcula la edad cumplida (no redondea hacia arriba)', () => {
    const hoy = new Date();
    const anio = hoy.getFullYear() - 10;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    expect(calcularEdad(`${anio}-${mes}-${dia}`)).toBe(10);
  });

  it('no suma el anio si el cumpleanos aun no llega este anio', () => {
    const hoy = new Date();
    // 31 de diciembre: solo ya cumplido si hoy es exactamente 31/12
    const cumpleEsteAnio = hoy.getMonth() === 11 && hoy.getDate() === 31;
    const esperado = cumpleEsteAnio ? hoy.getFullYear() - 2000 : hoy.getFullYear() - 2000 - 1;
    expect(calcularEdad('2000-12-31')).toBe(esperado);
  });
});

describe('formatEdad', () => {
  it('devuelve guion sin fecha', () => {
    expect(formatEdad(null)).toBe('-');
  });

  it('devuelve "N anos" con fecha valida', () => {
    expect(formatEdad('2010-05-20')).toMatch(/^\d+ anos$/);
  });
});

describe('formatCurrency', () => {
  it('formatea en pesos colombianos sin decimales', () => {
    const out = formatCurrency(50000);
    expect(out.replace(/\s/g, '')).toContain('50.000');
    expect(out).not.toContain(',');
  });

  it('formatea cero', () => {
    expect(formatCurrency(0)).toBeTruthy();
  });
});

describe('formatDate', () => {
  it('devuelve guion sin fecha', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('formatea fecha ISO', () => {
    expect(formatDate('2026-09-10')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('todayISO', () => {
  it('devuelve hoy en formato YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
