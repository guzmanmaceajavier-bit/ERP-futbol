import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { bitacoraService } from '../../services/bitacoraService';
import { formatDateTime } from '../../utils/formatters';
import { PageHeader } from '../../components/layout/PageHeader';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Icon } from '../../components/ui/Icon';

function prettyValue(v: string | null | undefined): string {
  if (!v) return '';
  try {
    const parsed = JSON.parse(v);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return v;
  }
}

export function Bitacora() {
  const { data: entradas, loading, error, refetch } = useApi(() => bitacoraService.getAll());
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const busquedaDebounced = useDebounce(busqueda);

  const modulosUnicos = useMemo(() => {
    const s = new Set<string>();
    (entradas || []).forEach(e => { if (e.modulo) s.add(e.modulo); });
    return Array.from(s).sort();
  }, [entradas]);

  const accionesUnicas = useMemo(() => {
    const s = new Set<string>();
    (entradas || []).forEach(e => { if (e.accion) s.add(String(e.accion)); });
    return Array.from(s).sort();
  }, [entradas]);

  const entradasFiltradas = (entradas || []).filter((e) => {
    const matchBusqueda = !busquedaDebounced ||
      e.usuario_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      e.modulo?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      e.accion?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
      e.detalle?.toLowerCase().includes(busquedaDebounced.toLowerCase());
    const matchModulo = !filtroModulo || e.modulo === filtroModulo;
    const matchAccion = !filtroAccion || String(e.accion) === filtroAccion;
    return matchBusqueda && matchModulo && matchAccion;
  });
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(entradasFiltradas);

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Bitacora" />

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por usuario, modulo o accion..." />

      {/* Filtros por modulo / accion */}
      <div className="flex flex-wrap gap-3">
        <select value={filtroModulo} onChange={e => { setFiltroModulo(e.target.value); setPagina(1); setExpanded(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]">
          <option value="">Todos los modulos</option>
          {modulosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtroAccion} onChange={e => { setFiltroAccion(e.target.value); setPagina(1); setExpanded(null); }} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]">
          <option value="">Todas las acciones</option>
          {accionesUnicas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(filtroModulo || filtroAccion) && (
          <button onClick={() => { setFiltroModulo(''); setFiltroAccion(''); setPagina(1); }} className="text-sm text-slate-400 hover:text-white px-2">Limpiar filtros</button>
        )}
        <span className="text-xs text-slate-500 self-center ml-auto">{entradasFiltradas.length} registros</span>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {entradasFiltradas.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No hay registros en la bitacora</p>
        ) : (
          <>
            <div className="divide-y divide-slate-700/50">
              {paginados.map((e, idx) => {
                const globalIdx = idx;
                const isExpanded = expanded === globalIdx;
                const hasDetail = !!(e.antes || e.despues || e.motivo || e.detalle);
                return (
                  <div key={e.id || idx} className={`px-5 py-3 transition-colors ${isExpanded ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'} ${hasDetail ? 'cursor-pointer' : ''}`} onClick={() => hasDetail && setExpanded(isExpanded ? null : globalIdx)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <Icon name="reloj" className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm">
                            <span className="font-medium">{e.usuario_nombre}</span>
                            {' '} <span className="text-slate-400">{e.accion?.toLowerCase()}</span> en <span className="text-[#22C55E]">{e.modulo}</span>
                            {hasDetail && <span className="ml-2 text-xs text-slate-500">{isExpanded ? '▲' : '▼'}</span>}
                          </p>
                          {e.detalle && <p className={`text-xs text-slate-500 ${isExpanded ? '' : 'truncate'}`}>{e.detalle}</p>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">{formatDateTime(e.fecha)}</span>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 ml-11 space-y-2 text-xs" onClick={ev => ev.stopPropagation()}>
                        {e.motivo && (
                          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2">
                            <p className="text-amber-400 font-medium mb-1">Motivo</p>
                            <p className="text-slate-300 whitespace-pre-wrap break-words">{e.motivo}</p>
                          </div>
                        )}
                        {(e.antes || e.despues) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {e.antes && (
                              <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                                <p className="text-slate-400 font-medium mb-1">Antes</p>
                                <pre className="text-slate-300 whitespace-pre-wrap break-words font-mono text-[11px] max-h-40 overflow-auto">{prettyValue(e.antes)}</pre>
                              </div>
                            )}
                            {e.despues && (
                              <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                                <p className="text-slate-400 font-medium mb-1">Despues</p>
                                <pre className="text-slate-300 whitespace-pre-wrap break-words font-mono text-[11px] max-h-40 overflow-auto">{prettyValue(e.despues)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                        {!e.motivo && !e.antes && !e.despues && e.detalle && (
                          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                            <p className="text-slate-300 whitespace-pre-wrap break-words">{e.detalle}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
              onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
          </>
        )}
      </div>
    </div>
  );
}
