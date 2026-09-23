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
import { FormModal } from '../../components/forms/FormModal';
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
  const [gestionar, setGestionar] = useState<Alerta | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
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

  const categorias = useMemo(() => [...new Set(lista.map((a) => a.categoria).filter(Boolean))], [lista]);

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
          (a.estado_cobranza || '').toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [lista, filtro, categoriaFiltro, busquedaDebounced]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(alertasFiltradas);

  const handleAction = async (alerta: Alerta, accion: string, successMsg: string) => {
    try {
      await alertaService.accion({ accion: accion as any, alerta_id: alerta.id });
      showSuccess(successMsg);
      refetch();
      if (gestionar && gestionar.id === alerta.id) {
        // update local gestionar state to reflect new status
        const updated = lista.find((a) => a.id === alerta.id);
        if (updated) setGestionar({ ...updated, estado_cobranza: accion === 'descartar' ? 'descartada' as any : accion as any } as Alerta);
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Periodo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Saldo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Seguimiento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ultimo contacto</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginados.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            a.tipo_alerta === 'DEUDA' ? 'bg-red-500' : a.tipo_alerta === 'VENCIMIENTO' ? 'bg-yellow-500' : a.tipo_alerta === 'ABONO' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-white text-sm font-medium truncate">{a.jugador_nombre || a.titulo || a.nombre || `Seguimiento #${a.id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{a.categoria || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{a.periodo || a.mes_abono || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold text-[#22C55E]">{formatCurrency(a.deuda || 0)}</td>
                      <td className="px-4 py-3">
                        {a.estado_cobranza ? <Badge variant={estadoVariant(a.estado_cobranza)}>{ESTADO_LABELS[a.estado_cobranza] || a.estado_cobranza}</Badge> : <span className="text-slate-500 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{a.ultimo_contacto || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" onClick={() => setGestionar(a)}>Gestionar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}

      {gestionar && (
        <FormModal
          isOpen={!!gestionar}
          onClose={() => setGestionar(null)}
          title="Gestion de cobranza"
          wide
        >
          <div className="space-y-5">
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  gestionar.tipo_alerta === 'DEUDA' ? 'bg-red-500' : gestionar.tipo_alerta === 'ABONO' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <h3 className="text-white font-bold">{gestionar.jugador_nombre || gestionar.titulo || gestionar.nombre}</h3>
                <Badge variant={estadoVariant(gestionar.estado_cobranza)}>{ESTADO_LABELS[gestionar.estado_cobranza || ''] || gestionar.estado_cobranza || 'Pendiente'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase">Categoria</p>
                  <p className="text-white">{gestionar.categoria || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Periodo</p>
                  <p className="text-white">{gestionar.periodo || gestionar.mes_abono || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Saldo pendiente</p>
                  <p className="font-mono text-[#22C55E] font-bold">{formatCurrency(gestionar.deuda || 0)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Vencimiento</p>
                  <p className="text-white">{gestionar.vencimiento || gestionar.fecha_vencimiento || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Estado</p>
                  <p className="text-white">{ESTADO_LABELS[gestionar.estado_cobranza || ''] || gestionar.estado_cobranza || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase">Ultimo contacto</p>
                  <p className="text-white">{gestionar.ultimo_contacto || '—'}</p>
                </div>
                {(gestionar.pagado || 0) > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Pagado</p>
                    <p className="text-yellow-400 font-mono">{formatCurrency(gestionar.pagado || 0)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleAction(gestionar, 'contactado', 'Contacto registrado')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-left"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-2C9.716 21 3 14.284 3 6V5z" /></svg>
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Registrar contacto</p>
                  <p className="text-xs text-slate-500">Marca que ya se intento contacto</p>
                </div>
              </button>

              <button
                onClick={() => handleAction(gestionar, 'prometio_pagar', 'Compromiso de pago registrado')}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-left"
              >
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">Registrar compromiso</p>
                  <p className="text-xs text-slate-500">El acudiente prometio pagar</p>
                </div>
              </button>

              <button
                onClick={() => { setGestionar(null); navigate('/pagos'); }}
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

              {(() => {
                const waLink = buildWhatsappLink(gestionar);
                return waLink ? (
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
                      <p className="text-xs text-slate-500">Sin telefono registrado</p>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={() => {
                  const alerta = gestionar;
                  setGestionar(null);
                  if (alerta.descartada) handleAction(alerta, 'restaurar', 'Seguimiento reactivado');
                  else handleAction(alerta, 'descartar', 'Seguimiento archivado');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-700/30 transition-all text-left"
              >
                <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{gestionar.descartada ? 'Reactivar seguimiento' : 'Archivar seguimiento'}</p>
                  <p className="text-xs text-slate-500">{gestionar.descartada ? 'Volver a mostrar en el listado' : 'Ocultar sin eliminar la deuda'}</p>
                </div>
              </button>
            </div>

            {gestionar.ultimo_contacto && (
              <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-2">Historial de seguimiento</h4>
                <div className="space-y-1 text-sm text-slate-400">
                  <p>Ultimo contacto: <span className="text-slate-300">{gestionar.ultimo_contacto}</span></p>
                  <p>Estado actual: <Badge variant={estadoVariant(gestionar.estado_cobranza)}>{ESTADO_LABELS[gestionar.estado_cobranza || ''] || gestionar.estado_cobranza}</Badge></p>
                  {gestionar.mensaje && <p className="text-xs text-slate-500 mt-2">{gestionar.mensaje}</p>}
                </div>
              </div>
            )}

            {gestionar.jugador_id != null && (
              <Button variant="ghost" onClick={() => { setGestionar(null); navigate('/jugadores'); }} className="w-full">
                Ver ficha de {gestionar.jugador_nombre || 'jugador'}
              </Button>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={() => setGestionar(null)}>Cerrar</Button>
          </div>
        </FormModal>
      )}
    </div>
  );
}
