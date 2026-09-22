export const CATEGORIAS = [
  'Sub 17-18',
  'Sub 16-15',
  'Sub 14-13',
  'Sub 12-11',
  'Sub 10-9',
  'Sub 8-7',
] as const;

export type CategoriaNombre = typeof CATEGORIAS[number];

export const MENSUALIDAD_POR_CATEGORIA: Record<CategoriaNombre, number> = {
  'Sub 17-18': 50000,
  'Sub 16-15': 50000,
  'Sub 14-13': 40000,
  'Sub 12-11': 40000,
  'Sub 10-9': 30000,
  'Sub 8-7': 30000,
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const GENEROS = ['Masculino', 'Femenino'] as const;

export const TIPOS_BECA = ['Normal', 'Becado 50%', 'Becado 100%', 'Patrocinado'] as const;

export const ESTADOS_JUGADOR = ['activo', 'inactivo', 'retirado'] as const;

export const TIPOS_PAGO = ['abono', 'matricula', 'multa', 'otro'] as const;

export const ESTADOS_PAGO = ['completo', 'abono', 'vencido'] as const;

export const CATEGORIAS_GASTO = [
  'Nomina', 'Arriendo', 'Servicios', 'Equipamiento',
  'Transporte', 'Alimentacion', 'Mantenimiento', 'General',
] as const;

export const METODOS_PAGO = ['Efectivo', 'Nequi', 'Bancolombia', 'Transferencia', 'Otro'] as const;

export const ESTADOS_ENTRENAMIENTO = ['programado', 'completado', 'cancelado'] as const;

export const ESTADOS_PARTIDO = ['programado', 'jugado', 'cancelado', 'aplazado'] as const;

export const LOCALIAS_PARTIDO = ['local', 'visitante', 'neutral'] as const;

export const ESTADOS_CONVOCADO = ['convocado', 'confirmado', 'no_asistira', 'pendiente'] as const;

export const ESTADOS_TORNEO = ['proximo', 'en_curso', 'finalizado'] as const;

export const RESULTADOS_PARTIDO = ['victoria', 'derrota', 'empate'] as const;

export const TIPOS_CONTRATO = ['indefinido', 'fijo', 'prestacion', 'hora'] as const;

export const ESTADOS_ASISTENCIA = ['presente', 'ausente', 'tarde', 'justificada'] as const;

export const TIPOS_NOTA = ['administrativa', 'deportiva', 'disciplinaria', 'medica', 'otra'] as const;

export const ESTADOS_COBRANZA = ['deuda', 'contactado', 'prometio_pagar', 'pagado', 'descartada'] as const;

export const TIPOS_MOVIMIENTO_CAJA = ['ingreso', 'gasto', 'anulacion', 'ajuste'] as const;

export const TIPOS_MOVIMIENTO_INV = ['entrada', 'salida', 'ajuste'] as const;

export const ROLES: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  tesorero: 'Tesorero',
  entrenador: 'Entrenador',
  profe: 'Profesor',
  auxiliar: 'Auxiliar',
  asistente: 'Asistente',
};

export function getMensualidadObjetivo(categoria: string): number {
  return MENSUALIDAD_POR_CATEGORIA[categoria as CategoriaNombre] ?? 0;
}
