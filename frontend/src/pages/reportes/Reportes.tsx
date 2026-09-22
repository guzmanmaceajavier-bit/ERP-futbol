import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { reporteService } from '../../services/reporteService';
import { formatCurrency } from '../../utils/formatters';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ToastList } from '../../components/feedback/ToastList';
import { PageHeader } from '../../components/layout/PageHeader';
import { useState } from 'react';

export function Reportes() {
  const [tab, setTab] = useState<'mes' | 'categoria' | 'cuenta'>('mes');
  const { data: porMes, loading: loadMes, error: errMes, refetch: refMes } = useApi(() => reporteService.getPorMes());
  const { data: porCat, loading: loadCat, error: errCat, refetch: refCat } = useApi(() => reporteService.getPorCategoria());
  const { data: cuenta, loading: loadCuenta, error: errCuenta, refetch: refCuenta } = useApi(() => reporteService.getEstadoCuenta());
  const { toasts, dismiss } = useToast();

  const loading = loadMes || loadCat || loadCuenta;
  const error = errMes || errCat || errCuenta;

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error || ''} onRetry={() => { refMes(); refCat(); refCuenta(); }} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Reportes" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {(['mes', 'categoria', 'cuenta'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${tab === t ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-slate-400 hover:text-white'}`}>
            {t === 'mes' ? 'Por Mes' : t === 'categoria' ? 'Por Categoria' : 'Estado de Cuenta'}
          </button>
        ))}
      </div>

      {/* Recaudado por mes */}
      {tab === 'mes' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          {(!porMes || porMes.length === 0) ? (
            <p className="text-slate-500 text-center py-8">No hay datos de recaudacion</p>
          ) : (
            <div className="space-y-3">
              {porMes.map((r) => (
                <div key={r.mes} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-white">{r.mes}</span>
                  <div className="text-right">
                    <span className="font-mono text-[#22C55E]">{formatCurrency(r.total)}</span>
                    <span className="text-xs text-slate-400 ml-2">({r.cantidad} pagos)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Por categoria */}
      {tab === 'categoria' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          {(!porCat || porCat.length === 0) ? (
            <p className="text-slate-500 text-center py-8">No hay datos por categoria</p>
          ) : (
            <div className="space-y-3">
              {porCat.map((r) => (
                <div key={r.categoria} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-white">{r.categoria}</span>
                  <div className="text-right">
                    <span className="font-mono text-[#22C55E]">{formatCurrency(r.total)}</span>
                    {r.al_dia !== undefined && <span className="text-xs text-slate-400 ml-2">({r.al_dia} al dia)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estado de cuenta */}
      {tab === 'cuenta' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          {(!cuenta || cuenta.length === 0) ? (
            <p className="text-slate-500 text-center py-8">No hay datos de estado de cuenta</p>
          ) : (
            <div className="space-y-3">
              {cuenta.map((r) => (
                <div key={r.categoria} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-white">{r.categoria}</span>
                  <div className="text-right">
                    <span className="font-mono text-[#22C55E]">{formatCurrency(r.total)}</span>
                    <span className="text-xs text-slate-400 ml-2">{r.al_dia} al dia</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
