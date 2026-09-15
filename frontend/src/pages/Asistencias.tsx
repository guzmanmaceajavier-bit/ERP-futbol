import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { asistenciaService } from '../services/asistenciaService';
import { jugadorService } from '../services/jugadorService';
import { categoriaService } from '../services/categoriaService';
import type { Jugador, Categoria } from '../types';
import { todayISO } from '../utils/formatters';
import { CATEGORIAS } from '../utils/constants';
import { Button } from '../components/ui/Button';
import { FilterSelect } from '../components/data/FilterSelect';
import { ToastList } from '../components/feedback/ToastList';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

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

  const categoriasConAsistencia = [...new Set(asistenciasFiltradas.map((a: any) => a.categoria).filter(Boolean))];

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-sport text-2xl font-bold text-white">Asistencias</h1>
        <div className="flex gap-2">
          {tab === 'registrar' && (
            <Button onClick={handleGuardar} loading={saving}>Guardar Asistencia</Button>
          )}
        </div>
      </div>

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
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Badge variant="success">{presentes} presentes</Badge>
            <Badge variant="danger">{ausentes} ausentes</Badge>
            <Badge variant="info">{asistenciasFiltradas.length} total</Badge>
          </div>

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
