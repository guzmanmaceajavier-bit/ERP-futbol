import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { asistenciaService } from '../../services/asistenciaService';
import { jugadorService } from '../../services/jugadorService';
import { categoriaService } from '../../services/categoriaService';
import { entrenamientoService } from '../../services/entrenamientoService';
import type { Jugador, Categoria } from '../../types';
import { todayISO } from '../../utils/formatters';
import { CATEGORIAS } from '../../utils/constants';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/layout/PageHeader';
import { FilterSelect } from '../../components/data/FilterSelect';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

type EstadoRegistro = 'presente' | 'ausente' | 'ausente_con_excusa' | 'no_registrado';

interface RegistroValue {
  estado: EstadoRegistro;
  motivo?: string;
  medio?: string;
  observacion?: string;
  fecha_excusa?: string;
  observacion_entrenador?: string;
}

const MOTIVOS_EXCUSA = ['Enfermedad', 'Calamidad', 'Viaje', 'Académico', 'Otro'] as const;
const MEDIOS_NOTIFICACION = ['Llamada', 'WhatsApp', 'Presencial', 'Otro'] as const;

const ESTADO_LABEL: Record<EstadoRegistro, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  ausente_con_excusa: 'Ausente con excusa',
  no_registrado: 'Sin registrar',
};

const ESTADO_BADGE_VARIANT: Record<EstadoRegistro, 'success' | 'danger' | 'warning' | 'default'> = {
  presente: 'success',
  ausente: 'danger',
  ausente_con_excusa: 'warning',
  no_registrado: 'default',
};

const ESTADO_DOT: Record<EstadoRegistro, string> = {
  presente: '🟢',
  ausente: '🔴',
  ausente_con_excusa: '🟡',
  no_registrado: '⚪',
};

function resolveEstado(a: any): EstadoRegistro {
  if (a.estado && ['presente', 'ausente', 'ausente_con_excusa', 'no_registrado'].includes(a.estado)) {
    return a.estado as EstadoRegistro;
  }
  // fallback for legacy boolean presente
  if (typeof a.presente === 'boolean') return a.presente ? 'presente' : 'ausente';
  return 'no_registrado';
}

const TIPO_ACTIVIDAD_LABEL: Record<string, string> = {
  entrenamiento: 'Entrenamiento',
  partido: 'Partido',
  torneo: 'Torneo',
  general: 'General',
};

const TIPO_ACTIVIDAD_BADGE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  entrenamiento: 'info',
  partido: 'warning',
  torneo: 'success',
  general: 'default',
};

