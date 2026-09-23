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
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          color="bg-red-600"
        />
        <KPICard
          label="Por cobrar"
          value={formatCurrency(deudaTotal)}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-amber-600"
        />
        <KPICard
          label="Abonos"
          value={abonos}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>}
          color="bg-yellow-600"
        />
        <KPICard
          label="Adelantados"
          value={adelantados}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
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
          <svg className="w-12 h-12 mx-auto text-slate-600 mt-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                    const gNombre = gestionar.jugador_nombre || gestionar.nombre || '';
                    const gCategoria = gestionar.categoria || '';
                    const saldo = gestionar.deuda || 0;
                    setGestionar(null);
                    if (gid != null) {
                      navigate('/pagos', { state: { jugador: { id: gid, nombre: gNombre.split(' ')[0] || gNombre, apellidos: gNombre.split(' ').slice(1).join(' ') || '', categoria: gCategoria, saldo_pendiente: saldo, mensualidad: mensualidad || undefined } as unknown as never } });
                    } else {
                      navigate('/pagos');
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 transition-all text-left"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </span>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">Contactar por WhatsApp</p>
                      <p className="text-xs text-slate-500">Enviar mensaje a {gestionar.telefono || '—'}</p>
                    </div>
                  </a>
                ) : (
                  <div className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 bg-slate-800/50 opacity-50">
                    <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
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
