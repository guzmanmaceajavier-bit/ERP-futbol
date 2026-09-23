import type { Jugador } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

interface JugadorDetailProps {
  jugador: Jugador;
}

export function JugadorDetail({ jugador }: JugadorDetailProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar nombre={`${jugador.nombre} ${jugador.apellidos}`} size="lg" />
        <div>
          <h2 className="text-xl font-bold text-white">{jugador.nombre} {jugador.apellidos}</h2>
          <p className="text-slate-400 text-sm">{jugador.categoria} · {jugador.genero}</p>
          <Badge variant={jugador.activo ? 'success' : 'danger'}>{jugador.activo ? 'Activo' : 'Inactivo'}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Telefono</p>
          <p className="text-white">{jugador.telefono || '-'}</p>
        </div>
        <div>
          <p className="text-slate-500">Fecha nacimiento</p>
          <p className="text-white">{formatDate(jugador.fecha_nacimiento || null)}</p>
        </div>
        <div>
          <p className="text-slate-500">Mensualidad</p>
          <p className="font-mono text-[#22C55E]">{formatCurrency(jugador.mensualidad || 0)}</p>
        </div>
        <div>
          <p className="text-slate-500">Saldo pendiente</p>
          <p className={`font-mono font-bold ${(jugador.saldo_pendiente || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {formatCurrency(jugador.saldo_pendiente || 0)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Categoria</p>
          <p className="text-white">{jugador.categoria || '-'}</p>
        </div>
        <div>
          <p className="text-slate-500">Acudiente</p>
          <p className="text-white">{jugador.acudiente_nombre || '-'} {jugador.acudiente_telefono ? `(${jugador.acudiente_telefono})` : ''}</p>
        </div>
      </div>
    </div>
  );
}
