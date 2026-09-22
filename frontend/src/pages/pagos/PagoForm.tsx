import type { Jugador } from '../../types';
import { CATEGORIAS, MESES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface PagoFormProps {
  jugadores: Jugador[];
  jugadorSeleccionado: Jugador | null;
  busquedaJugador: string;
  filtroCatForm: string;
  monto: number;
  fecha: string;
  tipoPago: 'no' | 'abono' | 'si';
  concepto: string;
  conceptoOtro: string;
  medioPago: string;
  observacion: string;
  mesesSeleccionados: { anio: number; mes: number }[];
  editingPago: import('../../types').Pago | null;
  saving: boolean;
  onBusquedaJugador: (v: string) => void;
  onFiltroCatForm: (v: string) => void;
  onSelectJugador: (j: Jugador) => void;
  onClearJugador: () => void;
  onMonto: (v: number) => void;
  onFecha: (v: string) => void;
  onTipoPago: (v: 'no' | 'abono' | 'si') => void;
  onConcepto: (v: string) => void;
  onConceptoOtro: (v: string) => void;
  onMedioPago: (v: string) => void;
  onObservacion: (v: string) => void;
  onMeses: (v: { anio: number; mes: number }[]) => void;
  onGuardar: () => void;
  onReset: () => void;
}

export function PagoForm(props: PagoFormProps) {
  const {
    jugadores, jugadorSeleccionado, busquedaJugador, filtroCatForm, monto, fecha,
    tipoPago, concepto, conceptoOtro, medioPago, observacion, mesesSeleccionados,
    editingPago, saving,
    onBusquedaJugador, onFiltroCatForm, onSelectJugador, onClearJugador,
    onMonto, onFecha, onTipoPago, onConcepto, onConceptoOtro, onMedioPago, onObservacion,
    onMeses, onGuardar, onReset,
  } = props;

  const jugadoresGrid = jugadores.filter((j) => {
    if (!j.activo) return false;
    const matchCat = !filtroCatForm || j.categoria === filtroCatForm;
    const matchBus = !busquedaJugador || `${j.nombre} ${j.apellidos}`.toLowerCase().includes(busquedaJugador.toLowerCase());
    return matchCat && matchBus;
  });

  const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent placeholder-slate-500';
  const selectCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]';
  const labelCls = 'text-sm font-bold text-slate-300';

  return (
    <div className="p-5 space-y-4">
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Categoria</label>
            <select value={filtroCatForm} onChange={(e) => onFiltroCatForm(e.target.value)} className={selectCls}>
              <option value="">Todas Categorias</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Buscar jugador *</label>
            <input value={busquedaJugador} onChange={(e) => onBusquedaJugador(e.target.value)} placeholder="Escribe nombre..." autoComplete="off" className={inputCls} />
          </div>
        </div>
        {(busquedaJugador || filtroCatForm) && jugadoresGrid.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{jugadoresGrid.length} jugadores</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[240px] overflow-auto">
              {jugadoresGrid.map((j) => {
                const saldo = j.saldo_pendiente || 0;
                const barColor = j.tipo_beca?.includes('Becado') ? 'bg-purple-500' : saldo <= 0 ? 'bg-[#22C55E]' : 'bg-red-500';
                return (
                  <button key={j.id} onClick={() => onSelectJugador(j)}
                    className="text-left p-2.5 bg-slate-800 border border-slate-700 rounded-xl hover:border-[#22C55E]/50 hover:bg-slate-700/50 transition-all">
                    <div className={`h-1 rounded-full ${barColor} mb-2`} />
                    <p className="text-sm font-bold text-white truncate">{j.nombre} {j.apellidos}</p>
                    <p className="text-[11px] text-slate-400">{j.categoria}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {jugadorSeleccionado && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#22C55E] text-white flex items-center justify-center font-black text-lg flex-shrink-0">
            {jugadorSeleccionado.nombre.charAt(0)}{jugadorSeleccionado.apellidos.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white">{jugadorSeleccionado.nombre} {jugadorSeleccionado.apellidos}</p>
            <p className="text-xs text-slate-400">{jugadorSeleccionado.categoria} | {jugadorSeleccionado.telefono || 'S/T'}</p>
          </div>
          <button onClick={onClearJugador} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Monto *</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">$</span>
            <input type="number" min="1" value={monto || ''} onChange={(e) => onMonto(Number(e.target.value))} placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Fecha *</label>
          <input type="date" value={fecha} onChange={(e) => onFecha(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-[#22C55E] focus:outline-none" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {[
          { val: 'no' as const, label: 'Mensual', desc: 'Completo', active: 'border-white bg-slate-700' },
          { val: 'abono' as const, label: 'Abono', desc: 'Parcial', active: 'border-amber-500 bg-amber-500/10' },
          { val: 'si' as const, label: 'Adelantado', desc: 'Varios meses', active: 'border-[#22C55E] bg-[#22C55E]/10' },
        ].map(({ val, label, desc, active }) => (
          <label key={val} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${tipoPago === val ? active : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
            <input type="radio" name="tipo_pago" value={val} checked={tipoPago === val} onChange={(e) => onTipoPago(e.target.value as any)} className="accent-[#22C55E]" />
            <span className="text-sm font-bold text-white">{label}</span>
            <span className="text-xs text-slate-500">{desc}</span>
          </label>
        ))}
      </div>

      {tipoPago === 'si' && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-400 mb-2">Selecciona los meses a cubrir</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {MESES.map((nombre, idx) => {
              const mes = idx + 1;
              const anio = new Date().getFullYear();
              const sel = mesesSeleccionados.some(m => m.mes === mes && m.anio === anio);
              return (
                <button key={mes} type="button"
                  onClick={() => {
                    if (sel) onMeses(mesesSeleccionados.filter(m => !(m.mes === mes && m.anio === anio)));
                    else onMeses([...mesesSeleccionados, { anio, mes }].sort((a, b) => a.anio - b.anio || a.mes - b.mes));
                  }}
                  className={`p-2 rounded-lg border text-center text-xs font-bold transition-all ${sel ? 'bg-[#22C55E]/20 border-[#22C55E]/50 text-[#22C55E]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {nombre}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{mesesSeleccionados.length} meses · {formatCurrency(monto * mesesSeleccionados.length)} total</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Concepto</label>
          <select value={concepto} onChange={(e) => onConcepto(e.target.value)} className={`mt-1 ${selectCls}`}>
            <option value="abono">Mensualidad</option>
            <option value="inscripcion">Inscripcion</option>
            <option value="uniforme">Uniforme</option>
            <option value="otro">Otro</option>
          </select>
          {concepto === 'otro' && (
            <input value={conceptoOtro} onChange={(e) => onConceptoOtro(e.target.value)} placeholder="Escribe concepto..."
              className="mt-2 w-full px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-white placeholder-amber-300/50" />
          )}
        </div>
        <div>
          <label className={labelCls}>Medio de pago</label>
          <select value={medioPago} onChange={(e) => onMedioPago(e.target.value)} className={`mt-1 ${selectCls}`}>
            <option>Efectivo</option><option>Nequi</option><option>Bancolombia</option><option>Transferencia</option><option>Otro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Observaciones</label>
          <input value={observacion} onChange={(e) => onObservacion(e.target.value)} placeholder="Opcional" className={`mt-1 ${inputCls}`} />
        </div>
      </div>

      {editingPago && (
        <button onClick={onReset} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors">Cancelar edicion</button>
      )}
      <button onClick={onGuardar} disabled={saving} className="w-full py-3 bg-[#22C55E] hover:bg-[#1DA84C] text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
        {saving ? 'Guardando...' : editingPago ? 'Actualizar pago' : 'Guardar pago y generar recibo'}
      </button>
    </div>
  );
}
