import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/ui/Icon';
import { KPICard } from '../../components/dashboard/KPICard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { useApi } from '../../hooks/useApi';
import { jugadorService } from '../../services/jugadorService';
import { pagoService } from '../../services/pagoService';
import { gastoService } from '../../services/gastoService';
import { alertaService } from '../../services/alertaService';
import { periodoService } from '../../services/periodoService';
import { configService } from '../../services/configService';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import { calcularEstadoFinanciero, calcularProximoPago } from '../../utils/finanzas';
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

  // Cobranza pendiente aggregates (periodos del anio actual hasta mes actual)
  const cobranza = useMemo(() => {
    if (!periodosResumen) return { deudaTotal: 0, abonosPendientes: 0, pendientes: 0, totalPendiente: 0, morosidad: 0, jugadoresAlDia: 0, conDeuda: 0 };
    let deudaTotal = 0;
    let abonosPendientes = 0;
    let pendientes = 0;
    for (const j of periodosResumen) {
      for (const p of (j.periodos || []) as any[]) {
        if (p.anio !== anioActual || p.mes > mesActual) continue;
        if (p.estado === 'pendiente' || p.estado === 'abono') {
          const objetivo = Number(p.objetivo) || 0;
          const pagado = Number(p.pagado) || 0;
          deudaTotal += Math.max(0, objetivo - pagado);
          if (p.estado === 'abono') abonosPendientes += 1;
          else pendientes += 1;
        }
      }
    }
    const totalPendiente = abonosPendientes + pendientes;
    const conDeuda = jugadoresConDeuda.length;
    const totalActivos = jugadoresActivos.length || 1;
    const morosidad = Math.round((conDeuda / totalActivos) * 100);
    const jugadoresAlDia = Math.max(0, jugadoresActivos.length - conDeuda);
    return { deudaTotal, abonosPendientes, pendientes, totalPendiente, morosidad, jugadoresAlDia, conDeuda };
  }, [periodosResumen, anioActual, mesActual, jugadoresConDeuda.length, jugadoresActivos.length]);

  // Estado de pagos — 5 cards calculated from jugadores + periodos
  const estadoPagos = useMemo(() => {
    const periodosMap = new Map<number, any[]>();
    periodosResumen?.forEach((r: any) => periodosMap.set(r.jugador_id, r.periodos || []));

    let alDia = 0;
    let proximosAVencer = 0;
    let conAbono = 0;
    let vencidos = 0;
    let adelantados = 0;

    for (const j of jugadoresActivos) {
      const saldo = (j.saldo_pendiente ?? (j as any).deuda_actual ?? 0) as number;
      const proximo = (j as any).proximo_vencimiento || calcularProximoPago((j as any).ultimo_pago ?? j.ultimo_pago ?? null);
      const periodos = periodosMap.get(j.id) || [];
      const periodoActual = periodos.find((p: any) => p.anio === anioActual && p.mes === mesActual);
      const periodoEstado: string | undefined = periodoActual?.estado;

      const estadoFin = calcularEstadoFinanciero((j as any).ultimo_pago ?? null, proximo, saldo, periodoEstado);

      // 🟢 Al dia (count where saldo_pendiente <= 0)
      if (saldo <= 0) alDia++;

      // 🟡 Proximos a vencer (where proximoVencimiento within 5 days and not paid) — uses calcularEstadoFinanciero categorization
      if (estadoFin.estado === 'proximo_vencer' || estadoFin.estado === 'vence_hoy') {
        // only count if not already considered al_dia with no debt? Keep as categorized; but if saldo <=0 we still may be proximo — count anyway per spec "not paid" implies saldo >0
        // We count if estado is proximo_vencer regardless, but keep logic: requires saldo >0 or not fully paid
        // To respect spec "and not paid", we ensure saldo >0 OR periodo not completo
        if (saldo > 0 || periodoEstado === 'pendiente' || periodoEstado === 'abono') {
          proximosAVencer++;
        } else if (saldo <= 0 && estadoFin.estado === 'proximo_vencer') {
          // if saldo al dia but still near due, we still count as proximo for visibility unless user wants strictly not paid
          // Choose to count only if saldo >0 to avoid double counting with Al dia
          // So skip when saldo <=0
        }
      }

      // 🟠 Con abono (where periodo estado === 'abono')
      // Check any periodo up to current month with estado abono, or current periodo is abono
      const tieneAbono = periodos.some((p: any) => p.estado === 'abono' && p.anio === anioActual && p.mes <= mesActual)
        || periodoEstado === 'abono'
        || estadoFin.estado === 'abono';
      if (tieneAbono) conAbono++;

      // 🔴 Vencidos (where vencido, saldo > 0 and proximo < today)
      if (estadoFin.estado === 'vencido' && saldo > 0) {
        vencidos++;
      } else if (estadoFin.estado === 'vencido') {
        // also count pure vencido even if saldo not tracked but proximo < today
        // saldo check above already covers spec; if saldo ===0 we don't count as vencido per spec
      }

      // 🔵 Adelantados (where multiple periods are completo/adelantado)
      // Heuristic: has at least one future month (mes > mesActual) marked completo, or has >=2 completos in current year
      const completosCurrentYear = periodos.filter((p: any) => p.anio === anioActual && (p.estado === 'completo' || p.estado === 'adelantado')).length;
      const futuroCompleto = periodos.some((p: any) => p.anio === anioActual && p.mes > mesActual && (p.estado === 'completo' || p.estado === 'adelantado' || (Number(p.pagado) || 0) >= (Number(p.objetivo) || 0) && Number(p.objetivo) > 0));
      const futuroCount = periodos.filter((p: any) => p.anio === anioActual && p.mes > mesActual && (p.estado === 'completo' || p.estado === 'adelantado')).length;
      if (futuroCompleto || futuroCount >= 1 || completosCurrentYear >= 2 && futuroCount >= 1) {
        adelantados++;
      } else if (completosCurrentYear > (mesActual - 1) && saldo <= 0) {
        // alternative: if they have more completos than months elapsed, they are ahead
        // e.g., mesActual=5 but 6 completos means adelantado
        adelantados++;
      }
    }

    return { alDia, proximosAVencer, conAbono, vencidos, adelantados };
  }, [jugadoresActivos, periodosResumen, anioActual, mesActual]);

  // Proximos vencimientos — next 5-10 jugadores sorted by closest vencimiento
  const proximosVencimientos = useMemo(() => {
    if (!jugadoresActivos.length) return [];
    const todayDate = new Date(today.includes('T') ? today : `${today}T00:00:00`);
    todayDate.setHours(0, 0, 0, 0);
    const periodosMap = new Map<number, any[]>();
    periodosResumen?.forEach((r: any) => periodosMap.set(r.jugador_id, r.periodos || []));

    const entries = jugadoresActivos.map(j => {
      const proximo = (j as any).proximo_vencimiento || calcularProximoPago((j as any).ultimo_pago ?? j.ultimo_pago ?? null);
      if (!proximo) return null;
      const venc = new Date(proximo.includes('T') ? proximo : `${proximo}T00:00:00`);
      if (isNaN(venc.getTime())) return null;
      venc.setHours(0, 0, 0, 0);
      const diffMs = venc.getTime() - todayDate.getTime();
      const diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const saldo = (j.saldo_pendiente ?? (j as any).deuda_actual ?? 0) as number;
      const periodos = periodosMap.get(j.id) || [];
      const periodoActual = periodos.find((p: any) => p.anio === anioActual && p.mes === mesActual);
      const periodoEstado: string | undefined = periodoActual?.estado;
      const estadoFin = calcularEstadoFinanciero((j as any).ultimo_pago ?? null, proximo, saldo, periodoEstado);
      // Valor: mensualidad objetivo or periodo objetivo
      const valor = (j as any).mensualidad_objetivo ?? j.mensualidad ?? periodoActual?.objetivo ?? 0;
      return {
        jugador: j,
        nombre: `${j.nombre} ${j.apellidos}`,
        categoria: j.categoria,
        proximo,
        diasRestantes,
        valor,
        saldo,
        estadoFin,
      };
    }).filter(Boolean) as Array<{
      jugador: typeof jugadoresActivos[number];
      nombre: string;
      categoria: string;
      proximo: string;
      diasRestantes: number;
      valor: number;
      saldo: number;
      estadoFin: ReturnType<typeof calcularEstadoFinanciero>;
    }>;

    // Sort by closest vencimiento (earliest date first)
    entries.sort((a, b) => new Date(a.proximo).getTime() - new Date(b.proximo).getTime());

    // Prefer those within ~30 days window but keep 5-10 entries
    // Spec says "within 7 days or so" — we filter to window then fallback
    const withinWindow = entries.filter(e => e.diasRestantes >= -60 && e.diasRestantes <= 14);
    const result = withinWindow.length >= 5 ? withinWindow.slice(0, 10) : entries.slice(0, 10);
    return result;
  }, [jugadoresActivos, periodosResumen, today, anioActual, mesActual]);

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
  void maxBar;

  return (
    <div className="space-y-6">
      <PageHeader title={escuelaNombre} subtitle={`Bienvenido, ${user?.nombre || 'Usuario'}`} actions={<Button onClick={() => navigate('/pagos')}>+ Registrar pago</Button>} />

      {/* 2. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Ingresos del mes"
          value={formatCurrency(totalIngresos)}
          icon={<Icon name="chartUp" className="w-5 h-5 text-white" />}
          color="bg-green-600"
        />
        <KPICard
          label="Gastos del mes"
          value={formatCurrency(totalGastos)}
          icon={<Icon name="chartDown" className="w-5 h-5 text-white" />}
          color="bg-red-600"
        />
        <KPICard
          label="Balance del mes"
          value={formatCurrency(balance)}
          icon={<Icon name="money" className="w-5 h-5 text-white" />}
          color="bg-blue-600"
        />
        <KPICard
          label="Jugadores activos"
          value={jugadoresActivos.length}
          icon={<Icon name="users" className="w-5 h-5 text-white" />}
          color="bg-purple-600"
        />
        <KPICard
          label="Pagos pendientes"
          value={jugadoresConDeuda.length}
          icon={<Icon name="warning" className="w-5 h-5 text-white" />}
          color="bg-yellow-600"
        />
        <KPICard
          label="Pagos hoy"
          value={`${pagosHoy.length} / ${formatCurrency(pagosHoyValor)}`}
          icon={<Icon name="wallet" className="w-5 h-5 text-white" />}
          color="bg-indigo-600"
        />
      </div>

      {/* 2a. Estado de pagos — 5 cards */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sport font-bold text-white text-sm">Estado de pagos</h3>
          <span className="text-xs text-slate-400">{jugadoresActivos.length} jugadores activos</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/60 border border-green-600/20 rounded-xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">🟢 Al dia</p>
            <p className="font-mono text-lg font-bold text-green-400">{estadoPagos.alDia}</p>
            <p className="text-[11px] text-slate-500 mt-1">saldo_pendiente &le; 0</p>
          </div>
          <div className="bg-slate-900/60 border border-yellow-600/20 rounded-xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">🟡 Proximos a vencer</p>
            <p className="font-mono text-lg font-bold text-yellow-400">{estadoPagos.proximosAVencer}</p>
            <p className="text-[11px] text-slate-500 mt-1">vencimiento en &le; 5 dias</p>
          </div>
          <div className="bg-slate-900/60 border border-orange-600/20 rounded-xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">🟠 Con abono</p>
            <p className="font-mono text-lg font-bold text-orange-400">{estadoPagos.conAbono}</p>
            <p className="text-[11px] text-slate-500 mt-1">periodo estado = abono</p>
          </div>
          <div className="bg-slate-900/60 border border-red-600/20 rounded-xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">🔴 Vencidos</p>
            <p className="font-mono text-lg font-bold text-red-400">{estadoPagos.vencidos}</p>
            <p className="text-[11px] text-slate-500 mt-1">saldo &gt; 0 y vencido</p>
          </div>
          <div className="bg-slate-900/60 border border-blue-600/20 rounded-xl p-3">
            <p className="text-xs text-slate-400 flex items-center gap-1">🔵 Adelantados</p>
            <p className="font-mono text-lg font-bold text-blue-400">{estadoPagos.adelantados}</p>
            <p className="text-[11px] text-slate-500 mt-1">periodos futuro completos</p>
          </div>
        </div>
      </div>

      {/* 2c. Proximos vencimientos */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sport font-bold text-white">Proximos vencimientos</h3>
          <span className="text-xs text-slate-400">Ordenado por vencimiento mas cercano</span>
        </div>
        {proximosVencimientos.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No hay vencimientos proximos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-700">
                  <th className="text-left py-2 font-medium">Jugador</th>
                  <th className="text-left py-2 font-medium">Fecha</th>
                  <th className="text-right py-2 font-medium">Valor</th>
                  <th className="text-left py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {proximosVencimientos.map((row) => {
                  const dias = row.diasRestantes;
                  let diasLabel = '';
                  let diasColor = 'text-slate-400';
                  if (dias < 0) {
                    diasLabel = `Vencido hace ${Math.abs(dias)} dia${Math.abs(dias) !== 1 ? 's' : ''}`;
                    diasColor = 'text-red-400';
                  } else if (dias === 0) {
                    diasLabel = 'Vence hoy';
                    diasColor = 'text-red-400';
                  } else if (dias === 1) {
                    diasLabel = 'Falta 1 dia';
                    diasColor = 'text-yellow-400';
                  } else if (dias <= 5) {
                    diasLabel = `Faltan ${dias} dias`;
                    diasColor = 'text-yellow-400';
                  } else {
                    diasLabel = `Faltan ${dias} dias`;
                    diasColor = 'text-green-400';
                  }

                  const estadoColorMap: Record<string, string> = {
                    green: 'bg-green-900/40 text-green-400',
                    yellow: 'bg-yellow-900/40 text-yellow-400',
                    amber: 'bg-orange-900/40 text-orange-400',
                    red: 'bg-red-900/40 text-red-400',
                    blue: 'bg-blue-900/40 text-blue-400',
                  };
                  const badgeClass = estadoColorMap[row.estadoFin.color] || 'bg-slate-700 text-slate-300';

                  return (
                    <tr key={row.jugador.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                      <td className="py-2">
                        <div>
                          <p className="text-white font-medium">{row.nombre}</p>
                          <p className="text-xs text-slate-500">{row.categoria}</p>
                        </div>
                      </td>
                      <td className="py-2">
                        <div>
                          <p className="text-slate-300 font-mono text-xs">{formatDate(row.proximo)}</p>
                          <p className={`text-xs ${diasColor}`}>{diasLabel}</p>
                        </div>
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-white">{formatCurrency(row.valor)}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>{row.estadoFin.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2b. Cobranza pendiente (financial focus) */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sport font-bold text-white text-sm">Cobranza pendiente</h3>
          <span className="text-xs text-slate-400">{MESES[mesActual - 1]} {anioActual} · acumulado anio</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400">Saldo pendiente</p>
            <p className="font-mono text-sm font-bold text-red-400">{formatCurrency(cobranza.deudaTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-1">{cobranza.totalPendiente} periodos por cobrar</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400">Abonos pendientes</p>
            <p className="font-mono text-lg font-bold text-yellow-400">{cobranza.abonosPendientes}</p>
            <p className="text-[11px] text-slate-500 mt-1">{cobranza.pendientes} pendientes sin abono</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400">Morosidad</p>
            <p className={`font-mono text-lg font-bold ${cobranza.morosidad > 30 ? 'text-red-400' : cobranza.morosidad > 15 ? 'text-yellow-400' : 'text-green-400'}`}>{cobranza.morosidad}%</p>
            <p className="text-[11px] text-slate-500 mt-1">{cobranza.conDeuda} / {jugadoresActivos.length} jugadores</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-400">Jugadores</p>
            <p className="text-sm font-bold"><span className="text-green-400">{cobranza.jugadoresAlDia} al dia</span> <span className="text-slate-500 font-normal"> / </span> <span className="text-red-400">{cobranza.conDeuda} con saldo pendiente</span></p>
            <p className="text-[11px] text-slate-500 mt-1">Activos: {jugadoresActivos.length}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-400">Ingresos vs Gastos (mes)</p>
            <p className={`font-mono text-sm font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ing {formatCurrency(totalIngresos)} · Gas {formatCurrency(totalGastos)}</p>
          </div>
        </div>
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
            <h3 className="font-sport font-bold text-white">Seguimientos pendientes</h3>
            <Link to="/alertas" className="text-sm text-[#22C55E] hover:underline">Ver todas</Link>
          </div>
          {!alertas || alertas.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No hay seguimientos pendientes</p>
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
                        {alerta.deuda ? ` | Saldo pendiente: ${formatCurrency(alerta.deuda)}` : ''}
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
