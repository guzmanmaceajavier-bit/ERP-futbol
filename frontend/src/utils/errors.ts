/** Manejo centralizado de errores para no repetir try/catch identicos en cada pagina. */

export class AppError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

/** Devuelve un mensaje legible para cualquier error capturado. */
export function mensajeDeError(err: unknown, fallback = 'Ocurrio un error inesperado'): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;

  const api = err as { error?: unknown; message?: unknown } | null;
  if (api && typeof api.error === 'string' && api.error.trim()) return api.error;
  if (api && typeof api.message === 'string' && api.message.trim()) return api.message;

  return fallback;
}

/**
 * Ejecuta una accion y devuelve un resultado tipado en vez de lanzar.
 * Evita el patron repetido de try/catch/setError en los componentes.
 */
export async function intentar<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: mensajeDeError(err) };
  }
}
