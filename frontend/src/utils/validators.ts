export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidPhone(value: string): boolean {
  return /^\d{7,15}$/.test(value.replace(/\s/g, ''));
}

export function isValidMonto(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function isValidFecha(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function isFechaFutura(value: string): boolean {
  const d = new Date(value + 'T00:00:00');
  return d > new Date();
}

export type FieldErrors = Record<string, string>;

export function validateJugador(form: {
  nombre: string;
  apellidos: string;
  categoria: string;
  telefono: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!isRequired(form.nombre)) errors.nombre = 'El nombre es requerido';
  if (!isRequired(form.apellidos)) errors.apellidos = 'Los apellidos son requeridos';
  if (!isRequired(form.categoria)) errors.categoria = 'La categoria es requerida';
  if (!isRequired(form.telefono)) errors.telefono = 'El telefono es requerido';
  else if (!isValidPhone(form.telefono)) errors.telefono = 'Telefono invalido';
  return errors;
}

export function validatePago(form: {
  jugador_id: number | null;
  monto: number;
  fecha: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.jugador_id) errors.jugador_id = 'Selecciona un jugador';
  if (!isValidMonto(form.monto) || form.monto <= 0) errors.monto = 'Monto debe ser mayor a 0';
  if (!isRequired(form.fecha)) errors.fecha = 'La fecha es requerida';
  else if (!isValidFecha(form.fecha)) errors.fecha = 'Fecha invalida';
  return errors;
}

export function validateCategoria(form: {
  nombre: string;
  mensualidad_base: number;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!isRequired(form.nombre)) errors.nombre = 'El nombre es requerido';
  if (!isValidMonto(form.mensualidad_base)) errors.mensualidad_base = 'Mensualidad invalida';
  return errors;
}

export function validateGasto(form: {
  concepto: string;
  monto: number;
  categoria: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!isRequired(form.concepto)) errors.concepto = 'El concepto es requerido';
  if (!isValidMonto(form.monto) || form.monto <= 0) errors.monto = 'Monto debe ser mayor a 0';
  if (!isRequired(form.categoria)) errors.categoria = 'La categoria es requerida';
  return errors;
}
