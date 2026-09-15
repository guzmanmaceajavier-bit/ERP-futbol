import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KPICard } from '../components/dashboard/KPICard';
import { useApi } from '../hooks/useApi';
import { jugadorService } from '../services/jugadorService';
import { pagoService } from '../services/pagoService';
import { gastoService } from '../services/gastoService';
import { alertaService } from '../services/alertaService';
import { periodoService } from '../services/periodoService';
import { configService } from '../services/configService';
import { formatCurrency, todayISO } from '../utils/formatters';
import { Link } from 'react-router-dom';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: jugadores } = useApi(() => jugadorService.getAll());
  const { data: pagos } = useApi(() => pagoService.getAll());
  const { data: gastos } = useApi(() => gastoService.getAll());
  const { data: alertas } = useApi(() => alertaService.getAll());
  const { data: config } = useApi(() => configService.getAll());

  const today = todayISO();
  const monthStart = today.substring(0, 7);
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;
  const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
  const anioMesAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

  const { data: periodosResumen } = useApi(() => periodoService.getResumen(anioActual));

  const escuelaNombre = config?.escuela_nombre || 'ERP Futbol';

  const pagosMes = useMemo(() => pagos?.filter(p => p.fecha?.startsWith(monthStart)) || [], [pagos, monthStart]);
  const pagosMesAnterior = useMemo(() => {
    const prefAnt = `${anioMesAnterior}-${String(mesAnterior).padStart(2, '0')}`;
    return pagos?.filter(p => p.fecha?.startsWith(prefAnt)) || [];
  }, [pagos, anioMesAnterior, mesAnterior]);
  const gastosMes = useMemo(() => gastos?.filter(g => g.fecha?.startsWith(monthStart)) || [], [gastos, monthStart]);
  const gastosMesAnterior = useMemo(() => {
    const prefAnt = `${anioMesAnterior}-${String(mesAnterior).padStart(2, '0')}`;
    return gastos?.filter(g => g.fecha?.startsWith(prefAnt)) || [];
  }, [gastos, anioMesAnterior, mesAnterior]);

  const totalIngresos = pagosMes.reduce((s, p) => s + (p.monto || 0), 0);
  const totalIngresosAnt = pagosMesAnterior.reduce((s, p) => s + (p.monto || 0), 0);
  const totalGastos = gastosMes.reduce((s, g) => s + (g.monto || 0), 0);
  const totalGastosAnt = gastosMesAnterior.reduce((s, g) => s + (g.monto || 0), 0);
  const balance = totalIngresos - totalGastos;
  const balanceAnt = totalIngresosAnt - totalGastosAnt;

  const jugadoresActivos = jugadores?.filter(j => j.activo) || [];

  const periodosMes = useMemo(() => {
    if (!periodosResumen) return { completos: 0, abonos: 0, pendientes: 0, becas: 0, total: 0 };
    let completos = 0, abonos = 0, pendientes = 0, becas = 0, total = 0;
    for (const j of periodosResumen) {
      const periodo = j.periodos?.find((p: any) => p.mes === mesActual && p.anio === anioActual);
      if (periodo) {
        total++;
        if (periodo.estado === 'completo') completos++;
        else if (periodo.estado === 'abono') abonos++;
        else if (periodo.estado === 'beca') becas++;
        else pendientes++;
      }
    }
    return { completos, abonos, pendientes, becas, total };
  }, [periodosResumen, mesActual, anioActual]);

  const jugadoresConDeuda = useMemo(() => {
    if (!periodosResumen) return [];
    return periodosResumen.filter(j =>
      j.periodos?.some((p: any) => (p.estado === 'pendiente' || p.estado === 'abono') && p.anio === anioActual && p.mes <= mesActual)
    );
  }, [periodosResumen, anioActual, mesActual]);

  const pagosHoy = useMemo(() => pagos?.filter(p => p.fecha === today) || [], [pagos, today]);
  const pagosHoyValor = pagosHoy.reduce((s, p) => s + (p.monto || 0), 0);

  const ultimosPagos = useMemo(() => {
    return [...(pagos || [])].sort((a, b) => b.id - a.id).slice(0, 5);
  }, [pagos]);

  const porcentajeCompletado = periodosMes.total > 0
    ? Math.round(((periodosMes.completos + periodosMes.becas) / periodosMes.total) * 100)
    : 0;

  const comparativa = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? '+100%' : '0%';
    const diff = ((actual - anterior) / anterior) * 100;
    return diff >= 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
  };

  const maxBar = Math.max(totalIngresos, totalGastos, 1);

  return (
    <div className="space-y-6">
      {/* 1. Encabezado */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-sport text-2xl font-bold text-white">{escuelaNombre}</h1>
            <p className="text-slate-400 mt-1">
              Bienvenido, {user?.nombre || 'Usuario'}
            </p>
            <p className="text-slate-500 text-sm mt-1">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              API activa
            </span>
            <button
              onClick={() => navigate('/pagos')}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Registrar pago
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Ingresos del mes"
          value={formatCurrency(totalIngresos)}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          color="bg-green-600"
        />
        <KPICard
          label="Gastos del mes"
          value={formatCurrency(totalGastos)}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
          color="bg-red-600"
        />
        <KPICard
          label="Balance del mes"
          value={formatCurrency(balance)}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-blue-600"
        />
        <KPICard
          label="Jugadores activos"
          value={jugadoresActivos.length}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          color="bg-purple-600"
        />
        <KPICard
          label="Pagos pendientes"
          value={jugadoresConDeuda.length}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          color="bg-yellow-600"
        />
        <KPICard
          label="Pagos hoy"
          value={`${pagosHoy.length} / ${formatCurrency(pagosHoyValor)}`}
          icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-indigo-600"
        />
      </div>

      {/* 3. Resumen financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h3 className="font-sport font-bold text-white mb-4">Resumen financiero</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Ingresos</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white font-bold">{formatCurrency(totalIngresos)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${totalIngresos >= totalIngresosAnt ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                  {comparativa(totalIngresos, totalIngresosAnt)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Gastos</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-white font-bold">{formatCurrency(totalGastos)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${totalGastos <= totalGastosAnt ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                  {comparativa(totalGastos, totalGastosAnt)}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <span className="text-sm text-slate-300 font-medium">Balance</span>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-sm font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${balance >= balanceAnt ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                  {comparativa(balance, balanceAnt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h3 className="font-sport font-bold text-white mb-4">Ingresos vs Gastos</h3>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => {
              const mesIdx = (mesActual - 6 + i + 12) % 12;
              const anioRef = mesIdx + 1 > mesActual ? anioActual - 1 : anioActual;
              const pref = `${anioRef}-${String(mesIdx + 1).padStart(2, '0')}`;
              const ing = pagos?.filter(p => p.fecha?.startsWith(pref)).reduce((s, p) => s + (p.monto || 0), 0) || 0;
              const gas = gastos?.filter(g => g.fecha?.startsWith(pref)).reduce((s, g) => s + (g.monto || 0), 0) || 0;
              const maxVal = Math.max(ing, gas, 1);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 w-24">{MESES[mesIdx]}</span>
                    <span className="text-green-400 font-mono">{formatCurrency(ing)}</span>
                    <span className="text-red-400 font-mono">{formatCurrency(gas)}</span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="bg-green-600 rounded-l" style={{ width: `${(ing / maxVal) * 100}%` }}></div>
                    <div className="bg-red-600 rounded-r" style={{ width: `${(gas / maxVal) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-600 rounded"></span>Ingresos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-600 rounded"></span>Gastos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Estado de mensualidades */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sport font-bold text-white">Mensualidades del mes ({MESES[mesActual - 1]} {anioActual})</h3>
          <span className="font-mono text-lg font-bold text-[#22C55E]">{porcentajeCompletado}% completadas</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] transition-all duration-500" style={{ width: `${porcentajeCompletado}%` }}></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-green-400">{periodosMes.completos}</p>
            <p className="text-xs text-slate-400">Completas</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-yellow-400">{periodosMes.abonos}</p>
            <p className="text-xs text-slate-400">Abonos</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-red-400">{periodosMes.pendientes}</p>
            <p className="text-xs text-slate-400">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-purple-400">{periodosMes.becas}</p>
            <p className="text-xs text-slate-400">Becas</p>
          </div>
        </div>
      </div>

      {/* 5. Ultimos pagos + 6. Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sport font-bold text-white">Ultimos pagos</h3>
            <Link to="/pagos" className="text-sm text-[#22C55E] hover:underline">Ver todos</Link>
          </div>
          {ultimosPagos.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No hay pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-slate-700">
                    <th className="text-left py-2 font-medium">Jugador</th>
                    <th className="text-left py-2 font-medium">Periodo</th>
                    <th className="text-left py-2 font-medium">Tipo</th>
                    <th className="text-right py-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPagos.map(p => {
                    const fecha = p.fecha || '';
                    const mesPago = fecha ? MESES[new Date(fecha).getMonth()] : '';
                    const anioPago = fecha ? new Date(fecha).getFullYear() : '';
                    return (
                      <tr key={p.id} className="border-b border-slate-700/50 last:border-0">
                        <td className="py-2 text-white font-medium">{p.jugador || `#${p.jugador_id}`}</td>
                        <td className="py-2 text-slate-400 text-xs">{mesPago} {anioPago}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.tipo === 'adelantado' ? 'bg-blue-900/40 text-blue-400' : p.tipo === 'abono' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>
                            {p.tipo === 'adelantado' ? 'Adelantado' : p.tipo === 'abono' ? 'Abono' : 'Mensual'}
                          </span>
                        </td>
                        <td className={`py-2 text-right font-mono font-bold ${p.estado_pago === 'completo' ? 'text-green-400' : p.estado_pago === 'abono' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {formatCurrency(p.monto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sport font-bold text-white">Alertas pendientes</h3>
            <Link to="/alertas" className="text-sm text-[#22C55E] hover:underline">Ver todas</Link>
          </div>
          {!alertas || alertas.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No hay alertas pendientes</p>
          ) : (
            <div className="space-y-2">
              {alertas.slice(0, 6).map((alerta, idx) => {
                const color = alerta.tipo_alerta === 'DEUDA' ? 'bg-red-500' : alerta.tipo_alerta === 'ABONO' ? 'bg-yellow-500' : alerta.tipo_alerta === 'VENCIMIENTO' ? 'bg-orange-500' : 'bg-blue-500';
                return (
                  <div key={alerta.id || idx} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-700/30 border border-transparent hover:border-slate-600 transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{alerta.titulo || alerta.mensaje || `Alerta #${alerta.id}`}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {alerta.jugador_nombre || ''} {alerta.categoria ? `| ${alerta.categoria}` : ''}
                        {alerta.deuda ? ` | Deuda: ${formatCurrency(alerta.deuda)}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Acciones rapidas */}
      <div>
        <h2 className="font-sport text-lg font-bold text-white mb-3">Acciones rapidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => navigate('/pagos')} className="flex items-center gap-3 p-4 bg-green-600/20 border border-green-600/30 rounded-xl hover:border-green-500 transition-all group">
            <svg className="w-5 h-5 text-green-400 group-hover:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            <span className="text-sm text-slate-300 group-hover:text-white font-medium">Registrar pago</span>
          </button>
          <button onClick={() => navigate('/jugadores')} className="flex items-center gap-3 p-4 bg-blue-600/20 border border-blue-600/30 rounded-xl hover:border-blue-500 transition-all group">
            <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <span className="text-sm text-slate-300 group-hover:text-white font-medium">Registrar jugador</span>
          </button>
          <button onClick={() => navigate('/gastos')} className="flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/30 rounded-xl hover:border-red-500 transition-all group">
            <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            <span className="text-sm text-slate-300 group-hover:text-white font-medium">Registrar gasto</span>
          </button>
          <button onClick={() => navigate('/reportes')} className="flex items-center gap-3 p-4 bg-purple-600/20 border border-purple-600/30 rounded-xl hover:border-purple-500 transition-all group">
            <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-sm text-slate-300 group-hover:text-white font-medium">Ver reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
