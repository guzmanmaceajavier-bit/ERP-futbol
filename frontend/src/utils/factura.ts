import type { Pago } from '../types';
import type { Jugador } from '../types';
import { formatCurrency, formatDate } from './formatters';

export interface FacturaData {
  pago: Pago;
  jugador: Jugador | null;
  periodoLabel?: string;
  saldoPeriodo?: number;
  mensualidad?: number;
  escuela?: { nombre: string; nit?: string; telefono?: string; direccion?: string };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildFacturaHtml(data: FacturaData): string {
  const { pago, jugador, periodoLabel, saldoPeriodo, mensualidad, escuela } = data;
  const nombre = jugador ? `${jugador.nombre} ${jugador.apellidos}`.trim() : pago.jugador || `Jugador #${pago.jugador_id}`;
  const categoria = jugador?.categoria || pago.jugador_categoria || '-';
  const documento = jugador?.numero_identificacion || '-';
  const mensualidadVal = mensualidad ?? jugador?.mensualidad ?? 0;
  const periodoTxt = periodoLabel || pago.mes_pago || '-';
  const vencimiento = (pago as any).vencimiento || '-';
  const metodo = (pago as any).metodo_pago || '-';
  const concepto = (pago as any).concepto || pago.tipo || 'Mensualidad';
  const recibo = pago.recibo_numero || `REC-${String(pago.id).padStart(4, '0')}`;
  const fecha = formatDate(pago.fecha);
  const monto = formatCurrency(pago.monto);
  const saldo = saldoPeriodo != null ? formatCurrency(saldoPeriodo) : '-';
  const mensualidadFmt = mensualidadVal ? formatCurrency(mensualidadVal) : '-';
  const escuelaNombre = esc(escuela?.nombre || 'EFUSA');
  const escuelaNit = esc(escuela?.nit || '');
  const escuelaTel = esc(escuela?.telefono || '');
  const escuelaDir = esc(escuela?.direccion || '');
  const generado = new Date().toLocaleString('es-CO');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${esc(recibo)}</title>
<style>
  *{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;margin:0;padding:24px;color:#0f172a;background:#f8fafc}
  .sheet{max-width:800px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden}
  .head{padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;gap:16px}
  .brand{font-weight:800;font-size:18px}
  .muted{color:#64748b;font-size:12px}
  .badge{font-size:11px;font-weight:700;border:1px solid #e2e8f0;border-radius:999px;padding:4px 8px;background:#f8fafc}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px 24px}
  .label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b}
  .value{font-size:13px;font-weight:600;margin-top:4px}
  .table{width:100%;border-collapse:collapse}
  .table th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
  .table td{padding:12px;font-size:13px;border-bottom:1px solid #f1f5f9}
  .mono{font-family:ui-monospace,monospace}
  .foot{padding:16px 24px;display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #e2e8f0}
  .total{font-size:16px;font-weight:800}
  .print{background:#0f172a;color:white;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
  @media print{.no-print{display:none}body{background:white;padding:0}.sheet{border:0;border-radius:0}}
</style></head><body>
<div class="sheet">
  <div class="head">
    <div>
      <div class="brand">${escuelaNombre}</div>
      <div class="muted">${escuelaNit ? `NIT ${escuelaNit} · ` : ''}${escuelaTel ? esc(escuelaTel) + ' · ' : ''}${escuelaDir}</div>
      <div class="muted" style="margin-top:6px">Factura / Recibo de cobro · <span class="badge">${esc(recibo)}</span></div>
    </div>
    <div style="text-align:right">
      <div class="label">Fecha</div><div class="value">${esc(fecha)}</div>
      <div class="label" style="margin-top:8px">Generado</div><div class="muted">${esc(generado)}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="label">Jugador</div><div class="value">${esc(nombre)}</div>
      <div class="muted">${esc(categoria)} · Doc: ${esc(documento)}</div>
    </div>
    <div>
      <div class="label">Mensualidad</div><div class="value mono">${esc(mensualidadFmt)}</div>
      <div class="muted">Periodo: ${esc(periodoTxt)} · Vence: ${esc(vencimiento)}</div>
    </div>
  </div>

  <div style="padding:0 24px 16px">
    <table class="table">
      <thead><tr><th>Concepto</th><th>Metodo</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody><tr><td>${esc(concepto)}</td><td>${esc(metodo)}</td><td style="text-align:right" class="mono">${esc(monto)}</td></tr></tbody>
    </table>
    ${pago.observacion ? `<div class="muted" style="margin-top:8px">Obs: ${esc(pago.observacion)}</div>` : ''}
  </div>

  <div class="grid" style="padding-top:0">
    <div>
      <div class="label">Saldo periodo</div><div class="value mono">${esc(saldo)}</div>
    </div>
    <div style="text-align:right">
      <div class="label">Total pagado</div><div class="total">${esc(monto)}</div>
    </div>
  </div>

  <div class="foot">
    <div class="muted">Gracias por su pago. Conserve este recibo.</div>
    <button class="print no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
</div>
<script>window.onload=()=>{/* no auto-print, usuario decide */}<\/script>
</body></html>`;
}

export function abrirFactura(data: FacturaData): void {
  const html = buildFacturaHtml(data);
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
