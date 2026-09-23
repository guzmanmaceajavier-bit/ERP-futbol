import { useState } from 'react';
import type { Jugador } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface JugadorFichaProps {
  jugador: Jugador;
  onClose: () => void;
  onEdit: () => void;
}

type TabId = 'resumen' | 'personal' | 'deportiva' | 'medica' | 'financiera' | 'asistencia' | 'historial';

const TABS: { id: TabId; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'personal', label: 'Personal' },
  { id: 'deportiva', label: 'Deportiva' },
  { id: 'medica', label: 'Médica' },
  { id: 'financiera', label: 'Financiera' },
  { id: 'asistencia', label: 'Asistencia' },
  { id: 'historial', label: 'Historial' },
];

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '-';
  const nac = new Date(fechaNacimiento.includes('T') ? fechaNacimiento : `${fechaNacimiento}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return '-';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function estadoVariant(estado: string) {
  if (estado === 'activo') return 'success' as const;
  if (estado === 'inactivo') return 'warning' as const;
  return 'danger' as const;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white font-medium mt-1 break-words">{value ?? '-'}</p>
    </div>
  );
}

function PlaceholderField({ label }: { label: string }) {
  return <Field label={label} value={<span className="text-slate-400">No registrado</span>} />;
}

export function JugadorFicha({ jugador, onClose, onEdit }: JugadorFichaProps) {
  const [activeTab, setActiveTab] = useState<TabId>('resumen');

  const nombreCompleto = `${jugador.nombre} ${jugador.apellidos}`.trim();
  const edad = calcularEdad(jugador.fecha_nacimiento);
  const estadoRaw = jugador.estado || (jugador.activo ? 'activo' : 'inactivo');
  const estadoLabel = estadoRaw.charAt(0).toUpperCase() + estadoRaw.slice(1);
  const documento =
    jugador.numero_identificacion
      ? `${jugador.tipo_identificacion ?? ''} ${jugador.numero_identificacion}`.trim()
      : '-';

  // Direccion no existe en tipo actual -> placeholder
  const direccion = (jugador as unknown as { direccion?: string | null }).direccion ?? null;

  const deuda = jugador.saldo_pendiente ?? jugador.deuda_actual ?? 0;
  const totalPagado = jugador.total_pagado ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in">
        {/* Header - PageHeader-like */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-700 flex-shrink-0">
          <div>
            <h1 className="font-sport text-2xl font-bold text-white">Ficha del jugador</h1>
            <p className="text-slate-400 text-sm mt-1">
              {nombreCompleto} · {jugador.categoria} · <span className="capitalize">{estadoRaw}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={onEdit}>Editar</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-700 bg-slate-800/30 overflow-x-auto flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                activeTab === tab.id
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
                <Avatar nombre={nombreCompleto} size="lg" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">{nombreCompleto}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="default">{jugador.categoria}</Badge>
                    <Badge variant={estadoVariant(estadoRaw)}>{estadoLabel}</Badge>
                    <Badge variant={jugador.tipo_beca !== 'Normal' ? 'warning' : 'default'}>{jugador.tipo_beca}</Badge>
                    <span className="text-xs text-slate-400 capitalize">{jugador.genero}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Edad</p>
                      <p className="text-sm font-medium text-white mt-1">{edad}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Teléfono</p>
                      <p className="text-sm font-medium text-white mt-1">{jugador.telefono || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Fecha nacimiento</p>
                      <p className="text-sm font-medium text-white mt-1">{formatDate(jugador.fecha_nacimiento)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Acudiente" value={jugador.acudiente_nombre || '-'} />
                <Field label="Tel. acudiente" value={jugador.acudiente_telefono || '-'} />
                <Field label="Mensualidad" value={formatCurrency(jugador.mensualidad)} />
                <Field label="Saldo pendiente" value={<span className={deuda > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{formatCurrency(deuda)}</span>} />
                <Field label="Último pago" value={jugador.ultimo_pago ? formatDate(jugador.ultimo_pago) : '-'} />
                <Field label="Fecha ingreso" value={formatDate(jugador.fecha_ingreso)} />
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre completo" value={nombreCompleto} />
              <Field label="Género" value={jugador.genero || '-'} />
              <Field label="Fecha de nacimiento" value={formatDate(jugador.fecha_nacimiento)} />
              <Field label="Edad" value={edad} />
              <Field label="Documento" value={documento} />
              <Field label="Teléfono" value={jugador.telefono || '-'} />
              <Field label="Dirección" value={direccion || '-'} />
              <Field label="Acudiente" value={jugador.acudiente_nombre || '-'} />
              <Field label="Tel. acudiente" value={jugador.acudiente_telefono || '-'} />
              <Field label="WhatsApp opt-out" value={jugador.whatsapp_opt_out ? 'Sí' : 'No'} />
              <Field label="Estado" value={estadoLabel} />
              <Field label="Fecha ingreso" value={formatDate(jugador.fecha_ingreso)} />
            </div>
          )}

          {activeTab === 'deportiva' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Categoría" value={jugador.categoria || '-'} />
                <Field label="Fecha de ingreso" value={formatDate(jugador.fecha_ingreso)} />
                <PlaceholderField label="Posición" />
                <PlaceholderField label="Número de camiseta" />
                <Field label="Género" value={jugador.genero || '-'} />
                <Field label="Tipo de beca" value={jugador.tipo_beca || '-'} />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nota</p>
                <p className="text-sm text-slate-400 mt-1">
                  Posición y número de camiseta aún no están registrados en el tipo <span className="font-mono text-slate-300">Jugador</span>. Mostrará &quot;No registrado&quot; hasta ampliar el modelo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'medica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PlaceholderField label="Tipo de sangre" />
                <PlaceholderField label="EPS" />
                <PlaceholderField label="Alergias" />
                <PlaceholderField label="Condiciones médicas" />
                <PlaceholderField label="Contacto de emergencia" />
                <PlaceholderField label="Tel. contacto emergencia" />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Información médica</p>
                <p className="text-sm text-slate-400 mt-1">
                  Los campos médicos no están presentes en el tipo <span className="font-mono text-slate-300">Jugador</span> actual. Todos los valores se muestran como &quot;No registrado&quot; hasta que se amplíe el modelo (p. ej. tipo_sangre, eps, alergias, contacto_emergencia).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'financiera' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Mensualidad" value={formatCurrency(jugador.mensualidad)} />
                <Field label="Mensualidad objetivo" value={formatCurrency(jugador.mensualidad_objetivo)} />
                <Field label="Objetivo real" value={jugador.objetivo_real != null ? formatCurrency(jugador.objetivo_real) : '-'} />
                <Field label="Descuento beca" value={jugador.descuento_beca ? `${jugador.descuento_beca}%` : '0%'} />
                <Field label="Estado de cuenta" value={
                  deuda > 0 ? <span className="text-red-400 font-bold">Con deuda</span> : <span className="text-green-400 font-bold">Al día</span>
                } />
                <Field label="Deuda" value={<span className={deuda > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>{formatCurrency(deuda)}</span>} />
                <Field label="Último pago" value={jugador.ultimo_pago ? formatDate(jugador.ultimo_pago) : '-'} />
                <Field label="Próximo vencimiento" value={jugador.proximo_vencimiento ? formatDate(jugador.proximo_vencimiento) : '-'} />
                <Field label="Saldo pendiente" value={formatCurrency(jugador.saldo_pendiente ?? 0)} />
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Resumen de periodos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Total pagado</p>
                    <p className="text-sm font-mono font-bold text-green-400 mt-1">{formatCurrency(totalPagado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Deuda actual</p>
                    <p className="text-sm font-mono font-bold text-red-400 mt-1">{formatCurrency(jugador.deuda_actual ?? deuda)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Tipo beca</p>
                    <p className="text-sm text-white mt-1">{jugador.tipo_beca}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Para el detalle por periodo (año/mes, estado pendiente/abono/completo/beca) integrar con <span className="font-mono text-slate-400">periodoService</span> / <span className="font-mono text-slate-400">PeriodoMensual[]</span>.
                </p>
              </div>

              {deuda > 0 && (
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex gap-3">
                  <span className="text-red-400 text-sm">⚠</span>
                  <p className="text-sm text-red-300">Este jugador presenta deuda pendiente de {formatCurrency(deuda)}. Revisar historial de pagos.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'asistencia' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="% Asistencia" value={<span className="text-slate-400">— (requiere asistenciaService)</span>} />
                <Field label="Presencias" value={<span className="text-slate-400">—</span>} />
                <Field label="Ausencias" value={<span className="text-slate-400">—</span>} />
                <Field label="Tardes / Justificadas" value={<span className="text-slate-400">—</span>} />
                <Field label="Última asistencia" value={jugador.ultima_asistencia ? formatDate(jugador.ultima_asistencia) : '-'} />
                <Field label="Estado" value={estadoLabel} />
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Asistencia</h3>
                <p className="text-sm text-slate-400 mt-1">
                  El porcentaje y conteos de presencias/ausencias requieren integración con <span className="font-mono text-slate-300">asistenciaService</span> y el resumen por jugador (<span className="font-mono text-slate-300">AsistenciaResumen</span>). Mostrar placeholder hasta conectar la API.
                </p>
                <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-600 w-0" />
                </div>
                <p className="text-xs text-slate-500 mt-2">Barra de asistencia pendiente de datos reales.</p>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Pagos recientes</h3>
                {jugador.ultimo_pago ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm text-white font-medium">Último pago</p>
                        <p className="text-xs text-slate-400">{formatDate(jugador.ultimo_pago)}</p>
                      </div>
                      <span className="text-sm font-mono text-green-400">{totalPagado > 0 ? formatCurrency(totalPagado) : '-'}</span>
                    </div>
                    <p className="text-xs text-slate-500">Para listar todos los pagos integrar con <span className="font-mono text-slate-400">pagoService.getByJugador(jugador.id)</span>.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-2">Sin pagos registrados.</p>
                )}
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Notas</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Las notas del jugador se gestionan con <span className="font-mono text-slate-300">notaService</span> (<span className="font-mono text-slate-300">Nota[]</span> filtradas por <span className="font-mono text-slate-300">jugador_id</span>). Sin integración aún, no hay notas para mostrar.
                </p>
                <div className="mt-3 border border-dashed border-slate-600 rounded-lg p-4 text-center">
                  <p className="text-xs text-slate-500">No hay notas registradas para {nombreCompleto}.</p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Alertas</h3>
                {deuda > 0 ? (
                  <div className="mt-3 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3">
                    <p className="text-sm text-yellow-300 font-medium">Alerta de deuda</p>
                    <p className="text-xs text-yellow-200/70 mt-1">Deuda actual: {formatCurrency(deuda)} — filtrar alertas por jugador_id = {jugador.id}.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-2">Sin alertas activas.</p>
                )}
                <p className="text-xs text-slate-500 mt-3">
                  Integrar con <span className="font-mono text-slate-400">alertaService</span> para listar alertas reales de este jugador.
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white">Línea de tiempo</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-slate-500 w-28 flex-shrink-0">{formatDate(jugador.created_at)}</span>
                    <span className="text-slate-300">Registro creado</span>
                  </div>
                  {jugador.fecha_ingreso && (
                    <div className="flex gap-3">
                      <span className="text-slate-500 w-28 flex-shrink-0">{formatDate(jugador.fecha_ingreso)}</span>
                      <span className="text-slate-300">Fecha de ingreso — {jugador.categoria}</span>
                    </div>
                  )}
                  {jugador.ultimo_pago && (
                    <div className="flex gap-3">
                      <span className="text-slate-500 w-28 flex-shrink-0">{formatDate(jugador.ultimo_pago)}</span>
                      <span className="text-slate-300">Último pago registrado</span>
                    </div>
                  )}
                  {jugador.ultima_asistencia && (
                    <div className="flex gap-3">
                      <span className="text-slate-500 w-28 flex-shrink-0">{formatDate(jugador.ultima_asistencia)}</span>
                      <span className="text-slate-300">Última asistencia</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/30 flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button onClick={onEdit}>Editar ficha</Button>
        </div>
      </div>
    </div>
  );
}
