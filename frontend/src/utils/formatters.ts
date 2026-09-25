export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatPhone(phone: string | null): string {
  if (!phone) return '-';
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Edad en anos completos a partir de una fecha ISO (YYYY-MM-DD). Devuelve null si no hay fecha valida. */
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento.includes('T') ? fechaNacimiento : `${fechaNacimiento}T00:00:00`);
  if (isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad < 0 ? null : edad;
}

/** Edad formateada para mostrar en la UI: "15 anos". */
export function formatEdad(fechaNacimiento: string | null | undefined): string {
  const edad = calcularEdad(fechaNacimiento);
  return edad == null ? '-' : `${edad} anos`;
}
