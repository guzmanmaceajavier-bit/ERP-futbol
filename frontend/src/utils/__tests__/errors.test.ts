import { describe, it, expect } from 'vitest';
import { AppError, mensajeDeError, intentar } from '../errors';

describe('mensajeDeError', () => {
  it('usa el mensaje de AppError', () => {
    expect(mensajeDeError(new AppError('Pago invalido'))).toBe('Pago invalido');
  });

  it('usa el mensaje de Error', () => {
    expect(mensajeDeError(new Error('fallo la red'))).toBe('fallo la red');
  });

  it('usa el fallback si no hay mensaje', () => {
    expect(mensajeDeError(null)).toBe('Ocurrio un error inesperado');
    expect(mensajeDeError(new Error(''))).toBe('Ocurrio un error inesperado');
  });

  it('lee el campo error tipico del mock', () => {
    expect(mensajeDeError({ error: 'Jugador no encontrado' })).toBe('Jugador no encontrado');
  });

  it('acepta strings', () => {
    expect(mensajeDeError('algo fallo')).toBe('algo fallo');
  });
});

describe('intentar', () => {
  it('devuelve ok con la data cuando no falla', async () => {
    const r = await intentar(async () => 42);
    expect(r).toEqual({ ok: true, data: 42 });
  });

  it('devuelve ok false con mensaje legible cuando falla', async () => {
    const r = await intentar(async () => {
      throw new Error('sin conexion');
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('sin conexion');
  });

  it('usa el fallback cuando el error no tiene mensaje', async () => {
    const r = await intentar(async () => {
      throw 123;
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Ocurrio un error inesperado');
  });
});
