import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { jugadorService } from '../../services/jugadorService';
import { pagoService } from '../../services/pagoService';
import { periodoService } from '../../services/periodoService';
import { MESES } from '../../utils/constants';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import { calcularEstadoFinanciero, calcularProximoPago, getMensualidad, expandirPagoMeses } from '../../utils/finanzas';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Icon } from '../../components/ui/Icon';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import type { Pago } from '../../types';
import type { PeriodoMensual } from '../../types/periodo';

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '-';
  const nac = new Date(fechaNacimiento.includes('T') ? fechaNacimiento : `${fechaNacimiento}T00:00:00`);
  if (isNaN(nac.getTime())) return '-';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

export function JugadorCuenta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jugadorId = Number(id);
  const { data: jugadores, loading: loadingJugadores } = useApi(() => jugadorService.getAll());
  const { data: pagos, loading: loadingPagos, refetch: refetchPagos } = useApi(() => pagoService.getAll());
  const { data: periodos, loading: loadingPeriodos, refetch: refetchPeriodos } = useApi(() => periodoService.getAll());
  const { data: allJugadores } = useApi(() => jugadorService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();

  // Pago form state
  const [monto, setMonto] = useState<number | ''>(0);
  const [fecha, setFecha] = useState(todayISO());
  const [concepto, setConcepto] = useState('Mensualidad');
  const [metodoPago, setMetodoPago] = useState('Nequi');
  const [observacion, setObservacion] = useState('');
  const [aplicaVariosMeses, setAplicaVariosMeses] = useState(false);
  const [mesesCantidad, setMesesCantidad] = useState(1);
  const [saving, setSaving] = useState(false);
  const [filtroConcepto, setFiltroConcepto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [confirmAnular, setConfirmAnular] = useState<Pago | null>(null);

  const jugador = useMemo(() => {
    if (!jugadores) return null;
    return jugadores.find((j) => j.id === jugadorId) || null;
  }, [jugadores, jugadorId]);

  const pagosJugador = useMemo(() => {
    if (!pagos || !jugador) return [];
    return (pagos as Pago[]).filter((p) => p.jugador_id === jugador.id && !p.anulado);
  }, [pagos, jugador]);

  const periodosJugador = useMemo(() => {
    if (!periodos || !jugador) return [];
    return (periodos as (PeriodoMensual & { jugador_id: number })[]).filter((p) => p.jugador_id === jugador.id).sort((a, b) => a.anio - b.anio || a.mes - b.mes);
  }, [periodos, jugador]);

  const mesesPagados = periodosJugador.filter((p) => p.estado === 'completo').length;
  const proximoVenc = useMemo(() => {
    if (!jugador) return null;
    const pendientes = periodosJugador.filter((p) => p.estado !== 'completo');
    if (pendientes.length > 0) {
      const first = pendientes.sort((a, b) => a.anio - b.anio || a.mes - b.mes)[0];
      return first.vencimiento || `${first.anio}-${String(first.mes).padStart(2, '0')}-05`;
    }
    return calcularProximoPago(jugador.ultimo_pago || null);
  }, [periodosJugador, jugador]);

  const estadoFin = useMemo(() => {
    if (!jugador) return null;
    return calcularEstadoFinanciero(jugador.ultimo_pago || null, proximoVenc, jugador.saldo_pendiente || 0);
  }, [jugador, proximoVenc]);

  const mensualidad = jugador ? (getMensualidad(jugador.categoria) || jugador.mensualidad || 50000) : 50000;

  // Stats superiores
  const totalJugadores = allJugadores?.filter((j: any) => j.activo).length || 0;
  const pagosMesActual = pagosJugador.filter((p) => {
    const d = new Date(p.fecha);
    const hoy = new Date();
    return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  }).length;
  const totalIngresosMes = pagosJugador.filter((p) => {
    const d = new Date(p.fecha);
    const hoy = new Date();
    return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  }).reduce((s, p) => s + (p.monto || 0), 0);

  const historialFiltrado = useMemo(() => {
    let list = [...pagosJugador].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    if (filtroConcepto) list = list.filter((p) => p.tipo === filtroConcepto || (p as any).concepto === filtroConcepto || (p.observacion || '').toLowerCase().includes(filtroConcepto.toLowerCase()));
    if (filtroEstado) list = list.filter((p) => p.estado_pago === filtroEstado);
    if (busquedaHistorial) {
      const q = busquedaHistorial.toLowerCase();
      list = list.filter((p) => (p as any).concepto?.toLowerCase().includes(q) || p.observacion?.toLowerCase().includes(q) || String(p.monto).includes(q));
    }
    return list;
  }, [pagosJugador, filtroConcepto, filtroEstado, busquedaHistorial]);

  const handleGuardarPago = async () => {
    if (!jugador) return;
    const montoNum = Number(monto) || 0;
    if (montoNum <= 0) { showError('El monto debe ser mayor a 0'); return; }
    if (saving) return;
    setSaving(true);
    try {
      const now = new Date();
      const mesBase = now.getMonth() + 1;
      const anioBase = now.getFullYear();
      let mesesCubiertos: { anio: number; mes: number }[] = [];
      if (aplicaVariosMeses && mesesCantidad > 1) {
        for (let i = 0; i < mesesCantidad; i++) {
          const totalOff = (mesBase - 1) + i;
          mesesCubiertos.push({ anio: anioBase + Math.floor(totalOff / 12), mes: (totalOff % 12) + 1 });
        }
      } else {
        mesesCubiertos = [{ anio: anioBase, mes: mesBase }];
      }
      await pagoService.create({
        jugador_id: jugador.id,
        monto: montoNum,
        fecha,
        tipo: aplicaVariosMeses && mesesCantidad > 1 ? 'adelantado' : montoNum < mensualidad ? 'abono' : 'completo',
        observacion: observacion || '',
        mes_pago: `${MESES[mesesCubiertos[0].mes - 1]} ${mesesCubiertos[0].anio}`,
        cantidad_meses: mesesCubiertos.length,
        meses_cubiertos: mesesCubiertos,
        metodo_pago: metodoPago,
      } as any);
      showSuccess('Pago registrado');
      setMonto(0);
      setObservacion('');
      setAplicaVariosMeses(false);
      setMesesCantidad(1);
      refetchPagos();
      refetchPeriodos();
    } catch (err: any) { showError(err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleLimpiar = () => {
    setMonto(0);
    setObservacion('');
    setConcepto('Mensualidad');
    setMetodoPago('Nequi');
    setAplicaVariosMeses(false);
    setMesesCantidad(1);
  };

  const handleAnular = async () => {
    if (!confirmAnular) return;
    try {
      await pagoService.anular({ pago_id: confirmAnular.id, motivo: 'Anulacion desde historial del jugador' });
      showSuccess('Pago anulado');
      setConfirmAnular(null);
      refetchPagos();
      refetchPeriodos();
    } catch (err: any) { showError(err.message); }
  };

  if (loadingJugadores || loadingPagos || loadingPeriodos) return <LoadingOverlay />;
  if (!jugador) return <ErrorState error="Jugador no encontrado" onRetry={() => navigate('/jugadores')} />;

  const edad = calcularEdad(jugador.fecha_nacimiento);
  const periodoExpand = monto ? expandirPagoMeses(Number(monto) || 0, mensualidad) : null;

  return (
    <div className="space-y-4">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      {/* Header jugador */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/jugadores')} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          <Icon name="izquierda" className="w-4 h-4" />
        </button>
        <div className="flex-1 bg-[#0F2942] border border-[#1E3A5F] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center text-white flex-shrink-0">
              <Icon name="usuario" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-white text-sm sm:text-base truncate">{jugador.nombre} {jugador.apellidos}</h1>
                <Badge variant={jugador.activo ? 'success' : 'danger'}>{jugador.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <p className="text-xs text-slate-400 truncate">CC: {jugador.numero_identificacion || '—'} &nbsp;|&nbsp; Categoria: {jugador.categoria}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 ml-auto">
            <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2 text-center min-w-[90px]">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1"><Icon name="usuarios" className="w-3 h-3" /> Jugadores</p>
              <p className="text-white font-bold text-sm">{totalJugadores}</p>
              <p className="text-[10px] text-slate-500">Activos en el sistema</p>
            </div>
            <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2 text-center min-w-[90px]">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1"><Icon name="verificar" className="w-3 h-3" /> Pagos del mes</p>
              <p className="text-white font-bold text-sm">{pagosMesActual}</p>
              <p className="text-[10px] text-slate-500">Registrados</p>
            </div>
            <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2 text-center min-w-[90px]">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1"><Icon name="calendario" className="w-3 h-3" /> Pendientes</p>
              <p className="text-white font-bold text-sm">{periodosJugador.filter((p) => p.estado !== 'completo').length}</p>
              <p className="text-[10px] text-slate-500">Registrados</p>
            </div>
            <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2 text-center min-w-[90px]">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1"><Icon name="dinero" className="w-3 h-3" /> Total ingresos (mes)</p>
              <p className="text-white font-bold text-sm">{formatCurrency(totalIngresosMes)}</p>
              <p className="text-[10px] text-[#22C55E]">↑ 12% vs mes anterior</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado financiero */}
      <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 flex items-center justify-center"><Icon name="alerta" className="w-3.5 h-3.5 text-[#22C55E]" /></div>
          <h2 className="text-sm font-bold text-white">Estado financiero</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="usuario" className="w-4 h-4 text-slate-400" /></div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500">Categoria</p>
              <p className="text-xs font-bold text-white truncate">{jugador.categoria}</p>
            </div>
          </div>
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="verificar" className="w-4 h-4 text-slate-400" /></div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500">Estado financiero</p>
              {estadoFin ? <Badge variant={estadoFin.color === 'green' ? 'success' : estadoFin.color === 'red' ? 'danger' : estadoFin.color === 'yellow' || estadoFin.color === 'amber' ? 'warning' : 'info'}>{estadoFin.label}</Badge> : <span className="text-xs text-slate-400">—</span>}
            </div>
          </div>
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="calendario" className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500">Fecha de inicio</p>
              <p className="text-xs font-bold text-white">{formatDate(jugador.fecha_ingreso)}</p>
            </div>
          </div>
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="dinero" className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500">Mensualidad</p>
              <p className="text-xs font-bold text-white">{formatCurrency(mensualidad)}</p>
            </div>
          </div>
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="grafica" className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500">Meses pagados</p>
              <p className="text-xs font-bold text-white">{mesesPagados} / 12</p>
            </div>
          </div>
          <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0"><Icon name="reloj" className="w-4 h-4 text-slate-400" /></div>
            <div>
              <p className="text-[10px] text-slate-500">Proximo vencimiento</p>
              <p className="text-xs font-bold text-white">{proximoVenc ? formatDate(proximoVenc) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Mensualidades por mes - timeline */}
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
              const per = periodosJugador.find((p) => p.mes === idx + 1);
              const pagado = per?.estado === 'completo';
              const abono = per?.estado === 'abono';
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{m}</span>
                  <div className={`w-full h-1.5 rounded-full ${pagado ? 'bg-[#22C55E]' : abono ? 'bg-amber-500' : 'bg-slate-700'}`} />
                  {abono && <span className="text-[8px] text-amber-400 font-bold">{formatCurrency(per!.pagado)}/{formatCurrency(per!.objetivo)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main: Registrar pago + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Registrar pago */}
        <div className="lg:col-span-2 bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 flex items-center justify-center"><Icon name="dinero" className="w-3.5 h-3.5 text-[#22C55E]" /></div>
            <h2 className="text-sm font-bold text-white">Registrar pago</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Completa la informacion del pago para el jugador</p>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Jugador *</label>
            <div className="w-full px-3 py-2 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-sm flex items-center gap-2">
              <Icon name="usuario" className="w-4 h-4 text-slate-500" />
              <span>{jugador.nombre} {jugador.apellidos}</span>
              <span className="ml-auto text-xs text-slate-500">{jugador.categoria}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Select label="Concepto *" value={concepto} onChange={(e) => setConcepto(e.target.value)}
              options={[{ value: 'Mensualidad', label: 'Mensualidad' }, { value: 'Inscripcion', label: 'Inscripcion' }, { value: 'Uniforme', label: 'Uniforme' }, { value: 'Otro', label: 'Otro' }]} />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
                <input type="number" min={0} value={monto === '' ? '' : String(monto)} onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#22C55E]" placeholder="0" />
              </div>
            </div>
            <Select label="Metodo de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}
              options={[{ value: 'Nequi', label: 'Nequi' }, { value: 'Efectivo', label: 'Efectivo' }, { value: 'Transferencia', label: 'Transferencia' }]} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de pago *</label>
              <div className="relative">
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2 flex-1">
                <input type="checkbox" checked={aplicaVariosMeses} onChange={(e) => setAplicaVariosMeses(e.target.checked)} className="accent-[#22C55E]" />
                Aplica a varios meses?
              </label>
              {aplicaVariosMeses && (
                <div className="flex items-center gap-1 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-2 py-1">
                  <button type="button" onClick={() => setMesesCantidad(Math.max(1, mesesCantidad - 1))} className="w-6 h-6 rounded bg-slate-700 text-white text-sm">-</button>
                  <span className="w-8 text-center text-sm text-white font-bold">{mesesCantidad}</span>
                  <button type="button" onClick={() => setMesesCantidad(mesesCantidad + 1)} className="w-6 h-6 rounded bg-slate-700 text-white text-sm">+</button>
                </div>
              )}
            </div>
          </div>

          {periodoExpand && (periodoExpand.mesesCompletos > 1 || periodoExpand.resto > 0) && (
            <div className="mt-2 text-xs text-slate-400 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
              Cubrira {periodoExpand.mesesCompletos} mes(es){periodoExpand.resto > 0 ? ` + abono ${formatCurrency(periodoExpand.resto)}` : ''} — {periodoExpand.detalle.map((d) => `${formatCurrency(d.pagado)} ${d.estado}`).join(' | ')}
            </div>
          )}

          <div className="mt-3">
            <Textarea label="Observacion (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={3} placeholder="Ej: Pago por mensualidad, uniforme, etc." />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={handleLimpiar}>Limpiar</Button>
            <Button onClick={handleGuardarPago} loading={saving}>Guardar pago</Button>
          </div>
        </div>

        {/* Right: Informacion del jugador */}
        <div className="space-y-4">
          <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center"><Icon name="usuario" className="w-3.5 h-3.5 text-slate-400" /></div>
              <h3 className="text-sm font-bold text-white">Informacion del jugador</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Icon name="usuario" className="w-3 h-3" /> Nombre</span>
                <span className="text-white font-medium">{jugador.nombre} {jugador.apellidos}</span>
              </div>
              <div className="flex justify-between bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Icon name="ver" className="w-3 h-3" /> Documento</span>
                <span className="text-white font-mono text-xs">{jugador.numero_identificacion || '—'}</span>
              </div>
              <div className="flex justify-between bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Icon name="usuarios" className="w-3 h-3" /> Categoria</span>
                <Badge variant="default">{jugador.categoria}</Badge>
              </div>
              <div className="flex justify-between bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
                <span className="text-slate-400 flex items-center gap-1.5"><Icon name="reloj" className="w-3 h-3" /> Estado financiero</span>
                {estadoFin ? <Badge variant={estadoFin.color === 'green' ? 'success' : estadoFin.color === 'red' ? 'danger' : 'warning'}>{estadoFin.label}</Badge> : <span className="text-slate-500">—</span>}
              </div>
              <div className="flex justify-between items-center bg-[#0B1F35] border border-[#1E3A5F] rounded-lg px-3 py-2">
                <span className="text-slate-400 text-xs">Edad</span>
                <span className="text-white text-xs">{edad}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Meses pagados</h3>
              <span className="text-xs font-bold text-slate-400">{mesesPagados} / 12</span>
            </div>
            <div className="w-full h-2 bg-[#0B1F35] border border-[#1E3A5F] rounded-full overflow-hidden">
              <div className="h-full bg-[#22C55E] rounded-full transition-all" style={{ width: `${Math.round((mesesPagados / 12) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="calendario" className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-white">Proximo vencimiento</h3>
            </div>
            <p className="text-lg font-bold text-white">{proximoVenc ? formatDate(proximoVenc) : '—'}</p>
            {estadoFin?.diasAtraso != null && <p className="text-xs text-red-400">{estadoFin.diasAtraso} dias de atraso</p>}
            {estadoFin?.diasFaltantes != null && <p className="text-xs text-yellow-400">Faltan {estadoFin.diasFaltantes} dias</p>}
          </div>
        </div>
      </div>

      {/* Historial de pagos del jugador */}
      <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 flex items-center justify-center"><Icon name="reloj" className="w-3.5 h-3.5 text-[#22C55E]" /></div>
            <h2 className="text-sm font-bold text-white">Historial de pagos del jugador</h2>
          </div>
          <div className="flex gap-2">
            <select value={filtroConcepto} onChange={(e) => setFiltroConcepto(e.target.value)} className="px-3 py-1.5 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-xs">
              <option value="">Todos los conceptos</option>
              <option value="Mensualidad">Mensualidad</option>
              <option value="Inscripcion">Inscripcion</option>
              <option value="Uniforme">Uniforme</option>
              <option value="Otro">Otro</option>
            </select>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-1.5 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-xs">
              <option value="">Todos los estados</option>
              <option value="completo">Pagado</option>
              <option value="abono">Abono</option>
            </select>
            <div className="relative">
              <input value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} placeholder="Buscar..."
                className="pl-7 pr-3 py-1.5 bg-[#0B1F35] border border-[#1E3A5F] rounded-lg text-white text-xs placeholder-slate-500 w-32" />
              <Icon name="ver" className="w-3 h-3 text-slate-500 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E3A5F] text-[11px] font-bold text-slate-500 uppercase">
                <th className="px-4 py-2.5 text-left">Fecha</th>
                <th className="px-4 py-2.5 text-left">Concepto</th>
                <th className="px-4 py-2.5 text-right">Monto</th>
                <th className="px-4 py-2.5 text-center">Meses</th>
                <th className="px-4 py-2.5 text-left">Metodo</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
                <th className="px-4 py-2.5 text-left">Observacion</th>
                <th className="px-4 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F]/50">
              {historialFiltrado.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">Sin pagos registrados</td></tr>
              ) : historialFiltrado.map((p) => (
                <tr key={p.id} className={`hover:bg-[#0B1F35]/50 ${p.anulado ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{formatDate(p.fecha)}</td>
                  <td className="px-4 py-3 text-slate-200">{p.tipo || 'Mensualidad'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{formatCurrency(p.monto)}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{p.cantidad_meses || 1}</td>
                  <td className="px-4 py-3 text-slate-400">{p.tipo}</td>
                  <td className="px-4 py-3 text-center">
                    {p.anulado ? <Badge variant="default">Anulado</Badge> : <Badge variant={p.estado_pago === 'completo' ? 'success' : p.estado_pago === 'abono' ? 'warning' : 'default'}>{p.estado_pago || p.tipo}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[150px] truncate">{p.observacion || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.anulado ? <span className="text-xs text-slate-500">—</span> : (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setConfirmAnular(p)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" title="Anular"><Icon name="eliminar" className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#1E3A5F] flex items-center justify-between">
          <span className="text-xs text-slate-500">Mostrando {historialFiltrado.length} registros</span>
        </div>
      </div>

      {/* Estado de cuenta */}
      <div className="bg-[#0F2942] border border-[#1E3A5F] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-[#22C55E]/20 flex items-center justify-center"><Icon name="grafica" className="w-3.5 h-3.5 text-[#22C55E]" /></div>
          <h2 className="text-sm font-bold text-white">Estado de cuenta</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(() => {
            const mensualidadCuenta = mensualidad;
            const totalMens = pagosJugador.filter((p) => p.tipo === 'completo' || p.tipo === 'abono').reduce((s, p) => s + (p.monto || 0), 0);
            const totalInsc = 30000;
            const totalUniforme = 80000;
            const totalOtro = pagosJugador.filter((p) => p.tipo === 'adelantado').reduce((s, p) => s + (p.monto || 0), 0) > totalMens ? pagosJugador.filter((p) => p.tipo === 'adelantado').reduce((s, p) => s + (p.monto || 0), 0) - totalMens : 0;
            const totalAdeudado = Math.max(0, periodosJugador.reduce((s, pe) => s + (pe.saldo || 0), 0));
            return (
              <>
                <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center"><Icon name="dinero" className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500">Mensualidad</p>
                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(mensualidadCuenta)}</p>
                  </div>
                </div>
                <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center"><Icon name="verificar" className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500">Inscripcion</p>
                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(totalInsc || 30000)}</p>
                  </div>
                </div>
                <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center"><Icon name="usuarios" className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500">Uniforme</p>
                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(totalUniforme || 80000)}</p>
                  </div>
                </div>
                <div className="bg-[#0B1F35] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center"><Icon name="grafica" className="w-4 h-4 text-slate-400" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500">Otro</p>
                    <p className="text-sm font-mono font-bold text-white">{formatCurrency(totalOtro)}</p>
                  </div>
                </div>
                <div className="bg-[#0B1F35] border border-[#22C55E]/30 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center"><Icon name="confirmar" className="w-4 h-4 text-white" /></div>
                  <div>
                    <p className="text-[10px] text-slate-500">Total adeudado</p>
                    <p className={`text-sm font-mono font-bold ${totalAdeudado > 0 ? 'text-red-400' : 'text-[#22C55E]'}`}>{formatCurrency(totalAdeudado)}</p>
                  </div>
                  <Link to={`/jugadores`} className="ml-auto text-xs text-[#22C55E] hover:text-[#16A34A] flex items-center gap-1">Ver detalle <Icon name="derecha" className="w-3 h-3" /></Link>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <ConfirmDialog isOpen={!!confirmAnular} onClose={() => setConfirmAnular(null)} onConfirm={handleAnular}
        title="Anular operacion" message={`¿Anular el pago de ${confirmAnular?.monto ? formatCurrency(confirmAnular.monto) : ''}?`} />
    </div>
  );
}
