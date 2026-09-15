import { useState, useEffect } from 'react';
import { periodoService } from '../../services/periodoService';
import type { PeriodoMensual } from '../../types';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  jugadorId: number;
  anio?: number;
  onRefresh?: () => void;
}

export function PeriodoGrid({ jugadorId, anio, onRefresh }: Props) {
  const [periodos, setPeriodos] = useState<PeriodoMensual[]>([]);
  const [loading, setLoading] = useState(true);

  const anioActual = anio || new Date().getFullYear();

  useEffect(() => {
    loadPeriodos();
  }, [jugadorId, anioActual]);

  const loadPeriodos = async () => {
    setLoading(true);
    try {
      const data = await periodoService.getAll({ jugador_id: jugadorId, anio: anioActual });
      setPeriodos(data);
    } catch {
      setPeriodos([]);
    }
    setLoading(false);
  };

  const getPeriodo = (mes: number) => periodos.find(p => p.mes === mes);

  const getEstadoStyle = (estado: string, pagado: number, objetivo: number) => {
    switch (estado) {
      case 'completo': return 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E]';
      case 'beca': return 'bg-purple-500/20 border-purple-500/40 text-purple-400';
      case 'abono': return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      default: return 'bg-slate-700/50 border-slate-600 text-slate-400';
    }
  };

  const getIcon = (estado: string) => {
    switch (estado) {
      case 'completo': return '✓';
      case 'beca': return '★';
      case 'abono': return '◐';
      default: return '○';
    }
  };

  if (loading) return <div className="text-xs text-slate-500">Cargando periodos...</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-slate-500 uppercase">Periodos {anioActual}</p>
        <button onClick={loadPeriodos} className="text-[10px] text-slate-500 hover:text-white transition-colors">Actualizar</button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
        {MESES.map((nombre, idx) => {
          const mes = idx + 1;
          const p = getPeriodo(mes);
          const estado = p?.estado || 'pendiente';
          const pagado = p?.pagado || 0;
          const objetivo = p?.objetivo || 0;
          const style = getEstadoStyle(estado, pagado, objetivo);

          return (
            <div key={mes} className={`rounded-lg border p-1.5 text-center transition-all ${style}`} title={`${MESES_COMPLETOS[idx]}: ${pagado.toLocaleString()} / ${objetivo.toLocaleString()}`}>
              <p className="text-[10px] font-bold">{nombre}</p>
              <p className="text-lg leading-none">{getIcon(estado)}</p>
              {estado === 'abono' && objetivo > 0 && (
                <div className="w-full bg-slate-900/50 rounded-full h-1 mt-1">
                  <div className="bg-amber-400 h-1 rounded-full" style={{ width: `${Math.min(100, (pagado / objetivo) * 100)}%` }} />
                </div>
              )}
              {objetivo > 0 && (
                <p className="text-[8px] mt-0.5 opacity-70">${(pagado / 1000).toFixed(0)}k/{(objetivo / 1000).toFixed(0)}k</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
