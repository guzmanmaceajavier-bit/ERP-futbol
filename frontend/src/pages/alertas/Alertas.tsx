import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { alertaService } from '../../services/alertaService';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/dashboard/KPICard';
import { PageHeader } from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import type { Alerta } from '../../types';

type Filtro = 'todos' | 'deuda' | 'abono' | 'contactado' | 'prometio_pagar' | 'pagado';

const FILTRO_LABELS: Record<Filtro, string> = {
  todos: 'Todos',
  deuda: 'Pendiente',
  abono: 'Abonos',
  contactado: 'Contacto realizado',
  prometio_pagar: 'Compromiso de pago',
  pagado: 'Pagado',
};

const ESTADO_LABELS: Record<string, string> = {
  deuda: 'Pendiente',
  contactado: 'Contacto realizado',
  prometio_pagar: 'Compromiso de pago',
  pagado: 'Pagado',
  descartada: 'Archivado',
};

function estadoVariant(estado: string | undefined): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  switch (estado) {
    case 'deuda': return 'danger';
    case 'contactado': return 'info';
    case 'prometio_pagar': return 'warning';
    case 'pagado': return 'success';
    case 'descartada': return 'default';
    default: return 'default';
  }
}

export function Alertas() {
  const { data: alertas, loading, error, refetch } = useApi(() => alertaService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const navigate = useNavigate();

  const busquedaDebounced = useDebounce(busqueda);

  const lista = alertas || [];

  const deudores = useMemo(() => lista.filter((a) => a.estado_cobranza === 'deuda').length, [lista]);
  const deudaTotal = useMemo(
    () => lista.filter((a) => a.estado_cobranza === 'deuda').reduce((s, a) => s + (a.deuda || 0), 0),
    [lista],
  );
  const abonos = useMemo(
    () => lista.filter((a) => a.tipo_alerta === 'ABONO' || (a.estado_cobranza === 'deuda' && (a.pagado || 0) > 0)).length,
    [lista],
  );
  const contactados = useMemo(() => lista.filter((a) => a.estado_cobranza === 'contactado').length, [lista]);

  const handleFiltroChange = (next: Filtro) => {
    setFiltro(next);
  };

  const alertasFiltradas = useMemo(() => {
    let filtered = lista;
    if (filtro !== 'todos') {
      if (filtro === 'abono') {
        filtered = filtered.filter((a) => a.tipo_alerta === 'ABONO');
      } else {
        filtered = filtered.filter((a) => a.estado_cobranza === filtro);
      }
    }
    const q = busquedaDebounced.toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          (a.titulo || a.nombre || '').toLowerCase().includes(q) ||
          (a.categoria || '').toLowerCase().includes(q) ||
          (a.jugador_nombre || '').toLowerCase().includes(q) ||
          (a.periodo || '').toLowerCase().includes(q) ||
          (a.estado_cobranza || '').toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [lista, filtro, busquedaDebounced]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(alertasFiltradas);

  const handleDescartar = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'descartar', alerta_id: alerta.id });
      showSuccess('Seguimiento archivado');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  };

  const handleRestaurar = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'restaurar', alerta_id: alerta.id });
      showSuccess('Seguimiento reactivado');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  };

  const handleContactado = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'contactado', alerta_id: alerta.id });
      showSuccess('Contacto registrado');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  };

  const handlePrometioPagar = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'prometio_pagar', alerta_id: alerta.id });
      showSuccess('Compromiso de pago registrado');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  };

  const handleCobrar = () => {
    navigate('/pagos');
  };

  const handleVerJugador = (alerta: Alerta) => {
    if (alerta.jugador_id) {
      navigate('/jugadores');
    } else {
      navigate('/jugadores');
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

  const filtros: Filtro[] = ['todos', 'deuda', 'abono', 'contactado', 'prometio_pagar', 'pagado'];

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Cobranzas"
        subtitle={`${deudores} pendientes · ${formatCurrency(deudaTotal)} por cobrar · ${total} seguimientos`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Pendientes"
          value={deudores}
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
          label="Contactos realizados"
          value={contactados}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-2C9.716 21 3 14.284 3 6V5z" /></svg>}
          color="bg-blue-600"
        />
      </div>

      <SearchBar value={busqueda} onChange={(v) => { setBusqueda(v); setPagina(1); }} placeholder="Buscar por jugador, categoria, periodo..." />

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
          <div className="space-y-3">
            {paginados.map((a, idx) => {
              const waLink = buildWhatsappLink(a);
              return (
                <div key={a.id || idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                      a.tipo_alerta === 'DEUDA' ? 'bg-red-500' : a.tipo_alerta === 'VENCIMIENTO' ? 'bg-yellow-500' : a.tipo_alerta === 'ABONO' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-white font-medium truncate">{a.jugador_nombre || a.titulo || a.nombre || `Seguimiento #${a.id}`}</p>
                        {a.estado_cobranza && (
                          <Badge variant={estadoVariant(a.estado_cobranza)}>{ESTADO_LABELS[a.estado_cobranza] || a.estado_cobranza}</Badge>
                        )}
                        <span className="text-slate-500 text-xs">{a.tipo_alerta || a.tipo}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {a.periodo && <span>Periodo: <span className="text-slate-300">{a.periodo}</span></span>}
                        {a.mes_abono && !a.periodo && <span>Mes abono: <span className="text-slate-300">{a.mes_abono}</span></span>}
                        {(a.vencimiento || a.fecha_vencimiento) && <span>Vence: <span className="text-slate-300">{a.vencimiento || a.fecha_vencimiento}</span></span>}
                        {a.categoria && <span>{a.categoria}</span>}
                        <span className="font-mono text-[#22C55E] font-bold">Pendiente: {formatCurrency(a.deuda || 0)}</span>
                        {(a.pagado || 0) > 0 && <span className="text-yellow-400">Pagado: {formatCurrency(a.pagado || 0)}</span>}
                      </p>
                      {a.ultimo_contacto && <p className="text-xs text-slate-500 mt-1">Ultimo contacto: {a.ultimo_contacto}</p>}
                      {a.mensaje && <p className="text-xs text-slate-500 mt-1 truncate">{a.mensaje}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    {a.descartada ? (
                      <Button variant="ghost" size="sm" onClick={() => handleRestaurar(a)}>Reactivar seguimiento</Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleDescartar(a)}>Archivar seguimiento</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleContactado(a)}>Registrar contacto</Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePrometioPagar(a)}>Registrar compromiso</Button>
                    <Button size="sm" onClick={handleCobrar}>Registrar pago</Button>
                    {waLink ? (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                        Contactar por WhatsApp
                      </a>
                    ) : (
                      <Button variant="ghost" size="sm" disabled title="Sin telefono">Contactar por WhatsApp</Button>
                    )}
                    {a.jugador_id != null && (
                      <Button variant="ghost" size="sm" onClick={() => handleVerJugador(a)}>Ver ficha</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}
    </div>
  );
}
