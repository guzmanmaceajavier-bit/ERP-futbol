import type { Pago } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';

interface PagoDetailProps {
  pago: Pago;
}

export function PagoDetail({ pago }: PagoDetailProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{pago.jugador || `Pago #${pago.id}`}</h2>
        <Badge variant={pago.estado_pago === 'completo' ? 'success' : pago.estado_pago === 'abono' ? 'warning' : 'default'}>
          {pago.tipo}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Monto</p>
          <p className="font-mono text-[#22C55E] font-bold text-lg">{formatCurrency(pago.monto)}</p>
        </div>
        <div>
          <p className="text-slate-500">Fecha</p>
          <p className="text-white">{formatDate(pago.fecha)}</p>
        </div>
        <div>
          <p className="text-slate-500">Mes</p>
          <p className="text-white">{pago.mes_pago || '-'}</p>
        </div>
        <div>
          <p className="text-slate-500">Recibo</p>
          <p className="text-white font-mono">{pago.recibo_numero || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-500">Observacion</p>
          <p className="text-white">{pago.observacion || '-'}</p>
        </div>
      </div>
    </div>
  );
}
