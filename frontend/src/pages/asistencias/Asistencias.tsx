import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../../hooks/useToast';
import { asistenciaService } from '../../services/asistenciaService';
import { jugadorService } from '../../services/jugadorService';
import { categoriaService } from '../../services/categoriaService';
import type { Jugador, Categoria } from '../../types';
import { todayISO } from '../../utils/formatters';
import { CATEGORIAS } from '../../utils/constants';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterSelect } from '../../components/data/FilterSelect';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

export function Asistencias() {
  const [fecha, setFecha] = useState(todayISO());
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroCategoriaConsulta, setFiltroCategoriaConsulta] = useState('');
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<(Categoria & { profesor_nombre?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [registros, setRegistros] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'registrar' | 'consultar'>('registrar');

  useEffect(() => {
    loadData();
  }, [fecha]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [j, a, c] = await Promise.all([
        jugadorService.getAll(),
        asistenciaService.getAll({ fecha }),
        categoriaService.getAll(),
      ]);
      setJugadores(j);
      setAsistencias(a);
      setCategorias(c as any);
      const init: Record<number, boolean> = {};
      a.forEach((as: any) => { init[as.jugador_id] = as.presente; });
      setRegistros(init);
    } catch {}
    setLoading(false);
  };

  const jugadoresFiltrados = jugadores.filter((j) =>
    j.activo && (!filtroCategoria || j.categoria === filtroCategoria)
  );

  const asistenciasFiltradas = asistencias.filter((a: any) =>
    !filtroCategoriaConsulta || a.categoria === filtroCategoriaConsulta
  );

  const getCategoriaInfo = (nombre: string) => categorias.find((c) => c.nombre === nombre);

  const toggleAsistencia = (jugadorId: number) => {
    setRegistros((prev) => ({ ...prev, [jugadorId]: !prev[jugadorId] }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const payload = {
        registros: jugadoresFiltrados.map((j) => ({
          jugador_id: j.id,
          fecha,
          presente: registros[j.id] ?? false,
        })),
      };
      await asistenciaService.save(payload);
      showSuccess('Asistencia guardada correctamente');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const presentes = asistenciasFiltradas.filter((a: any) => a.presente).length;
  const ausentes = asistenciasFiltradas.filter((a: any) => !a.presente).length;
  const porcentajeGlobal = asistenciasFiltradas.length ? Math.round((presentes / asistenciasFiltradas.length) * 100) : 0;

  const categoriasConAsistencia = [...new Set(asistenciasFiltradas.map((a: any) => a.categoria).filter(Boolean))];

  // Resumen: porcentaje por jugador (agrupado por jugador_id)
  const resumenPorJugador = useMemo(() => {
    const map = new Map<number, { jugador_id: number; nombre: string; apellidos: string; categoria: string; total: number; presentes: number }>();
    asistenciasFiltradas.forEach((a: any) => {
      const key = a.jugador_id;
      if (!map.has(key)) {
        map.set(key, { jugador_id: key, nombre: a.nombre || '', apellidos: a.apellidos || '', categoria: a.categoria || '', total: 0, presentes: 0 });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      if (a.presente) entry.presentes += 1;
    });
    return Array.from(map.values()).map((r) => ({
      ...r,
      porcentaje: r.total ? Math.round((r.presentes / r.total) * 100) : 0,
    })).sort((a, b) => b.porcentaje - a.porcentaje);
  }, [asistenciasFiltradas]);

  // Summary stats for registrar tab
  const registrarPresentes = jugadoresFiltrados.filter((j) => registros[j.id]).length;
  const registrarTotal = jugadoresFiltrados.length;
  const registrarPorcentaje = registrarTotal ? Math.round((registrarPresentes / registrarTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      <PageHeader title="Asistencias" actions={tab === 'registrar' ? <Button onClick={handleGuardar} loading={saving}>Registrar asistencia</Button> : undefined} />

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm flex-shrink-0" />
        <FilterSelect
          value={tab === 'registrar' ? filtroCategoria : filtroCategoriaConsulta}
          onChange={tab === 'registrar' ? setFiltroCategoria : setFiltroCategoriaConsulta}
          options={[{ value: '', label: 'Todas' }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]}
        />
        <div className="flex bg-slate-800 border border-slate-600 rounded-lg overflow-hidden text-sm ml-auto">
          <button onClick={() => setTab('registrar')}
            className={`px-4 py-2 transition-colors ${tab === 'registrar' ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-slate-400 hover:text-white'}`}>
            Registrar
          </button>
          <button onClick={() => setTab('consultar')}
            className={`px-4 py-2 transition-colors ${tab === 'consultar' ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-slate-400 hover:text-white'}`}>
            Consultar
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingOverlay />
      ) : tab === 'registrar' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Total jugadores</p>
              <p className="text-xl font-bold text-white">{registrarTotal}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400">Presentes</p>
              <p className="text-xl font-bold text-green-300">{registrarPresentes}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Asistencia</p>
              <p className="text-xl font-bold text-white">{registrarPorcentaje}%</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            {filtroCategoria && (() => {
              const catInfo = getCategoriaInfo(filtroCategoria);
              return catInfo?.profesor_nombre ? (
                <div className="mb-4 pb-3 border-b border-slate-700/50">
                  <p className="text-xs text-slate-500">Profesor encargado</p>
                  <p className="text-sm text-[#22C55E] font-medium">{catInfo.profesor_nombre}</p>
                </div>
              ) : null;
            })()}
            {jugadoresFiltrados.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay jugadores activos</p>
            ) : (
              <div className="space-y-2">
                {jugadoresFiltrados.map((j) => {
                  const checked = registros[j.id] ?? false;
                  return (
                    <div key={j.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={`${j.nombre} ${j.apellidos}`} size="sm" />
                        <div>
                          <p className="text-white text-sm font-medium">{j.nombre} {j.apellidos}</p>
                          <p className="text-xs text-slate-400">{j.categoria}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAsistencia(j.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                          ${checked ? 'bg-[#22C55E] text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                      >
                        {checked ? '\u2713' : '\u2014'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-xl font-bold text-white">{asistenciasFiltradas.length}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400">Presentes</p>
              <p className="text-xl font-bold text-green-300">{presentes}</p>
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-red-400">Ausentes</p>
              <p className="text-xl font-bold text-red-300">{ausentes}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-400">Asistencia</p>
              <p className="text-xl font-bold text-blue-300">{porcentajeGlobal}%</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Badge variant="success">{presentes} presentes</Badge>
            <Badge variant="danger">{ausentes} ausentes</Badge>
            <Badge variant="info">{asistenciasFiltradas.length} total</Badge>
          </div>

          {resumenPorJugador.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-3">Resumen por jugador</h3>
              <div className="space-y-2">
                {resumenPorJugador.map((r) => (
                  <div key={r.jugador_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={`${r.nombre} ${r.apellidos}`} size="sm" />
                      <div>
                        <p className="text-white text-sm">{r.nombre} {r.apellidos}</p>
                        <p className="text-xs text-slate-400">{r.categoria} · {r.presentes}/{r.total}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-[#22C55E]" style={{ width: `${r.porcentaje}%` }} />
                      </div>
                      <span className="text-xs font-mono text-white w-8 text-right">{r.porcentaje}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categoriasConAsistencia.length > 0 ? (
            categoriasConAsistencia.map((cat) => {
              const catInfo = getCategoriaInfo(cat);
              const asistCat = asistenciasFiltradas.filter((a: any) => a.categoria === cat);
              const presCat = asistCat.filter((a: any) => a.presente).length;
              return (
                <div key={cat} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{cat}</h3>
                      {catInfo?.profesor_nombre && (
                        <p className="text-xs text-[#22C55E]">Profesor: {catInfo.profesor_nombre}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="success">{presCat} presentes</Badge>
                      <Badge variant="danger">{asistCat.length - presCat} ausentes</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {asistCat.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/30">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={`${a.nombre || ''} ${a.apellidos || ''}`} size="sm" />
                          <p className="text-white text-sm">{a.nombre} {a.apellidos}</p>
                        </div>
                        <Badge variant={a.presente ? 'success' : 'danger'}>
                          {a.presente ? 'Presente' : 'Ausente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            asistenciasFiltradas.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay asistencia registrada para esta fecha</p>
            ) : (
              <div className="space-y-2">
                {asistenciasFiltradas.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={`${a.nombre || ''} ${a.apellidos || ''}`} size="sm" />
                      <div>
                        <p className="text-white text-sm font-medium">{a.nombre} {a.apellidos}</p>
                        <p className="text-xs text-slate-400">{a.categoria}</p>
                      </div>
                    </div>
                    <Badge variant={a.presente ? 'success' : 'danger'}>
                      {a.presente ? 'Presente' : 'Ausente'}
                    </Badge>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
