import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { alertaService } from '../services/alertaService';
import { formatCurrency } from '../utils/formatters';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchBar } from '../components/data/SearchBar';
import { Pagination } from '../components/data/Pagination';
import { ToastList } from '../components/feedback/ToastList';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { ErrorState } from '../components/feedback/ErrorState';
import type { Alerta } from '../types';

export function Alertas() {
  const { data: alertas, loading, error, refetch } = useApi(() => alertaService.getAll());
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [busqueda, setBusqueda] = useState('');

  const busquedaDebounced = useDebounce(busqueda);
  const alertasFiltradas = (alertas || []).filter((a) =>
    !busquedaDebounced ||
    (a.titulo || a.nombre || '').toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    (a.categoria || '').toLowerCase().includes(busquedaDebounced.toLowerCase())
  );
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(alertasFiltradas);

  const handleDescartar = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'descartar', alerta_id: alerta.id });
      showSuccess('Alerta descartada');
      refetch();
    } catch (err: any) { showError(err.message); }
  };

  const handleRestaurar = async (alerta: Alerta) => {
    try {
      await alertaService.accion({ accion: 'restaurar', alerta_id: alerta.id });
      showSuccess('Alerta restaurada');
      refetch();
    } catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div>
        <h1 className="font-sport text-2xl font-bold text-white">Alertas</h1>
        <p className="text-slate-400 text-sm">{total} alertas</p>
      </div>

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar alerta..." />

      {alertasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <svg className="w-12 h-12 mx-auto text-slate-600 mt-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-slate-400 mt-4">No hay alertas pendientes</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginados.map((a, idx) => (
              <div key={a.id || idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    a.tipo_alerta === 'DEUDA' ? 'bg-red-500' : a.tipo_alerta === 'VENCIMIENTO' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-white font-medium">{a.titulo || a.nombre || `Alerta #${a.id}`}</p>
                    <p className="text-sm text-slate-400">
                      {a.categoria} | Deuda: {formatCurrency(a.deuda)} | {a.tipo}
                    </p>
                    {a.mensaje && <p className="text-xs text-slate-500 mt-1">{a.mensaje}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.descartada ? (
                    <Button variant="ghost" size="sm" onClick={() => handleRestaurar(a)}>Restaurar</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleDescartar(a)}>Descartar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}
    </div>
  );
}
