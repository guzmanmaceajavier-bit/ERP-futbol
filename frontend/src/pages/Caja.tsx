import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { useToast } from '../hooks/useToast';
import { cajaService } from '../services/cajaService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { FormModal } from '../components/forms/FormModal';
import { ToastList } from '../components/feedback/ToastList';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { ErrorState } from '../components/feedback/ErrorState';

export function Caja() {
  const { data: resumen, loading, error, refetch } = useApi(() => cajaService.getResumen());
  const { isOpen, openNew, close } = useModal();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAccion = async (accion: string) => {
    setSaving(true);
    try {
      await cajaService.accion({
        accion: accion as any,
        saldo_inicial: accion === 'abrir' ? saldoInicial : undefined,
        motivo: accion === 'desbloquear' ? motivo : undefined,
      });
      showSuccess(`Caja ${accion} correctamente`);
      close();
      refetch();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <h1 className="font-sport text-2xl font-bold text-white">Caja</h1>

      {/* Resumen del dia */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sport font-bold text-white text-lg">Resumen del dia</h2>
          <Badge variant={resumen?.estado === 'abierta' ? 'success' : 'danger'}>
            {resumen?.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Saldo inicial</p>
            <p className="font-mono text-lg text-white">{formatCurrency(resumen?.caja?.saldo_inicial || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Ingresos ({resumen?.ingresos?.cnt || 0})</p>
            <p className="font-mono text-lg text-green-400">{formatCurrency(resumen?.ingresos?.total || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Gastos ({resumen?.gastos?.cnt || 0})</p>
            <p className="font-mono text-lg text-red-400">{formatCurrency(resumen?.gastos?.total || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Saldo final</p>
            <p className="font-mono text-lg text-[#22C55E] font-bold">{formatCurrency(resumen?.saldo || 0)}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {resumen?.estado !== 'abierta' ? (
            <Button onClick={() => { setSaldoInicial(0); openNew(); }}>Abrir Caja</Button>
          ) : (
            <>
              <Button variant="danger" onClick={() => handleAccion('cerrar')} loading={saving}>Cerrar Caja</Button>
              <Button variant="ghost" onClick={() => { setMotivo(''); handleAccion('desbloquear'); }}>Desbloquear</Button>
            </>
          )}
        </div>
      </div>

      {/* Abrir caja modal */}
      <FormModal isOpen={isOpen} onClose={close} title="Abrir Caja">
        <div className="space-y-4">
          <Input label="Saldo inicial" type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(Number(e.target.value))} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={() => handleAccion('abrir')} loading={saving}>Abrir</Button>
        </div>
      </FormModal>
    </div>
  );
}
