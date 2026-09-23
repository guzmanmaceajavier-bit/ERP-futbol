import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { alertaService } from '../../services/alertaService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calcularEstadoFinanciero, getMensualidad } from '../../utils/finanzas';
import type { EstadoFinanciero } from '../../utils/finanzas';
import { Icon } from '../../components/ui/Icon';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/dashboard/KPICard';
import { PageHeader } from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { FormModal } from '../../components/forms/FormModal';
import type { Alerta } from '../../types';

type Filtro = 'todos' | 'al_dia' | 'proximo' | 'vence_hoy' | 'vencido' | 'abono' | 'adelantado';

const FILTRO_LABELS: Record<Filtro, string> = {
  todos: 'Todos',
  al_dia: 'Al día',
  proximo: 'Próximo',
  vence_hoy: 'Vence hoy',
  vencido: 'Vencido',
  abono: 'Abono',
  adelantado: 'Adelantado',
};

const FILTRO_TO_ESTADO: Record<Filtro, EstadoFinanciero | null> = {
  todos: null,
  al_dia: 'al_dia',
  proximo: 'proximo_vencer',
  vence_hoy: 'vence_hoy',
  vencido: 'vencido',
  abono: 'abono',
  adelantado: 'adelantado',
};

function getVencimiento(a: Alerta): string | null {
  return a.vencimiento || a.fecha_vencimiento || null;
}

function getPeriodoEstado(a: Alerta): string | undefined {
  // honour explicit adelantado if present on raw object
  const rawEstado = (a as unknown as Record<string, unknown>).estado_financiero as string | undefined;
  if (rawEstado === 'adelantado') return 'adelantado';
  if ((a.deuda || 0) < 0) return 'adelantado';
  if (a.tipo_alerta === 'ABONO' || ((a.pagado || 0) > 0 && (a.deuda || 0) > 0)) return 'abono';
  return undefined;
}

function getEstadoFinanciero(a: Alerta) {
  return calcularEstadoFinanciero(null, getVencimiento(a), a.deuda || 0, getPeriodoEstado(a));
}

function getMensualidadAlerta(a: Alerta): number {
  if (a.mensualidad_objetivo != null && a.mensualidad_objetivo > 0) return a.mensualidad_objetivo;
  return getMensualidad(a.categoria) || 0;
}

function estadoFinVariant(color: string): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (color) {
    case 'green': return 'success';
    case 'red': return 'danger';
    case 'yellow':
    case 'amber': return 'warning';
    case 'blue': return 'info';
    default: return 'default';
  }
}

