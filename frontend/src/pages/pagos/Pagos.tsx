import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { pagoService } from '../../services/pagoService';
import { jugadorService } from '../../services/jugadorService';
import { periodoService } from '../../services/periodoService';
import type { Pago, PagoForm, Jugador } from '../../types';
import { CATEGORIAS, MESES } from '../../utils/constants';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import { validateAnulacion } from '../../utils/validators';
import { calcularProximoPago, calcularEstadoFinanciero, getMensualidad, formatearVencimiento, expandirPagoMeses } from '../../utils/finanzas';
import { Pagination } from '../../components/data/Pagination';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { FormModal } from '../../components/forms/FormModal';
  import { PageHeader } from '../../components/layout/PageHeader';
  import { Textarea } from '../../components/ui/Textarea';
import { Icon } from '../../components/ui/Icon';
import { abrirFactura } from '../../utils/factura';
import { configService } from '../../services/configService';

const MENSUALIDAD_MAP: Record<string, number> = { 'Sub 17-18': 50000, 'Sub 16-15': 50000, 'Sub 14-13': 40000, 'Sub 12-11': 40000, 'Sub 10-9': 30000, 'Sub 8-7': 30000 };

export function Pagos() {
  const location = useLocation();
  const { data: pagos, loading, error, refetch } = useApi(() => pagoService.getAll());
  const { data: jugadores, refetch: refetchJugadores } = useApi(() => jugadorService.getAll());
  const { data: periodos } = useApi(() => periodoService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();

  const [saving, setSaving] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Pago | null>(null);
  const [anularPago, setAnularPago] = useState<Pago | null>(null);
  const [motivoAnular, setMotivoAnular] = useState('');

  const [jugadorSeleccionado, setJugadorSeleccionado] = useState<Jugador | null>(null);
  const [busquedaJugador, setBusquedaJugador] = useState('');
  const [filtroCatForm, setFiltroCatForm] = useState('');
  const [monto, setMonto] = useState(0);
  const [fecha, setFecha] = useState(todayISO());
  const [tipoPago, setTipoPago] = useState<'no' | 'abono' | 'si'>('no');
  const [concepto, setConcepto] = useState('abono');
  const [conceptoOtro, setConceptoOtro] = useState('');
  const [medioPago, setMedioPago] = useState('Efectivo');
  const [observacion, setObservacion] = useState('');
  const [mesesSeleccionados, setMesesSeleccionados] = useState<{ anio: number; mes: number }[]>([]);

  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFin, setFiltroFin] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'deudores' | 'pagados'>('todos');

  const busquedaDebounced = useDebounce(busquedaHistorial);
  const busquedaJugadorDebounced = useDebounce(busquedaJugador);

  const jugadoresGrid = useMemo(() => {
    if (!jugadores) return [];
    return jugadores.filter((j) => {
      if (!j.activo) return false;
      const matchCat = !filtroCatForm || j.categoria === filtroCatForm;
      const matchBus = !busquedaJugadorDebounced || `${j.nombre} ${j.apellidos}`.toLowerCase().includes(busquedaJugadorDebounced.toLowerCase());
      return matchCat && matchBus;
    });
  }, [jugadores, filtroCatForm, busquedaJugadorDebounced]);

  const pagosFiltrados = useMemo(() => {
    if (!pagos) return [];
    return pagos.filter((p) => {
      const matchBus = !busquedaDebounced || (p.jugador || '').toLowerCase().includes(busquedaDebounced.toLowerCase());
      const matchInicio = !filtroInicio || p.fecha >= filtroInicio;
      const matchFin = !filtroFin || p.fecha <= filtroFin;
      return matchBus && matchInicio && matchFin;
    });
  }, [pagos, busquedaDebounced, filtroInicio, filtroFin]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(pagosFiltrados);

  const resumen = useMemo(() => {
    if (!jugadores) return { alDia: 0, deudores: 0, total: 0 };
    const activos = jugadores.filter((j) => j.activo);
    const alDia = activos.filter((j) => (j.saldo_pendiente || 0) <= 0).length;
    return { alDia, deudores: activos.length - alDia, total: activos.length };
  }, [jugadores]);

  const totalFiltrado = useMemo(() => pagosFiltrados.reduce((sum, p) => sum + (p.monto || 0), 0), [pagosFiltrados]);

  const estadoCuentas = useMemo(() => {
    if (!jugadores) return [];
    const filtered = jugadores.filter((j) => j.activo).filter((j) => {
      if (filtroEstado === 'deudores') return (j.saldo_pendiente || 0) > 0;
      if (filtroEstado === 'pagados') return (j.saldo_pendiente || 0) <= 0;
      return true;
    });
    if (filtroEstado === 'todos') {
      // Pendientes primero con sutil fondo, luego Al dia
      return [...filtered].sort((a, b) => {
        const sa = (a.saldo_pendiente || 0) > 0 ? 0 : 1;
        const sb = (b.saldo_pendiente || 0) > 0 ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (b.saldo_pendiente || 0) - (a.saldo_pendiente || 0);
      });
    }
    return filtered;
  }, [jugadores, filtroEstado]);

  const { pagina: paginaCuentas, setPagina: setPaginaCuentas, totalPaginas: totalPaginasCuentas, paginados: paginadosCuentas, total: totalCuentas } = usePagination(estadoCuentas);

  const selectJugador = (j: Jugador) => {
    setJugadorSeleccionado(j);
    const base = getMensualidad(j.categoria) || MENSUALIDAD_MAP[j.categoria] || 50000;
    const saldo = j.saldo_pendiente || 0;
    const montoAuto = saldo > 0 ? saldo : (j.mensualidad || base);
    setMonto(montoAuto);
    setBusquedaJugador(`${j.nombre} ${j.apellidos}`);
    setFiltroCatForm(j.categoria || '');
    const now = new Date();
    setMesesSeleccionados([{ anio: now.getFullYear(), mes: now.getMonth() + 1 }]);
  };

  // Pre-selected jugador via query params (navegacion fresca: /pagos?jugador_id=15&periodo_id=28)
  // Soporta tambien legacy location.state para compatibilidad
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qJugadorId = params.get('jugador_id');
    const qPeriodoId = params.get('periodo_id');
    if (qJugadorId && jugadores) {
      const found = jugadores.find((j) => String(j.id) === qJugadorId);
      if (found) {
        if (qPeriodoId) (found as any)._targetPeriodoId = Number(qPeriodoId);
        selectJugador(found);
        return;
      }
    }
    const st = location.state as { jugador?: Jugador; saldo?: number; periodo_id?: number | null; mensualidad?: number; proximo_pago?: string | null } | null;
    if (st?.jugador) {
      const jug = st.jugador as Jugador;
      if (st.saldo != null && (jug.saldo_pendiente == null || jug.saldo_pendiente === 0)) {
        (jug as Jugador).saldo_pendiente = Number(st.saldo);
      }
      if (st.mensualidad != null && (jug.mensualidad == null || jug.mensualidad === 0)) {
        (jug as any).mensualidad = Number(st.mensualidad);
      }
      selectJugador(jug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.state, jugadores]);

  const resetForm = () => {
    setJugadorSeleccionado(null);
    setMonto(0);
    setFecha(todayISO());
    setTipoPago('no');
    setMesesSeleccionados([]);
    setConcepto('abono');
    setConceptoOtro('');
    setMedioPago('Efectivo');
    setObservacion('');
    setEditingPago(null);
  };

  // Enhanced financial context computed when jugadorSeleccionado is set
  const mensualidadBase = useMemo(() => {
    if (!jugadorSeleccionado) return 0;
    return getMensualidad(jugadorSeleccionado.categoria) || MENSUALIDAD_MAP[jugadorSeleccionado.categoria] || 0;
  }, [jugadorSeleccionado]);

  const mensualidadEfectiva = useMemo(() => {
    if (!jugadorSeleccionado) return 0;
    return jugadorSeleccionado.mensualidad || mensualidadBase || MENSUALIDAD_MAP[jugadorSeleccionado.categoria] || 0;
  }, [jugadorSeleccionado, mensualidadBase]);

  const saldoPendiente = useMemo(() => jugadorSeleccionado?.saldo_pendiente || 0, [jugadorSeleccionado]);

  const proximoVencimientoRaw = useMemo(() => {
    if (!jugadorSeleccionado) return null;
    const calc = calcularProximoPago(jugadorSeleccionado.ultimo_pago || null);
    return calc || jugadorSeleccionado.proximo_vencimiento || null;
  }, [jugadorSeleccionado]);

  const estadoFinanciero = useMemo(() => {
    if (!jugadorSeleccionado) return null;
    return calcularEstadoFinanciero(jugadorSeleccionado.ultimo_pago || null, proximoVencimientoRaw, saldoPendiente);
  }, [jugadorSeleccionado, proximoVencimientoRaw, saldoPendiente]);

  const vencimientoFormateado = useMemo(() => {
    if (!estadoFinanciero) return '';
    return formatearVencimiento(proximoVencimientoRaw, estadoFinanciero);
  }, [proximoVencimientoRaw, estadoFinanciero]);

  const proximoTrasPago = useMemo(() => calcularProximoPago(fecha), [fecha]);

  const periodoIdTarget = useMemo(() => (location.state as { periodo_id?: number | null })?.periodo_id ?? null, [location.state]);
  const mensualidadFromState = useMemo(() => (location.state as { mensualidad?: number })?.mensualidad ?? null, [location.state]);

  const expansion = useMemo(() => {
    if (!jugadorSeleccionado || mensualidadEfectiva <= 0 || monto <= 0) return null;
    return expandirPagoMeses(monto, mensualidadEfectiva);
  }, [jugadorSeleccionado, mensualidadEfectiva, monto]);

  const estadoBadgeCls = (color: string) => {
    switch (color) {
      case 'green': return 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30';
      case 'yellow': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'amber': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const handleGuardar = async () => {
    if (!jugadorSeleccionado) { showError('Selecciona un jugador'); return; }
    if (monto <= 0) { showError('El monto debe ser mayor a 0'); return; }
    if (mesesSeleccionados.length === 0) { showError('Selecciona al menos un periodo'); return; }
    setSaving(true);
    try {
      const payload: PagoForm = {
        jugador_id: jugadorSeleccionado.id,
        monto,
        fecha,
        tipo: tipoPago === 'abono' ? 'abono' : tipoPago === 'si' ? 'adelantado' : 'completo',
        observacion: observacion || '',
        mes_pago: `${MESES[mesesSeleccionados[0].mes - 1]} ${mesesSeleccionados[0].anio}`,
        cantidad_meses: mesesSeleccionados.length,
        meses_cubiertos: mesesSeleccionados,
      };
      const proximoAuto = calcularProximoPago(fecha);
      if (editingPago) { await pagoService.update(editingPago.id, payload); showSuccess(proximoAuto ? `Pago actualizado. Proximo vencimiento: ${proximoAuto} (+1 mes)` : 'Pago actualizado'); }
      else { await pagoService.create(payload); showSuccess(proximoAuto ? `Pago registrado y recibo generado. Proximo vencimiento: ${proximoAuto}` : 'Pago registrado y recibo generado'); }
      resetForm(); refetch(); refetchJugadores();
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Error al guardar'; showError(msg); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Pago) => {
    const j = jugadores?.find((x) => x.id === p.jugador_id);
    if (j) {
      setJugadorSeleccionado(j);
      setBusquedaJugador('');
      setFiltroCatForm('');
    }
    setMonto(p.monto);
    setFecha(p.fecha);
    setObservacion(p.observacion || '');
    setEditingPago(p);
    setTipoPago(p.tipo === 'adelantado' ? 'si' : p.tipo === 'abono' ? 'abono' : 'no');
    if (p.mes_pago && p.cantidad_meses) {
      const parts = p.mes_pago.split(' ');
      const mesIdx = (MESES as readonly string[]).indexOf(parts[0]);
      const anio = parseInt(parts[1]) || new Date().getFullYear();
      if (mesIdx >= 0) {
        const meses: { anio: number; mes: number }[] = [];
        for (let i = 0; i < (p.cantidad_meses || 1); i++) {
          const m = mesIdx + i;
          meses.push({ anio: anio + Math.floor(m / 12), mes: (m % 12) + 1 });
        }
        setMesesSeleccionados(meses);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await pagoService.remove(confirmDelete.id); showSuccess('Operacion anulada'); setConfirmDelete(null); refetch(); refetchJugadores(); }
    catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Error'; showError(msg); }
  };

  const handleAnular = async () => {
    if (!anularPago) return;
    const errors = validateAnulacion(motivoAnular);
    if (Object.keys(errors).length > 0) { showError(errors.motivo || 'Motivo invalido'); return; }
    setSaving(true);
    try {
      await pagoService.anular({ pago_id: anularPago.id, motivo: motivoAnular });
      showSuccess('Operacion anulada correctamente');
      setAnularPago(null);
      setMotivoAnular('');
      refetch();
      refetchJugadores();
    } catch (err: unknown) { const msg = err instanceof Error ? err.message : 'Error al anular operacion'; showError(msg); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent placeholder-slate-500';
  const selectCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]';
  const labelCls = 'text-sm font-bold text-slate-300';

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      <PageHeader
        title="Ingresos"
        subtitle="Registra y controla los pagos"
        actions={
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase">Total filtrado</p>
            <p className="text-lg text-[#22C55E] font-mono font-bold">{formatCurrency(totalFiltrado)}</p>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Al dia', value: resumen.alDia, color: 'bg-[#22C55E]', textColor: 'text-[#22C55E]', icon: 'M5 13l4 4L19 7' },
          { label: 'Pendientes', value: resumen.deudores, color: 'bg-amber-500', textColor: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total', value: resumen.total, color: 'bg-slate-700', textColor: 'text-white', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        ].map(({ label, value, color, textColor, icon }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${color} text-white flex items-center justify-center`}>
              <Icon name={icon.startsWith('M5 13') ? 'confirmar' : icon.startsWith('M12 8v4') ? 'reloj' : 'usuarios'} className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">{label}</p>
              <p className={`text-lg font-mono font-bold ${textColor}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#22C55E] text-white flex items-center justify-center text-sm font-bold">+</span>
            {editingPago ? 'Editar pago' : 'Registrar pago'}
          </h2>
          <span className="text-[10px] bg-slate-700 border border-slate-600 px-2 py-1 rounded-full font-bold text-slate-300">Recibo automatico</span>
        </div>
        <div className="p-5 space-y-4">
          {!jugadorSeleccionado ? (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Categoria</label>
                  <select value={filtroCatForm} onChange={(e) => setFiltroCatForm(e.target.value)} className={selectCls}>
                    <option value="">Todas Categorias</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Buscar jugador *</label>
                  <input value={busquedaJugador} onChange={(e) => setBusquedaJugador(e.target.value)} placeholder="Escribe nombre..." autoComplete="off" className={inputCls} />
                </div>
              </div>
              {(busquedaJugador || filtroCatForm) && jugadoresGrid.length > 0 && (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <div className="max-h-[200px] overflow-auto divide-y divide-slate-700/50">
                    {jugadoresGrid.map((j) => {
                      const saldo = j.saldo_pendiente || 0;
                      return (
                        <button key={j.id} onClick={() => selectJugador(j)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-slate-700/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${saldo <= 0 ? 'bg-[#22C55E]' : 'bg-red-500'}`} />
                            <span className="text-sm text-white truncate">{j.nombre} {j.apellidos}</span>
                            <span className="text-xs text-slate-500 hidden sm:inline">{j.categoria}</span>
                          </div>
                          <span className={`text-xs font-mono font-bold flex-shrink-0 ${saldo > 0 ? 'text-red-400' : 'text-[#22C55E]'}`}>{formatCurrency(saldo)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {(busquedaJugador || filtroCatForm) && jugadoresGrid.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">Sin resultados</p>
              )}
            </div>
          ) : (
            <button onClick={() => { setJugadorSeleccionado(null); setMonto(0); setBusquedaJugador(''); setFiltroCatForm(''); }}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              <Icon name="izquierda" className="w-3 h-3" /> Cambiar jugador
            </button>
          )}

          {jugadorSeleccionado && (() => {
            const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const periodosSel = (periodos as any[] || []).filter((p: any) => p.jugador_id === jugadorSeleccionado.id);
            const mesesPagadosNum = periodosSel.filter((p: any) => p.estado === 'completo').length;
            const totalPagadoSel = periodosSel.filter((p: any) => p.estado === 'completo' || p.estado === 'abono').reduce((s: number, p: any) => s + (Number(p.pagado) || 0), 0);
            return (
              <div className="space-y-3">
                {/* Encabezado jugador estilo imagen */}
                <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center text-white flex-shrink-0">
                      <Icon name="usuario" className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white truncate">{jugadorSeleccionado.nombre} {jugadorSeleccionado.apellidos}</p>
                        {estadoFinanciero && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${estadoBadgeCls(estadoFinanciero.color)}`}>{estadoFinanciero.label}</span>}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {jugadorSeleccionado.numero_identificacion ? `CC: ${jugadorSeleccionado.numero_identificacion}` : `Tel: ${jugadorSeleccionado.telefono || '—'}`} &nbsp;|&nbsp; {jugadorSeleccionado.categoria}
                        {jugadorSeleccionado.acudiente_nombre ? ` · Acud: ${jugadorSeleccionado.acudiente_nombre}` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setJugadorSeleccionado(null); setMonto(0); }}
                    className="w-8 h-8 rounded-full bg-[#0B1F35] border border-[#1E3A5F] flex items-center justify-center hover:bg-slate-700 transition-colors flex-shrink-0 self-end sm:self-auto">
                    <Icon name="cerrar" className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Estado financiero  + Mensualidades por mes */}
                <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="usuarios" className="w-4 h-4 text-slate-400" /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-500">Categoria</p>
                        <p className="text-xs font-bold text-white truncate">{jugadorSeleccionado.categoria}</p>
                      </div>
                    </div>
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="verificar" className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] text-slate-500">Estado financiero</p>
                        <p className="text-xs font-bold text-white">{estadoFinanciero?.label || '—'}</p>
                      </div>
                    </div>
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="calendario" className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] text-slate-500">Fecha de inicio</p>
                        <p className="text-xs font-bold text-white">{formatDate(jugadorSeleccionado.fecha_ingreso)}</p>
                      </div>
                    </div>
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="dinero" className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] text-slate-500">Mensualidad</p>
                        <p className="text-xs font-bold text-white">{formatCurrency(mensualidadEfectiva)}</p>
                      </div>
                    </div>
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="grafica" className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] text-slate-500">Meses pagados</p>
                        <p className="text-xs font-bold text-white">{mesesPagadosNum} / 12</p>
                      </div>
                    </div>
                    <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="reloj" className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] text-slate-500">Proximo vencimiento</p>
                        <p className="text-xs font-bold text-white">{proximoVencimientoRaw ? formatDate(proximoVencimientoRaw) : '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#1E3A5F]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-400">Mensualidades por mes</p>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Pagado</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600" /> Pendiente</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {MESES_SHORT.map((m, idx) => {
                        const per = periodosSel.find((p: any) => p.mes === idx + 1);
                        const pagado = per?.estado === 'completo';
                        const abono = per?.estado === 'abono';
                        return (
                          <div key={m} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-slate-500">{m}</span>
                            <div className={`w-full h-1.5 rounded-full ${pagado ? 'bg-[#22C55E]' : abono ? 'bg-amber-500' : 'bg-slate-700'}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pre-seleccion hint (solo cuando viene de Cobrar con mensaje) */}
          {jugadorSeleccionado && (location.state as any)?.jugador && !periodoIdTarget && (
            <p className="text-[11px] text-slate-500">Pre-seleccionado desde Jugadores → Cobrar</p>
          )}

          {/* Monto y fecha */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monto *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">$</span>
                <input type="number" min="1" value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none" />
              </div>
              {/* Abono handling messages */}
              {jugadorSeleccionado && mensualidadEfectiva > 0 && tipoPago === 'abono' && monto > 0 && (
                <div className="mt-2">
                  {saldoPendiente > 0 ? (
                    monto >= saldoPendiente ? (
                      <p className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg px-3 py-2">
                        Completa el periodo — cubre saldo pendiente de {formatCurrency(saldoPendiente)} y cierra el periodo.
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        Pago parcial — quedan {formatCurrency(saldoPendiente - monto)} por completar para cerrar el periodo.
                      </p>
                    )
                  ) : monto >= mensualidadEfectiva ? (
                    <p className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg px-3 py-2">
                      Completa el periodo — monto cubre mensualidad completa ({formatCurrency(mensualidadEfectiva)}).
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      Pago parcial — quedan {formatCurrency(mensualidadEfectiva - monto)} por completar (mensualidad {formatCurrency(mensualidadEfectiva)}).
                    </p>
                  )}
                </div>
              )}
              {/* Multi-month handling via expandirPagoMeses */}
              {jugadorSeleccionado && expansion && mensualidadEfectiva > 0 && monto > 0 && (expansion.mesesCompletos > 1 || (expansion.mesesCompletos >= 1 && expansion.resto > 0)) && (
                <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-300">
                    Este pago cubre {expansion.mesesCompletos} periodo(s) completo(s){expansion.resto > 0 ? ` + 1 abono de ${formatCurrency(expansion.resto)}` : ''} — total {expansion.detalle.length} periodo(s)
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {expansion.detalle.map((d, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${d.estado === 'completo' ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>
                        Periodo {d.mes}: {formatCurrency(d.pagado)} · {d.estado === 'completo' ? 'Completo' : 'Abono'}
                      </span>
                    ))}
                  </div>
                  {expansion.resto > 0 && <p className="text-[11px] text-slate-400 mt-1">Ultimo periodo queda como Abono (resto {formatCurrency(expansion.resto)})</p>}
                </div>
              )}
              {/* Single abono remainder when monto exactly one month plus resto but not multi-month threshold */}
              {jugadorSeleccionado && expansion && mensualidadEfectiva > 0 && monto > 0 && expansion.mesesCompletos === 1 && expansion.resto > 0 && tipoPago !== 'si' && (
                <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-300">Cubre 1 mes completo + abono de {formatCurrency(expansion.resto)} para siguiente periodo</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {expansion.detalle.map((d, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${d.estado === 'completo' ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>
                        Periodo {d.mes}: {formatCurrency(d.pagado)} · {d.estado === 'completo' ? 'Completo' : 'Abono'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Fecha *</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none" />
              {proximoTrasPago && (
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2">
                  Proximo vencimiento tras este pago: <span className="font-bold text-white">{proximoTrasPago}</span> (+1 mes desde fecha)
                </p>
              )}
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="grid sm:grid-cols-3 gap-2">
            {[
              { val: 'no', label: 'Mensual', desc: 'Completo', active: 'border-white bg-slate-700' },
              { val: 'abono', label: 'Abono', desc: 'Parcial', active: 'border-amber-500 bg-amber-500/10' },
              { val: 'si', label: 'Adelantado', desc: 'Varios meses', active: 'border-[#22C55E] bg-[#22C55E]/10' },
            ].map(({ val, label, desc, active }) => (
              <label key={val} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${tipoPago === val ? active : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                <input type="radio" name="tipo_pago" value={val} checked={tipoPago === val} onChange={(e) => setTipoPago(e.target.value as never)} className="accent-[#22C55E]" />
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-xs text-slate-500">{desc}</span>
              </label>
            ))}
          </div>

          {/* Seleccion de meses para adelantado */}
          {tipoPago === 'si' && (
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 mb-2">Selecciona los meses a cubrir</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
                {MESES.map((nombre, idx) => {
                  const mes = idx + 1;
                  const anio = new Date().getFullYear();
                  const seleccionado = mesesSeleccionados.some(m => m.mes === mes && m.anio === anio);
                  return (
                    <button key={mes} type="button"
                      onClick={() => {
                        if (seleccionado) {
                          setMesesSeleccionados(mesesSeleccionados.filter(m => !(m.mes === mes && m.anio === anio)));
                        } else {
                          setMesesSeleccionados([...mesesSeleccionados, { anio, mes }].sort((a, b) => a.anio - b.anio || a.mes - b.mes));
                        }
                      }}
                      className={`p-2 rounded-lg border text-center text-xs font-bold transition-all ${seleccionado ? 'bg-[#22C55E]/20 border-[#22C55E]/50 text-[#22C55E]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                      {nombre}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">{mesesSeleccionados.length} meses seleccionados · {formatCurrency(monto * mesesSeleccionados.length)} total</p>
              {expansion && mensualidadEfectiva > 0 && (
                <div className="mt-3 bg-slate-800 border border-slate-700 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-300">Calculo expandirPagoMeses: {expansion.mesesCompletos} completo(s){expansion.resto > 0 ? ` + resto ${formatCurrency(expansion.resto)} como Abono` : ''}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {expansion.detalle.map((d, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.estado === 'completo' ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-amber-500/20 text-amber-400'}`}>{d.estado === 'completo' ? 'Completo' : 'Abono'}: {formatCurrency(d.pagado)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Concepto, medio, obs */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Concepto</label>
              <select value={concepto} onChange={(e) => setConcepto(e.target.value)} className={`mt-1 ${selectCls}`}>
                <option value="abono">Mensualidad</option>
                <option value="inscripcion">Inscripcion</option>
                <option value="uniforme">Uniforme</option>
                <option value="otro">Otro</option>
              </select>
              {concepto === 'otro' && (
                <input value={conceptoOtro} onChange={(e) => setConceptoOtro(e.target.value)} placeholder="Escribe concepto..."
                  className="mt-2 w-full px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-white placeholder-amber-300/50" />
              )}
            </div>
            <div>
              <label className={labelCls}>Medio de pago</label>
              <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)} className={`mt-1 ${selectCls}`}>
                <option>Efectivo</option><option>Nequi</option><option>Bancolombia</option><option>Transferencia</option><option>Otro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Observaciones</label>
              <input value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" className={`mt-1 ${inputCls}`} />
            </div>
          </div>

          {editingPago && (
            <button onClick={resetForm}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors">
              Cancelar edicion
            </button>
          )}
          <button onClick={handleGuardar} disabled={saving}
            className="w-full py-3 bg-[#22C55E] hover:bg-[#1DA84C] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : editingPago ? 'Guardar cambios' : 'Confirmar registro'}
          </button>
          {jugadorSeleccionado && proximoTrasPago && (
            <p className="text-center text-[11px] text-slate-500">Al confirmar, el proximo vencimiento se calculara automaticamente como {proximoTrasPago} (+1 mes desde {fecha})</p>
          )}
        </div>
      </section>

      {/* Historial */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex flex-col md:flex-row md:items-center gap-3">
          <h3 className="font-bold text-sm text-white">Historial de pagos</h3>
          <div className="flex flex-1 gap-2 md:justify-end">
            <input value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} placeholder="Buscar jugador..."
              className="flex-1 md:max-w-xs px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500" />
            <input type="date" value={filtroInicio} onChange={(e) => setFiltroInicio(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm" />
            <input type="date" value={filtroFin} onChange={(e) => setFiltroFin(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm" />
            <button onClick={() => { setBusquedaHistorial(''); setFiltroInicio(''); setFiltroFin(''); }}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-white hover:bg-slate-600 transition-colors">Limpiar</button>
          </div>
        </div>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-sm">
            <thead className="text-[11px] font-black uppercase text-slate-500 sticky top-0 bg-slate-800/95 backdrop-blur">
              <tr>
                <th className="px-4 py-2.5 text-left">Jugador</th>
                <th className="px-4 py-2.5 text-left">Fecha</th>
                <th className="px-4 py-2.5 text-left">Concepto</th>
                <th className="px-4 py-2.5 text-left">Metodo</th>
                <th className="px-4 py-2.5 text-left">Observacion</th>
                <th className="px-4 py-2.5 text-right">Monto</th>
                <th className="px-4 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No hay pagos registrados</td></tr>
              ) : paginados.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-800/50 transition-colors ${p.anulado ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.jugador || `Jugador #${p.jugador_id}`}</p>
                    <p className="text-[11px] text-slate-500">{p.jugador_categoria || ''} | {p.recibo_numero || ''}</p>
                    {p.anulado && p.anulado_motivo && <p className="text-[10px] text-amber-400 mt-0.5">Motivo: {p.anulado_motivo}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(p.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      p.estado_pago === 'completo' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                      p.estado_pago === 'abono' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                    }`}>{p.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{(p as any).metodo_pago || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[160px] truncate" title={p.observacion || ''}>{p.observacion || '-'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${p.anulado ? 'text-slate-500 line-through' : 'text-[#22C55E]'}`}>{formatCurrency(p.monto)}</td>
                  <td className="px-4 py-3">
                    {p.anulado ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-600 text-slate-300 border border-slate-500">Anulado</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(p)} className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all" title="Editar">
                          <Icon name="editar" className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setAnularPago(p); setMotivoAnular(''); }} className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all" title="Anular operacion">
                          <Icon name="bloqueo" className="w-4 h-4" />
                        </button>
                        <button onClick={async () => {
                          const jug = jugadores?.find((j) => j.id === p.jugador_id) || null;
                          abrirFactura({ pago: p, jugador: jug as any, periodoLabel: p.mes_pago || undefined, mensualidad: mensualidadEfectiva });
                        }} className="p-1.5 rounded-md bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all flex items-center gap-1" title="Factura">
                          <Icon name="grafica" className="w-4 h-4" />
                          <span className="text-[11px] font-bold hidden xl:inline">Factura</span>
                        </button>
                        {p.jugador_telefono && (
                          <button onClick={() => window.open(`https://wa.me/${p.jugador_telefono}`, '_blank')}
                            className="p-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all" title="WhatsApp">
                            <Icon name="whatsapp" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">{total} registros</span>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </div>
      </section>

      {/* Estado de cuentas */}
      <section className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Icon name="usuarios" className="w-5 h-5 text-slate-400" />
              Estado de cuentas
              <span className="ml-1 text-xs font-normal text-slate-500">{estadoCuentas.length} jugadores</span>
            </h3>
            <div className="flex gap-1.5">
              {([
                ['todos', 'Todos'],
                ['deudores', 'Pendientes'],
                ['pagados', 'Al dia'],
              ] as const).map(([val, label]) => {
                const count = val === 'todos' ? (jugadores?.filter((j) => j.activo).length || 0) : val === 'deudores' ? (jugadores?.filter((j) => j.activo && (j.saldo_pendiente || 0) > 0).length || 0) : (jugadores?.filter((j) => j.activo && (j.saldo_pendiente || 0) <= 0).length || 0);
                return (
                  <button key={val} onClick={() => setFiltroEstado(val as typeof filtroEstado)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filtroEstado === val ? 'bg-[#22C55E] text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                    {label} <span className="opacity-60">· {count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="overflow-auto max-h-[360px]">
          <table className="w-full text-sm">
            <thead className="text-[11px] font-black uppercase text-slate-500 sticky top-0 bg-slate-800/95 backdrop-blur">
              <tr>
                <th className="px-4 py-2.5 text-left">Jugador</th>
                <th className="px-4 py-2.5 text-right">Estado</th>
                <th className="px-4 py-2.5 text-center">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginadosCuentas.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-slate-500 text-sm">No hay jugadores en este filtro</td></tr>
              ) : paginadosCuentas.map((j) => {
                const saldo = j.saldo_pendiente || 0;
                const isPendiente = saldo > 0;
                return (
                  <tr key={j.id} className={`transition-colors ${isPendiente ? 'bg-red-500/[0.04] hover:bg-red-500/10' : 'hover:bg-slate-700/30'}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{j.nombre} {j.apellidos}</p>
                      <p className="text-[11px] text-slate-500">{j.categoria}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${isPendiente ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20'}`}>
                        {isPendiente ? `Debe ${formatCurrency(saldo)}` : 'Al dia'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isPendiente ? (
                        <button
                          onClick={() => {
                            const target = jugadores?.find((x) => x.id === j.id);
                            if (target) {
                              selectJugador(target);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 hover:bg-[#22C55E]/30 transition-colors"
                        >
                          Cobrar
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Icon name="verificar" className="w-3 h-3 text-[#22C55E]" /> Al dia
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">{totalCuentas} jugadores</span>
          <Pagination pagina={paginaCuentas} totalPaginas={totalPaginasCuentas} total={totalCuentas}
            onPrev={() => setPaginaCuentas(paginaCuentas - 1)} onNext={() => setPaginaCuentas(paginaCuentas + 1)} />
        </div>
      </section>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Anular operacion" message={`¿Anular la operacion de ${confirmDelete?.jugador || ''} por ${formatCurrency(confirmDelete?.monto || 0)}?`} />

      <FormModal isOpen={!!anularPago} onClose={() => { setAnularPago(null); setMotivoAnular(''); }} title="Anular operacion">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            ¿Anular la operacion de <span className="text-white font-bold">{anularPago?.jugador || `Jugador #${anularPago?.jugador_id}`}</span> por <span className="text-[#22C55E] font-mono">{formatCurrency(anularPago?.monto || 0)}</span>?
          </p>
          <Textarea
            label="Motivo de anulacion *"
            placeholder="Minimo 10 caracteres..."
            value={motivoAnular}
            onChange={(e) => setMotivoAnular(e.target.value)}
            rows={3}
            required
          />
          <p className="text-[11px] text-slate-500">Esta accion no se puede deshacer.</p>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button onClick={() => { setAnularPago(null); setMotivoAnular(''); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors">Cancelar</button>
          <button onClick={handleAnular} disabled={saving} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Anulando...' : 'Anular operacion'}
          </button>
        </div>
      </FormModal>
    </div>
  );
}
