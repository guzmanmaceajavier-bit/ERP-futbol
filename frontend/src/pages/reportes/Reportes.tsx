import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { reporteService } from '../../services/reporteService';
import { formatCurrency } from '../../utils/formatters';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ToastList } from '../../components/feedback/ToastList';
import { PageHeader } from '../../components/layout/PageHeader';
import { useMemo, useState } from 'react';
import { pagoService } from '../../services/pagoService';
import { gastoService } from '../../services/gastoService';

export function Reportes() {
  const [tab, setTab] = useState<'mes' | 'categoria' | 'cuenta' | 'caja'>('mes');
  const { data: porMes, loading: loadMes, error: errMes, refetch: refMes } = useApi(() => reporteService.getPorMes());
  const { data: porCat, loading: loadCat, error: errCat, refetch: refCat } = useApi(() => reporteService.getPorCategoria());
  const { data: cuenta, loading: loadCuenta, error: errCuenta, refetch: refCuenta } = useApi(() => reporteService.getEstadoCuenta());
  const { data: pagos } = useApi(() => pagoService.getAll());
  const { data: gastos } = useApi(() => gastoService.getAll());
  const { toasts, dismiss } = useToast();

  const loading = loadMes || loadCat || loadCuenta;
  const error = errMes || errCat || errCuenta;

  const cajaResumen = useMemo(() => {
    const totalIngresos = (pagos || []).reduce((s, p) => s + (Number(p.monto) || 0), 0);
    const totalGastos = (gastos || []).reduce((s, g) => s + (Number(g.monto) || 0), 0);
    const utilidad = totalIngresos - totalGastos;
    return { totalIngresos, totalGastos, utilidad, cntPagos: pagos?.length || 0, cntGastos: gastos?.length || 0 };
  }, [pagos, gastos]);

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error || ''} onRetry={() => { refMes(); refCat(); refCuenta(); }} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Reportes" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2 overflow-x-auto">
        {(['mes', 'categoria', 'cuenta', 'caja'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${tab === t ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-slate-400 hover:text-white'}`}>
            {t === 'mes' ? 'Por mes' : t === 'categoria' ? 'Por categoria' : t === 'cuenta' ? 'Estado de cuenta' : 'Resumen de caja'}
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

      {/* Caja / Inventario resumen (ingresos vs gastos) */}
      {tab === 'caja' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h3 className="font-sport font-bold text-white">Resumen de caja</h3>
          <p className="text-xs text-slate-400">Total ingresos (pagos) vs total gastos del periodo registrado. Utilidad = ingresos - gastos.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Total ingresos</p>
              <p className="font-mono text-lg font-bold text-green-400">{formatCurrency(cajaResumen.totalIngresos)}</p>
              <p className="text-xs text-slate-500 mt-1">{cajaResumen.cntPagos} pagos registrados</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Total gastos</p>
              <p className="font-mono text-lg font-bold text-red-400">{formatCurrency(cajaResumen.totalGastos)}</p>
              <p className="text-xs text-slate-500 mt-1">{cajaResumen.cntGastos} gastos registrados</p>
            </div>
            <div className={`bg-slate-900/60 border rounded-xl p-4 ${cajaResumen.utilidad >= 0 ? 'border-green-700/40' : 'border-red-700/40'}`}>
              <p className="text-xs text-slate-400">Utilidad</p>
              <p className={`font-mono text-lg font-bold ${cajaResumen.utilidad >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(cajaResumen.utilidad)}</p>
              <p className="text-xs text-slate-500 mt-1">Ingresos - Gastos</p>
            </div>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Ingresos</span><span>Gastos</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-700">
              {(() => {
                const total = Math.max(1, cajaResumen.totalIngresos + cajaResumen.totalGastos);
                const pctIng = (cajaResumen.totalIngresos / total) * 100;
                const pctGas = (cajaResumen.totalGastos / total) * 100;
                return (
                  <>
                    <div className="bg-green-600" style={{ width: `${pctIng}%` }} />
                    <div className="bg-red-600" style={{ width: `${pctGas}%` }} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