export function Asistencias() {
  const location = useLocation() as { state?: { fecha?: string; categoria?: string; entrenamiento_id?: number; entrenamientoId?: number } };
  const [fecha, setFecha] = useState(todayISO());
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroCategoriaConsulta, setFiltroCategoriaConsulta] = useState('');
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<(Categoria & { profesor_nombre?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [registros, setRegistros] = useState<Record<number, RegistroValue>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'registrar' | 'consultar'>('registrar');

  // multi-activity attendance & entrenamiento linkage
  const [tipoActividad, setTipoActividad] = useState<'todos' | 'entrenamiento' | 'partido' | 'torneo'>('todos');
  const [entrenamientoFiltro, setEntrenamientoFiltro] = useState<number | ''>('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [jugadorFiltroAsistencia, setJugadorFiltroAsistencia] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | EstadoRegistro>('todos');
  const [entrenamientos, setEntrenamientos] = useState<any[]>([]);

  // Pre-fill from Entrenamientos navigation (location.state?.fecha / categoria / entrenamiento_id)
  useEffect(() => {
    const state = location.state;
    if (state?.fecha) setFecha(state.fecha);
    if (state?.categoria) {
      setFiltroCategoria(state.categoria);
      setFiltroCategoriaConsulta(state.categoria);
    }
    const entrenamientoIdFromState = state?.entrenamiento_id ?? state?.entrenamientoId;
    if (entrenamientoIdFromState) {
      setEntrenamientoFiltro(Number(entrenamientoIdFromState));
      setTipoActividad('entrenamiento');
    }
  }, [location.state]);

  useEffect(() => {
    loadData();
  }, [fecha]);

  // Fetch entrenamientos for filter (separate effect to keep list fresh)
  useEffect(() => {
    const fetchEntrenamientos = async () => {
      try {
        const data = await entrenamientoService.getAll();
        setEntrenamientos(data as any[]);
      } catch {
        // keep empty if service unavailable
      }
    };
    fetchEntrenamientos();
  }, []);

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
      const init: Record<number, RegistroValue> = {};
      a.forEach((as: any) => {
        init[as.jugador_id] = {
          estado: resolveEstado(as),
          motivo: as.motivo ?? undefined,
          medio: as.medio ?? undefined,
          observacion: as.observacion ?? undefined,
          fecha_excusa: as.fecha_excusa ?? undefined,
          observacion_entrenador: as.observacion_entrenador ?? undefined,
        };
      });
      setRegistros(init);
    } catch {}
    // fetch entrenamientos via entrenamientoService.getAll() if available
    try {
      const ent = await entrenamientoService.getAll();
      setEntrenamientos(ent as any[]);
    } catch {}
    setLoading(false);
  };

  const jugadoresFiltrados = jugadores.filter((j) =>
    j.activo && (!filtroCategoria || j.categoria === filtroCategoria)
  );

  const asistenciasFiltradas = useMemo(() => {
    return asistencias.filter((a: any) => {
      if (filtroCategoriaConsulta && a.categoria !== filtroCategoriaConsulta) return false;
      // tipo_actividad filter
      if (tipoActividad !== 'todos') {
        const tipo = (a.tipo_actividad ?? a.tipoActividad ?? 'general') as string;
        if (tipo !== tipoActividad) return false;
      }
      // entrenamiento selector filter
      if (entrenamientoFiltro !== '' && Number(a.entrenamiento_id ?? a.entrenamientoId) !== Number(entrenamientoFiltro)) return false;
      // date range filtering in consultar — enables "¿Quién asistió al entrenamiento del 23 de septiembre?"
      if (fechaDesde && a.fecha < fechaDesde) return false;
      if (fechaHasta && a.fecha > fechaHasta) return false;
      // jugador search
      if (jugadorFiltroAsistencia) {
        const q = jugadorFiltroAsistencia.toLowerCase();
        const nombreCompleto = `${a.nombre ?? ''} ${a.apellidos ?? ''}`.toLowerCase();
        if (!nombreCompleto.includes(q)) return false;
      }
      // estado filter
      if (estadoFiltro !== 'todos' && resolveEstado(a) !== estadoFiltro) return false;
      return true;
    });
  }, [asistencias, filtroCategoriaConsulta, tipoActividad, entrenamientoFiltro, fechaDesde, fechaHasta, jugadorFiltroAsistencia, estadoFiltro]);

  const getCategoriaInfo = (nombre: string) => categorias.find((c) => c.nombre === nombre);

  const setEstado = (jugadorId: number, estado: EstadoRegistro) => {
    setRegistros((prev) => {
      const existing = prev[jugadorId] ?? { estado: 'no_registrado' as EstadoRegistro };
      // when switching away from ausente_con_excusa keep fields but they won't be shown
      return { ...prev, [jugadorId]: { ...existing, estado } };
    });
  };

  const updateRegistroField = (
    jugadorId: number,
    field: keyof RegistroValue,
    value: string
  ) => {
    setRegistros((prev) => {
      const existing = prev[jugadorId] ?? { estado: 'ausente_con_excusa' as EstadoRegistro };
      return { ...prev, [jugadorId]: { ...existing, [field]: value || undefined } };
    });
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const locationState = location.state as any;
      const selectedEntrenamientoId = entrenamientoFiltro !== '' ? Number(entrenamientoFiltro) : (locationState?.entrenamiento_id ?? locationState?.entrenamientoId ?? null);
      // Determine tipo_actividad: if entrenamiento selected -> entrenamiento, else use tipoActividad if not todos, else general/entrenamiento fallback
      let resolvedTipoActividad: string = 'general';
      if (selectedEntrenamientoId != null) {
        resolvedTipoActividad = 'entrenamiento';
      } else if (tipoActividad !== 'todos') {
        resolvedTipoActividad = tipoActividad;
      } else {
        resolvedTipoActividad = 'general';
      }
      const payload = {
        registros: jugadoresFiltrados.map((j) => {
          const r: RegistroValue = registros[j.id] ?? { estado: 'no_registrado' };
          return {
            jugador_id: j.id,
            fecha,
            estado: r.estado,
            presente: r.estado === 'presente',
            motivo: r.motivo,
            medio: r.medio,
            observacion: r.observacion,
            fecha_excusa: r.fecha_excusa,
            observacion_entrenador: r.observacion_entrenador,
            ...(selectedEntrenamientoId != null ? { entrenamiento_id: selectedEntrenamientoId, actividad_id: selectedEntrenamientoId } : {}),
            tipo_actividad: resolvedTipoActividad,
          };
        }),
      };
      await asistenciaService.save(payload as any);
      showSuccess('Asistencia guardada correctamente');
      loadData();
    } catch (err: any) {
      showError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Stats for consultar tab (4 states)
  const presentes = asistenciasFiltradas.filter((a: any) => resolveEstado(a) === 'presente').length;
  const ausentes = asistenciasFiltradas.filter((a: any) => resolveEstado(a) === 'ausente').length;
  const ausentesConExcusa = asistenciasFiltradas.filter((a: any) => resolveEstado(a) === 'ausente_con_excusa').length;
  const noRegistradosCount = asistenciasFiltradas.filter((a: any) => resolveEstado(a) === 'no_registrado').length;
  const porcentajeGlobal = asistenciasFiltradas.length ? Math.round((presentes / asistenciasFiltradas.length) * 100) : 0;

  const categoriasConAsistencia = [...new Set(asistenciasFiltradas.map((a: any) => a.categoria).filter(Boolean))];

  // Resumen: porcentaje por jugador (agrupado por jugador_id) – updated for 4 states
  const resumenPorJugador = useMemo(() => {
    const map = new Map<number, { jugador_id: number; nombre: string; apellidos: string; categoria: string; total: number; presentes: number; ausentes: number; ausentesConExcusa: number; noRegistrados: number }>();
    asistenciasFiltradas.forEach((a: any) => {
      const key = a.jugador_id;
      if (!map.has(key)) {
        map.set(key, { jugador_id: key, nombre: a.nombre || '', apellidos: a.apellidos || '', categoria: a.categoria || '', total: 0, presentes: 0, ausentes: 0, ausentesConExcusa: 0, noRegistrados: 0 });
      }
      const entry = map.get(key)!;
      entry.total += 1;
      const est = resolveEstado(a);
      if (est === 'presente') entry.presentes += 1;
      else if (est === 'ausente') entry.ausentes += 1;
      else if (est === 'ausente_con_excusa') entry.ausentesConExcusa += 1;
      else entry.noRegistrados += 1;
    });
    return Array.from(map.values()).map((r) => ({
      ...r,
      porcentaje: r.total ? Math.round((r.presentes / r.total) * 100) : 0,
    })).sort((a, b) => b.porcentaje - a.porcentaje);
  }, [asistenciasFiltradas]);

  // Summary stats for registrar tab – updated for 4 states
  const registrarPresentes = jugadoresFiltrados.filter((j) => (registros[j.id]?.estado ?? 'no_registrado') === 'presente').length;
  const registrarAusentes = jugadoresFiltrados.filter((j) => (registros[j.id]?.estado ?? 'no_registrado') === 'ausente').length;
  const registrarAusentesConExcusa = jugadoresFiltrados.filter((j) => (registros[j.id]?.estado ?? 'no_registrado') === 'ausente_con_excusa').length;
  const registrarNoRegistrados = jugadoresFiltrados.filter((j) => (registros[j.id]?.estado ?? 'no_registrado') === 'no_registrado').length;
  const registrarTotal = jugadoresFiltrados.length;
  const registrarPorcentaje = registrarTotal ? Math.round((registrarPresentes / registrarTotal) * 100) : 0;

  const estadoButtonClass = (active: boolean, estado: EstadoRegistro) => {
    if (!active) return 'bg-slate-700 text-slate-400 hover:bg-slate-600 border border-slate-600';
    switch (estado) {
      case 'presente': return 'bg-[#22C55E] text-white border border-[#22C55E]';
      case 'ausente': return 'bg-red-600 text-white border border-red-600';
      case 'ausente_con_excusa': return 'bg-yellow-500 text-slate-900 border border-yellow-500';
      case 'no_registrado': return 'bg-slate-500 text-white border border-slate-500';
      default: return 'bg-slate-700 text-white';
    }
  };

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

      {/* Location-state hint for entrenamiento linkage */}
      {location.state?.fecha && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg px-3 py-2 text-xs text-[#22C55E] flex items-center justify-between gap-2">
          <span>Vinculado desde entrenamiento — Fecha: {location.state.fecha} {location.state.categoria ? `· ${location.state.categoria}` : ''} {entrenamientoFiltro !== '' ? `· Entrenamiento #${entrenamientoFiltro}` : ''}</span>
          {entrenamientoFiltro !== '' && <Badge variant="info">{TIPO_ACTIVIDAD_LABEL['entrenamiento']}</Badge>}
        </div>
      )}

      {loading ? (
        <LoadingOverlay />
      ) : tab === 'registrar' ? (
        <div className="space-y-4">
          {/* entrenamiento selector for proper linkage in registrar */}
          {entrenamientos.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <FilterSelect
                label="Vincular a entrenamiento"
                value={entrenamientoFiltro === '' ? '' : String(entrenamientoFiltro)}
                onChange={(v) => setEntrenamientoFiltro(v === '' ? '' : Number(v))}
                options={[
                  { value: '', label: 'Sin entrenamiento (General)' },
                  ...entrenamientos.map((e: any) => ({
                    value: String(e.id),
                    label: `${e.fecha} ${e.hora ?? ''} · ${e.categoria} · ${e.tema || 'Sin tema'}`.trim(),
                  })),
                ]}
              />
              <FilterSelect
                label="Tipo actividad"
                value={tipoActividad}
                onChange={(v) => setTipoActividad(v as any)}
                options={[
                  { value: 'todos', label: 'General' },
                  { value: 'entrenamiento', label: 'Entrenamiento' },
                  { value: 'partido', label: 'Partido' },
                  { value: 'torneo', label: 'Torneo' },
                ]}
              />
              {entrenamientoFiltro !== '' && (
                <p className="text-xs text-slate-400 pb-2">Se guardará con entrenamiento_id={entrenamientoFiltro} y tipo_actividad=entrenamiento</p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Total jugadores</p>
              <p className="text-xl font-bold text-white">{registrarTotal}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400">Presentes</p>
              <p className="text-xl font-bold text-green-300">{registrarPresentes}</p>
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-red-400">Ausentes</p>
              <p className="text-xl font-bold text-red-300">{registrarAusentes}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-yellow-400">Con excusa</p>
              <p className="text-xl font-bold text-yellow-300">{registrarAusentesConExcusa}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Asistencia</p>
              <p className="text-xl font-bold text-white">{registrarPorcentaje}%</p>
            </div>
          </div>
          {/* summary extra for no_registrado */}
          {registrarNoRegistrados > 0 && (
            <p className="text-xs text-slate-400">⚪ Sin registrar: {registrarNoRegistrados}</p>
          )}
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
              <div className="space-y-3">
                {jugadoresFiltrados.map((j) => {
                  const reg: RegistroValue = registros[j.id] ?? { estado: 'no_registrado' };
                  const estado = reg.estado;
                  return (
                    <div key={j.id} className="py-3 px-4 rounded-lg hover:bg-slate-700/30 transition-colors border border-transparent hover:border-slate-700/50">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar nombre={`${j.nombre} ${j.apellidos}`} size="sm" />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{j.nombre} {j.apellidos}</p>
                            <p className="text-xs text-slate-400">{j.categoria}</p>
                          </div>
                        </div>
                        {/* Desktop: 4 buttons */}
                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                          {(Object.keys(ESTADO_LABEL) as EstadoRegistro[]).map((est) => (
                            <button
                              key={est}
                              onClick={() => setEstado(j.id, est)}
                              className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${estadoButtonClass(estado === est, est)}`}
                              title={ESTADO_LABEL[est]}
                            >
                              <span>{ESTADO_DOT[est]}</span>
                              <span className="hidden lg:inline">{ESTADO_LABEL[est]}</span>
                              <span className="lg:hidden">{est === 'presente' ? 'Presente' : est === 'ausente' ? 'Ausente' : est === 'ausente_con_excusa' ? 'C/Excusa' : 'N/R'}</span>
                            </button>
                          ))}
                        </div>
                        {/* Mobile: Select dropdown */}
                        <div className="sm:hidden flex-shrink-0">
                          <select
                            value={estado}
                            onChange={(e) => setEstado(j.id, e.target.value as EstadoRegistro)}
                            className="px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs"
                          >
                            <option value="presente">🟢 Presente</option>
                            <option value="ausente">🔴 Ausente</option>
                            <option value="ausente_con_excusa">🟡 Ausente con excusa</option>
                            <option value="no_registrado">⚪ Sin registrar</option>
                          </select>
                        </div>
                      </div>

                      {/* Inline excusa fields */}
                      {estado === 'ausente_con_excusa' && (
                        <div className="mt-3 p-3 bg-slate-900/50 border border-yellow-700/30 rounded-xl space-y-3">
                          <p className="text-xs font-medium text-yellow-400">Detalles de excusa</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Motivo</label>
                              <select
                                value={reg.motivo ?? ''}
                                onChange={(e) => updateRegistroField(j.id, 'motivo', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                              >
                                <option value="">Seleccione motivo</option>
                                {MOTIVOS_EXCUSA.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Medio</label>
                              <select
                                value={reg.medio ?? ''}
                                onChange={(e) => updateRegistroField(j.id, 'medio', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                              >
                                <option value="">Seleccione medio</option>
                                {MEDIOS_NOTIFICACION.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Observación</label>
                              <input
                                type="text"
                                value={reg.observacion ?? ''}
                                onChange={(e) => updateRegistroField(j.id, 'observacion', e.target.value)}
                                placeholder="Observación"
                                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Fecha excusa</label>
                              <input
                                type="date"
                                value={reg.fecha_excusa ?? ''}
                                onChange={(e) => updateRegistroField(j.id, 'fecha_excusa', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs text-slate-400 mb-1">Observación entrenador</label>
                              <input
                                type="text"
                                value={reg.observacion_entrenador ?? ''}
                                onChange={(e) => updateRegistroField(j.id, 'observacion_entrenador', e.target.value)}
                                placeholder="Observación del entrenador"
                                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-yellow-400">Con excusa</p>
              <p className="text-xl font-bold text-yellow-300">{ausentesConExcusa}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-400">Asistencia</p>
              <p className="text-xl font-bold text-blue-300">{porcentajeGlobal}%</p>
            </div>
          </div>
          {noRegistradosCount > 0 && (
            <p className="text-xs text-slate-400">⚪ Sin registrar: {noRegistradosCount}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">{presentes} presentes</Badge>
            <Badge variant="danger">{ausentes} ausentes</Badge>
            <Badge variant="warning">{ausentesConExcusa} con excusa</Badge>
            {noRegistradosCount > 0 && <Badge variant="default">{noRegistradosCount} Sin registrar</Badge>}
            <Badge variant="info">{asistenciasFiltradas.length} total</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                const headers = ['Jugador', 'Categoria', 'Fecha', 'Estado', 'Motivo', 'Medio', 'Observacion'];
                const rows = asistenciasFiltradas.map((a: any) => [
                  `${a.nombre || ''} ${a.apellidos || ''}`.trim() || a.jugador_nombre || `Jugador #${a.jugador_id}`,
                  a.categoria || '',
                  a.fecha || '',
                  a.estado || (a.presente ? 'presente' : 'ausente'),
                  a.motivo || '',
                  a.medio || '',
                  (a.observacion || '').replace(/"/g, '""'),
                ]);
                const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c}"`).join(',')).join('\n');
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `asistencias_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
              }}>
                Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                const rows = asistenciasFiltradas.map((a: any) => `
                  <tr>
                    <td style="border:1px solid #334155;padding:6px;">${`${a.nombre || ''} ${a.apellidos || ''}`.trim() || a.jugador_nombre || `Jugador #${a.jugador_id}`}</td>
                    <td style="border:1px solid #334155;padding:6px;">${a.categoria || ''}</td>
                    <td style="border:1px solid #334155;padding:6px;">${a.fecha || ''}</td>
                    <td style="border:1px solid #334155;padding:6px;">${a.estado || (a.presente ? 'presente' : 'ausente')}</td>
                    <td style="border:1px solid #334155;padding:6px;">${a.motivo || ''}</td>
                    <td style="border:1px solid #334155;padding:6px;">${a.observacion || ''}</td>
                  </tr>`).join('');
                const html = `<html><head><meta charset="utf-8"><title>Asistencias</title><style>body{font-family:Inter,system-ui;padding:24px;color:#0f172a}table{border-collapse:collapse;width:100%}th{border:1px solid #334155;padding:6px;background:#f1f5f9;text-align:left;font-size:11px;text-transform:uppercase}td{font-size:12px}</style></head><body><h2>Asistencias — ${new Date().toLocaleDateString('es-CO')}</h2><p style="color:#64748b;font-size:12px">${asistenciasFiltradas.length} registros</p><table><thead><tr><th>Jugador</th><th>Categoria</th><th>Fecha</th><th>Estado</th><th>Motivo</th><th>Observacion</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:12px;color:#64748b">Sin registros</td></tr>'}</tbody></table><script>window.print()<` + `/script></body></html>`;
                const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
              }}>
                PDF
              </Button>
            </div>
          </div>

          {/* Enhanced filtros consultar: tipo_actividad, entrenamiento, fecha desde/hasta, jugador, estado */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <FilterSelect
                label="Tipo actividad"
                value={tipoActividad}
                onChange={(v) => setTipoActividad(v as any)}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'entrenamiento', label: 'Entrenamientos' },
                  { value: 'partido', label: 'Partidos' },
                  { value: 'torneo', label: 'Torneos' },
                ]}
              />
              <FilterSelect
                label="Entrenamiento"
                value={entrenamientoFiltro === '' ? '' : String(entrenamientoFiltro)}
                onChange={(v) => setEntrenamientoFiltro(v === '' ? '' : Number(v))}
                options={[
                  { value: '', label: 'Todos los entrenamientos' },
                  ...entrenamientos.map((e: any) => ({
                    value: String(e.id),
                    label: `${e.fecha} ${e.hora ?? ''} · ${e.categoria} · ${e.tema || 'Sin tema'}`.trim(),
                  })),
                ]}
              />
              <FilterSelect
                label="Estado"
                value={estadoFiltro}
                onChange={(v) => setEstadoFiltro(v as any)}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'presente', label: 'Presente' },
                  { value: 'ausente', label: 'Ausente' },
                  { value: 'ausente_con_excusa', label: 'Ausente con excusa' },
                  { value: 'no_registrado', label: 'Sin registrar' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Buscar jugador</label>
                <input
                  type="text"
                  placeholder="Nombre jugador..."
                  value={jugadorFiltroAsistencia}
                  onChange={(e) => setJugadorFiltroAsistencia(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500"
                />
              </div>
            </div>
            {(tipoActividad !== 'todos' || entrenamientoFiltro !== '' || fechaDesde || fechaHasta || jugadorFiltroAsistencia || estadoFiltro !== 'todos') && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setTipoActividad('todos');
                    setEntrenamientoFiltro('');
                    setFechaDesde('');
                    setFechaHasta('');
                    setJugadorFiltroAsistencia('');
                    setEstadoFiltro('todos');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
            <p className="text-[11px] text-slate-500">Filtra por fecha + entrenamiento para responder: &quot;¿Quién asistió al entrenamiento del 23 de septiembre?&quot;</p>
          </div>

          {resumenPorJugador.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-3">Resumen por jugador</h3>
              <div className="space-y-2">
                {resumenPorJugador.map((r) => (
                  <div key={r.jugador_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-700/30 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar nombre={`${r.nombre} ${r.apellidos}`} size="sm" />
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{r.nombre} {r.apellidos}</p>
                        <p className="text-xs text-slate-400 truncate">{r.categoria} · {r.presentes}/{r.total} · {r.ausentes} aus · {r.ausentesConExcusa} exc · {r.noRegistrados} n/r</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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
              const presCat = asistCat.filter((a: any) => resolveEstado(a) === 'presente').length;
              const excCat = asistCat.filter((a: any) => resolveEstado(a) === 'ausente_con_excusa').length;
              return (
                <div key={cat} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{cat}</h3>
                      {catInfo?.profesor_nombre && (
                        <p className="text-xs text-[#22C55E]">Profesor: {catInfo.profesor_nombre}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success">{presCat} presentes</Badge>
                      <Badge variant="danger">{asistCat.length - presCat - excCat} ausentes</Badge>
                      {excCat > 0 && <Badge variant="warning">{excCat} con excusa</Badge>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {asistCat.map((a: any) => {
                      const est: EstadoRegistro = resolveEstado(a);
                      const tipoAct = (a.tipo_actividad ?? a.tipoActividad ?? null) as string | null;
                      return (
                        <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 rounded-lg bg-slate-700/30 gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar nombre={`${a.nombre || ''} ${a.apellidos || ''}`} size="sm" />
                            <div className="min-w-0">
                              <p className="text-white text-sm truncate">{a.nombre} {a.apellidos}</p>
                              {est === 'ausente_con_excusa' && (a.motivo || a.medio || a.observacion || a.fecha_excusa || a.observacion_entrenador) ? (
                                <div className="text-xs text-slate-400 space-y-0.5 mt-0.5">
                                  {a.motivo && <p>Motivo: <span className="text-yellow-300">{a.motivo}</span></p>}
                                  {a.medio && <p>Medio: <span className="text-slate-300">{a.medio}</span></p>}
                                  {a.observacion && <p>Obs: {a.observacion}</p>}
                                  {a.fecha_excusa && <p>Fecha excusa: {a.fecha_excusa}</p>}
                                  {a.observacion_entrenador && <p>Obs. entrenador: {a.observacion_entrenador}</p>}
                                </div>
                              ) : a.observacion ? (
                                <p className="text-xs text-slate-400 truncate">{a.observacion}</p>
                              ) : null}
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="text-xs text-slate-500">{a.fecha}</span>
                                {tipoAct && (
                                  <Badge variant={TIPO_ACTIVIDAD_BADGE_VARIANT[tipoAct] ?? 'default'}>{TIPO_ACTIVIDAD_LABEL[tipoAct] ?? tipoAct}</Badge>
                                )}
                                {a.entrenamiento_id && (
                                  <span className="text-xs text-slate-500">· Entr. #{a.entrenamiento_id}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant={ESTADO_BADGE_VARIANT[est]}>
                            {ESTADO_DOT[est]} {ESTADO_LABEL[est]}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            asistenciasFiltradas.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay asistencia registrada para esta fecha</p>
            ) : (
              <div className="space-y-2">
                {asistenciasFiltradas.map((a: any) => {
                  const est: EstadoRegistro = resolveEstado(a);
                  const tipoAct = (a.tipo_actividad ?? a.tipoActividad ?? null) as string | null;
                  return (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar nombre={`${a.nombre || ''} ${a.apellidos || ''}`} size="sm" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{a.nombre} {a.apellidos}</p>
                          <p className="text-xs text-slate-400">{a.categoria}</p>
                          {est === 'ausente_con_excusa' && (a.motivo || a.medio || a.observacion || a.fecha_excusa || a.observacion_entrenador) && (
                            <div className="text-xs text-slate-400 space-y-0.5 mt-1">
                              {a.motivo && <p>Motivo: <span className="text-yellow-300">{a.motivo}</span></p>}
                              {a.medio && <p>Medio: <span className="text-slate-300">{a.medio}</span></p>}
                              {a.observacion && <p>Obs: {a.observacion}</p>}
                              {a.fecha_excusa && <p>Fecha excusa: {a.fecha_excusa}</p>}
                              {a.observacion_entrenador && <p>Obs. entrenador: {a.observacion_entrenador}</p>}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-xs text-slate-500">{a.fecha}</span>
                            {tipoAct && (
                              <Badge variant={TIPO_ACTIVIDAD_BADGE_VARIANT[tipoAct] ?? 'default'}>{TIPO_ACTIVIDAD_LABEL[tipoAct] ?? tipoAct}</Badge>
                            )}
                            {a.entrenamiento_id && (
                              <span className="text-xs text-slate-500">· Entr. #{a.entrenamiento_id}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={ESTADO_BADGE_VARIANT[est]}>
                        {ESTADO_DOT[est]} {ESTADO_LABEL[est]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