export function Alertas() {
  const { data: alertas, loading, error, refetch } = useApi(() => alertaService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [gestionar, setGestionar] = useState<Alerta | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const navigate = useNavigate();

  const busquedaDebounced = useDebounce(busqueda);

  const lista = alertas || [];

  const pendientes = useMemo(() => lista.filter((a) => {
    const e = getEstadoFinanciero(a);
    return e.estado !== 'al_dia' && e.estado !== 'adelantado';
  }).length, [lista]);

  const deudaTotal = useMemo(
    () => lista.filter((a) => (a.deuda || 0) > 0).reduce((s, a) => s + (a.deuda || 0), 0),
    [lista],
  );

  const abonos = useMemo(
    () => lista.filter((a) => getEstadoFinanciero(a).estado === 'abono').length,
    [lista],
  );

  const adelantados = useMemo(
    () => lista.filter((a) => getEstadoFinanciero(a).estado === 'adelantado').length,
    [lista],
  );

  const categorias = useMemo(() => [...new Set(lista.map((a) => a.categoria).filter(Boolean))], [lista]);

  const handleFiltroChange = (next: Filtro) => {
    setFiltro(next);
  };

  const alertasFiltradas = useMemo(() => {
    let filtered = lista;
    if (filtro !== 'todos') {
      const targetEstado = FILTRO_TO_ESTADO[filtro];
      if (targetEstado) {
        filtered = filtered.filter((a) => getEstadoFinanciero(a).estado === targetEstado);
      }
    }
    if (categoriaFiltro) {
      filtered = filtered.filter((a) => a.categoria === categoriaFiltro);
    }
    const q = busquedaDebounced.toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          (a.titulo || a.nombre || '').toLowerCase().includes(q) ||
          (a.categoria || '').toLowerCase().includes(q) ||
          (a.jugador_nombre || '').toLowerCase().includes(q) ||
          (a.periodo || '').toLowerCase().includes(q) ||
          getEstadoFinanciero(a).label.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [lista, filtro, categoriaFiltro, busquedaDebounced]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(alertasFiltradas);

  // Keep for backward compat — modal no longer calls these for CRM actions
  const handleAction = async (alerta: Alerta, accion: string, successMsg: string) => {
    try {
      await alertaService.accion({ accion: accion as never, alerta_id: alerta.id });
      showSuccess(successMsg);
      refetch();
      if (gestionar && gestionar.id === alerta.id) {
        const updated = lista.find((a) => a.id === alerta.id);
        if (updated) setGestionar({ ...updated, estado_cobranza: accion === 'descartar' ? 'descartada' as never : accion as never } as Alerta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  };

  const buildWhatsappLink = (alerta: Alerta): string | null => {
    const tel = (alerta.telefono || '').replace(/\D/g, '');
    if (!tel) return null;
    const nombre = alerta.jugador_nombre || alerta.nombre || 'jugador';
    const deudaTxt = formatCurrency(alerta.deuda || 0);
    const periodoTxt = alerta.periodo || alerta.mes_abono || '';
    const msg = `Hola ${nombre}, te recordamos tu pendiente${periodoTxt ? ` del periodo ${periodoTxt}` : ''} por ${deudaTxt}. Quedamos atentos a tu pago.`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const filtros: Filtro[] = ['todos', 'al_dia', 'proximo', 'vence_hoy', 'vencido', 'abono', 'adelantado'];

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Cobranzas"
        subtitle={`${pendientes} pendientes · ${formatCurrency(deudaTotal)} por cobrar · ${abonos} abonos · ${adelantados} adelantados · ${total} registros`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Pendientes"
          value={pendientes}
          icon={<Icon name="warning" className="w-5 h-5 text-white" />}
          color="bg-red-600"
        />
        <KPICard
          label="Por cobrar"
          value={formatCurrency(deudaTotal)}
          icon={<Icon name="money" className="w-5 h-5 text-white" />}
          color="bg-amber-600"
        />
        <KPICard
          label="Abonos"
          value={abonos}
          icon={<Icon name="wallet" className="w-5 h-5 text-white" />}
          color="bg-yellow-600"
        />
        <KPICard
          label="Adelantados"
          value={adelantados}
          icon={<Icon name="chartUp" className="w-5 h-5 text-white" />}
          color="bg-blue-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={busqueda} onChange={(v) => { setBusqueda(v); setPagina(1); }} placeholder="Buscar por jugador, categoria, periodo..." className="flex-1" />
        <select
          value={categoriaFiltro}
          onChange={(e) => { setCategoriaFiltro(e.target.value); setPagina(1); }}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
        >
          <option value="">Todas las categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => { handleFiltroChange(f); setPagina(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              filtro === f
                ? 'bg-white text-slate-900 border-white'
                : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
            }`}
          >
            {FILTRO_LABELS[f]}
          </button>
        ))}
      </div>

      {alertasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <Icon name="checkCircle" className="w-12 h-12 mx-auto text-slate-600 mt-4" />
          <p className="text-slate-400 mt-4">No hay seguimientos pendientes</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Jugador</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Categoría</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Mensualidad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Próximo pago</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginados.map((a, idx) => {
                    const estadoFin = getEstadoFinanciero(a);
                    const mensualidad = getMensualidadAlerta(a);
                    const venc = getVencimiento(a);
                    return (
                      <tr key={a.id || idx} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              estadoFin.color === 'red' ? 'bg-red-500' : estadoFin.color === 'yellow' ? 'bg-yellow-500' : estadoFin.color === 'amber' ? 'bg-amber-500' : estadoFin.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                            }`} />
                            <span className="text-white text-sm font-medium truncate">{a.jugador_nombre || a.titulo || a.nombre || `Seguimiento #${a.id}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{a.categoria || '-'}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-200">{mensualidad > 0 ? formatCurrency(mensualidad) : '-'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={estadoFinVariant(estadoFin.color)}>{estadoFin.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[#22C55E]">{formatCurrency(a.deuda || 0)}</td>
                        <td className="px-4 py-3 text-sm text-slate-400">{venc ? formatDate(venc) : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" onClick={() => setGestionar(a)}>Gestionar</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}

      {gestionar && (() => {
        const estadoFin = getEstadoFinanciero(gestionar);
        const venc = getVencimiento(gestionar);
        const mensualidad = getMensualidadAlerta(gestionar);
        const waLink = buildWhatsappLink(gestionar);
        return (
          <FormModal
            isOpen={!!gestionar}
            onClose={() => setGestionar(null)}
            title="Gestión de cobranza"
            wide
          >
            <div className="space-y-5">
              {/* Financial header */}
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    estadoFin.color === 'red' ? 'bg-red-500' : estadoFin.color === 'yellow' ? 'bg-yellow-500' : estadoFin.color === 'amber' ? 'bg-amber-500' : estadoFin.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <h3 className="text-white font-bold">{gestionar.jugador_nombre || gestionar.titulo || gestionar.nombre} — {gestionar.categoria || '-'}</h3>
                  <Badge variant={estadoFinVariant(estadoFin.color)}>{estadoFin.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Periodo</p>
                    <p className="text-white">{gestionar.periodo || gestionar.mes_abono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Saldo pendiente</p>
                    <p className="font-mono text-[#22C55E] font-bold">{formatCurrency(gestionar.deuda || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Mensualidad</p>
                    <p className="font-mono text-white">{mensualidad > 0 ? formatCurrency(mensualidad) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Estado financiero</p>
                    <p className="text-white">{estadoFin.label}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Vencimiento</p>
                    <p className="text-white">{venc ? formatDate(venc) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Próximo pago</p>
                    <p className="text-white">{venc ? formatDate(venc) : '—'}</p>
                  </div>
                  {estadoFin.diasAtraso != null && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase">Atraso</p>
                      <p className="text-red-400 font-bold">{estadoFin.diasAtraso} días</p>
                    </div>
                  )}
                  {estadoFin.diasFaltantes != null && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase">Faltan</p>
                      <p className="text-yellow-400">{estadoFin.diasFaltantes} días</p>
                    </div>
                  )}
                  {(gestionar.pagado || 0) > 0 && (
                    <div>
                      <p className="text-slate-500 text-xs uppercase">Pagado</p>
                      <p className="text-yellow-400 font-mono">{formatCurrency(gestionar.pagado || 0)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial actions only */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const gid = gestionar.jugador_id;
                    setGestionar(null);
                    if (gid != null) navigate(`/pagos?jugador_id=${gid}`);
                    else navigate('/pagos');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 transition-all text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                    <Icon name="money" className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Registrar pago</p>
                    <p className="text-xs text-slate-500">Ir a pagos para registrar el abono</p>
                  </div>
                </button>

                {waLink ? (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-600/30 bg-green-600/10 hover:bg-green-600/20 transition-all text-left">
                    <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                      <Icon name="whatsapp" className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">Contactar por WhatsApp</p>
                      <p className="text-xs text-slate-500">Enviar mensaje a {gestionar.telefono || '—'}</p>
                    </div>
                  </a>
                ) : (
                  <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/50 opacity-50">
                    <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500">
                      <Icon name="whatsapp" className="w-4 h-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm font-medium">Contactar por WhatsApp</p>
                      <p className="text-xs text-slate-500">Sin teléfono registrado</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setGestionar(null); navigate('/jugadores'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-700/30 transition-all text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
                    <Icon name="user" className="w-4 h-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Ver ficha</p>
                    <p className="text-xs text-slate-500">Abrir ficha de {gestionar.jugador_nombre || 'jugador'}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={() => setGestionar(null)}>Cerrar</Button>
            </div>
          </FormModal>
        );
      })()}
    </div>
  );
}
