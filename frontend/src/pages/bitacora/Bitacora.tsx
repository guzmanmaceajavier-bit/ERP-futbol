import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { bitacoraService } from '../../services/bitacoraService';
import { formatDateTime } from '../../utils/formatters';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';

export function Bitacora() {
  const { data: entradas, loading, error, refetch } = useApi(() => bitacoraService.getAll());
  const [busqueda, setBusqueda] = useState('');

  const busquedaDebounced = useDebounce(busqueda);
  const entradasFiltradas = (entradas || []).filter((e) =>
    !busquedaDebounced ||
    e.usuario_nombre?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    e.modulo?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    e.accion?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(entradasFiltradas);

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sport text-2xl font-bold text-white">Bitacora</h1>
        <p className="text-slate-400 text-sm">{total} registros</p>
      </div>

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por usuario, modulo o accion..." />

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {entradasFiltradas.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No hay registros en la bitacora</p>
        ) : (
          <>
            <div className="divide-y divide-slate-700/50">
              {paginados.map((e, idx) => (
                <div key={e.id || idx} className="px-5 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-medium">{e.usuario_nombre}</span>
                          {' '} <span className="text-slate-400">{e.accion?.toLowerCase()}</span> en <span className="text-[#22C55E]">{e.modulo}</span>
                        </p>
                        {e.detalle && <p className="text-xs text-slate-500 truncate">{e.detalle}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">{formatDateTime(e.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
              onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
          </>
        )}
      </div>
    </div>
  );
}
