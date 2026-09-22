import { useApi } from '../../hooks/useApi';
import { pagoService } from '../../services/pagoService';
import { notaService } from '../../services/notaService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/data/TableSkeleton';

interface JugadorHistorialProps {
  jugadorId: number;
}

export function JugadorHistorial({ jugadorId }: JugadorHistorialProps) {
  const { data: pagos, loading: loadingPagos } = useApi(() => pagoService.getAll());
  const { data: notas, loading: loadingNotas } = useApi(() => notaService.getAll(jugadorId));

  const pagosJugador = (pagos || []).filter((p: any) => p.jugador_id === jugadorId);

  if (loadingPagos || loadingNotas) return <TableSkeleton rows={3} cols={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-sport font-bold text-white mb-3">Historial de pagos</h3>
        {pagosJugador.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin pagos registrados</p>
        ) : (
          <div className="space-y-2">
            {pagosJugador.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white text-sm">{p.mes_pago || formatDate(p.fecha)}</p>
                  <p className="text-xs text-slate-400">{p.tipo}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[#22C55E]">{formatCurrency(p.monto)}</span>
                  <Badge variant={p.estado_pago === 'completo' ? 'success' : 'warning'}>{p.estado_pago || p.tipo}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-sport font-bold text-white mb-3">Notas</h3>
        {(!notas || notas.length === 0) ? (
          <p className="text-slate-500 text-sm">Sin notas</p>
        ) : (
          <div className="space-y-2">
            {notas.map((n: any) => (
              <div key={n.id} className="py-2 px-3 rounded-lg bg-slate-700/30">
                <p className="text-white text-sm">{n.nota}</p>
                <p className="text-xs text-slate-500 mt-1">{n.creador_nombre} · {formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
