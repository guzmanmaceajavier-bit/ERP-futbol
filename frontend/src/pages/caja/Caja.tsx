import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { cajaService } from '../../services/cajaService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { NumberInput } from '../../components/ui/NumberInput';
import { FormModal } from '../../components/forms/FormModal';
import { ToastList } from '../../components/feedback/ToastList';
import { Icon } from '../../components/ui/Icon';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';

export function Caja() {
  const { data: resumen, loading, error, refetch } = useApi(() => cajaService.getResumen());
  const { isOpen, openNew, close } = useModal();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [saldoContado, setSaldoContado] = useState(0);
  const [showCerrar, setShowCerrar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const saldoSistema = resumen?.saldo_sistema ?? resumen?.saldo ?? 0;
  const diferencia = saldoContado - saldoSistema;

  const handleAccion = async (accion: string) => {
    setSaving(true);
    try {
      await cajaService.accion({
        accion: accion as any,
        saldo_inicial: accion === 'abrir' ? saldoInicial : undefined,
        saldo_contado: accion === 'cerrar' ? saldoContado : undefined,
        motivo: accion === 'desbloquear' ? motivo : undefined,
      });
      showSuccess(`Caja ${accion} correctamente`);
      close();
      setShowCerrar(false);
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
      <PageHeader title="Caja" subtitle={resumen?.fecha ? `Resumen del dia ${formatDate(resumen.fecha)}` : 'Control diario de ingresos y egresos'} />

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
            <p className="text-xs text-slate-400">Saldo sistema</p>
            <p className="font-mono text-lg text-[#22C55E] font-bold">{formatCurrency(saldoSistema)}</p>
          </div>
        </div>

        {/* Caja state with more info */}
        {resumen?.caja && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/50 border border-slate-700 rounded-xl p-3">
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Estado</p>
              <p className="text-sm font-bold text-white capitalize">{resumen.caja.estado || resumen.estado}</p>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Hora apertura</p>
              <p className="text-sm font-mono text-slate-300">{resumen.caja.hora_apertura || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Hora cierre</p>
              <p className="text-sm font-mono text-slate-300">{resumen.caja.hora_cierre || '-'}</p>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Saldo contado</p>
              <p className="text-sm font-mono text-slate-300">{resumen.caja.saldo_contado != null ? formatCurrency(resumen.caja.saldo_contado) : '-'}</p>
              {resumen.caja.diferencia != null && (
                <p className={`text-xs font-bold ${resumen.caja.diferencia === 0 ? 'text-[#22C55E]' : 'text-amber-400'}`}>Diferencia: {formatCurrency(resumen.caja.diferencia)}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {resumen?.estado !== 'abierta' ? (
            <Button onClick={() => { setSaldoInicial(0); openNew(); }}>Apertura de caja</Button>
          ) : (
            <>
              <Button variant="danger" onClick={() => { setSaldoContado(saldoSistema); setShowCerrar(true); }} loading={saving}>Cierre de caja</Button>
              <Button variant="ghost" onClick={() => { setMotivo(''); handleAccion('desbloquear'); }}>Reabrir caja</Button>
            </>
          )}
        </div>
      </div>

      {/* Abrir caja modal */}
      <FormModal isOpen={isOpen} onClose={close} title="Apertura de caja">
        <div className="space-y-4">
          <NumberInput label="Saldo inicial" value={saldoInicial} onChange={(v) => setSaldoInicial(v === '' ? 0 : v)} min={0} placeholder="0" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={() => handleAccion('abrir')} loading={saving}>Confirmar apertura</Button>
        </div>
      </FormModal>

      {/* Cerrar caja modal */}
      <FormModal isOpen={showCerrar} onClose={() => setShowCerrar(false)} title="Cierre de caja">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-900/50 border border-slate-700 rounded-xl p-3">
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Saldo sistema</p>
              <p className="font-mono text-lg text-[#22C55E] font-bold">{formatCurrency(saldoSistema)}</p>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase">Saldo contado</p>
              <p className="font-mono text-lg text-white font-bold">{formatCurrency(saldoContado)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] font-black text-slate-500 uppercase">Diferencia</p>
              <p className={`font-mono text-sm font-bold ${diferencia === 0 ? 'text-[#22C55E]' : diferencia > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {formatCurrency(diferencia)} {diferencia === 0 ? '(cuadrado)' : diferencia > 0 ? '(sobrante)' : '(faltante)'}
              </p>
            </div>
          </div>
          <NumberInput label="Saldo contado *" value={saldoContado} onChange={(v) => setSaldoContado(v === '' ? 0 : v)} min={0} placeholder="0" />
          <p className="text-[11px] text-slate-500">Ingresa el efectivo contado fisicamente para comparar con el saldo del sistema.</p>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={() => setShowCerrar(false)}>Cancelar</Button>
          <Button variant="danger" onClick={() => handleAccion('cerrar')} loading={saving}>Confirmar cierre</Button>
        </div>
      </FormModal>
    </div>
  );
}
