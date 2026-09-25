import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { entrenamientoService } from '../../services/entrenamientoService';
import { profesorService } from '../../services/profesorService';
import type { Entrenamiento, EntrenamientoForm, Profesor } from '../../types';
import { ESTADOS_ENTRENAMIENTO } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { useCategorias } from '../../hooks/useCategorias';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { ActionsCell } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Icon } from '../../components/ui/Icon';

const EMPTY_FORM: EntrenamientoForm = {
  fecha: new Date().toISOString().split('T')[0],
  hora: '15:00',
  categoria: '',
  entrenador: '',
  lugar: 'Cancha principal',
  tema: '',
  observaciones: '',
  estado: 'programado',
};

export function Entrenamientos() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Entrenamiento[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Entrenamiento>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<EntrenamientoForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Entrenamiento | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const { opciones: opcionesCategoria } = useCategorias();

  // helpers for EstadoEntrenamiento / Asistencias connection
  // ESTADOS_ENTRENAMIENTO is ['programado','completado','cancelado'] – we keep it as-is
  // but handle additional blocked states ('aplazado','suspendido') defensively if backend ever returns them
  const isAsistenciaBlocked = (estado: string) =>
    estado === 'cancelado' || estado === 'aplazado' || estado === 'suspendido';
  const isCompletado = (estado: string) =>
    estado === 'completado' || estado === 'realizado';
  const getBlockedMessage = (estado: string) => {
    if (estado === 'aplazado') return 'Este entrenamiento fue aplazado — no se puede registrar asistencia';
    if (estado === 'suspendido') return 'Este entrenamiento fue suspendido — no se puede registrar asistencia';
    return 'Este entrenamiento fue cancelado — no se puede registrar asistencia';
  };

  const busquedaDebounced = useDebounce(busqueda);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try { const data = await entrenamientoService.getAll(); setItems(data); } catch {}
    try { const p = await profesorService.getAll(); setProfesores(p); } catch {}
    setLoading(false);
  };

  const reload = async () => { try { const data = await entrenamientoService.getAll(); setItems(data); } catch {} };

  const itemsFiltrados = items.filter((e) =>
    !busquedaDebounced ||
    e.tema?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    e.entrenador?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    e.categoria?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(itemsFiltrados);

  const openForm = (e?: Entrenamiento) => {
    if (e) {
      setForm({ fecha: e.fecha, hora: e.hora, categoria: e.categoria, entrenador: e.entrenador, lugar: e.lugar, tema: e.tema, observaciones: e.observaciones, estado: e.estado });
      openEdit(e);
    } else {
      setForm(EMPTY_FORM);
      openNew();
    }
  };

  const handleSave = async () => {
    try {
      if (editing) { await entrenamientoService.update(editing.id, form); showSuccess('Entrenamiento actualizado'); }
      else { await entrenamientoService.create(form); showSuccess('Entrenamiento registrado'); }
      close(); reload();
    } catch (err: any) { showError(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await entrenamientoService.remove(confirmDelete.id); showSuccess('Entrenamiento eliminado'); setConfirmDelete(null); reload(); }
    catch (err: any) { showError(err.message); }
  };

  const estadoColor = (e: string) => {
    if (e === 'completado' || e === 'realizado') return 'success';
    if (e === 'cancelado' || e === 'suspendido') return 'danger';
    if (e === 'aplazado') return 'warning';
    return 'info';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-[#22C55E] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Entrenamientos" subtitle={`${total} registros`} actions={
        <div className="flex gap-2">
          <Link to="/asistencias">
            <Button variant="ghost">Consultar asistencia</Button>
          </Link>
          <Button onClick={() => openForm()}>+ Registrar entrenamiento</Button>
        </div>
      } />

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por tema, entrenador o categoria..." />

      {itemsFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <p className="text-slate-400 mt-4">No hay entrenamientos programados</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginados.map((e) => {
              const blocked = isAsistenciaBlocked(e.estado);
              const completado = isCompletado(e.estado);
              return (
                <div
                  key={e.id}
                  className={`bg-slate-800/50 border rounded-xl p-4 hover:border-slate-600 transition-all cursor-pointer relative group flex flex-col ${blocked ? 'border-red-900/30 opacity-90' : completado ? 'border-green-700/30 hover:border-green-600/50' : 'border-slate-700'}`}
                  onClick={() => openForm(e)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-slate-400" title={formatDate(e.fecha)}>{e.fecha} {e.hora}</span>
                    <Badge variant={estadoColor(e.estado) as any}>{e.estado}</Badge>
                  </div>
                  <h3 className="text-white font-medium mb-1">{e.tema || 'Sin tema'}</h3>
                  <p className="text-sm text-slate-400">{e.categoria}</p>
                  <p className="text-sm text-[#22C55E] mt-1">{e.entrenador || 'Sin asignar'}</p>
                  <p className="text-xs text-slate-500 mt-1">{e.lugar}</p>
                  {e.observaciones && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{e.observaciones}</p>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={(ev) => { ev.stopPropagation(); openForm(e); }} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                      <Icon name="editar" className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(e); }} className="p-1.5 rounded bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400">
                      <Icon name="eliminar" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Asistencias connection */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex-1 flex flex-col justify-end">
                    {blocked ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-2.5 py-2 text-center leading-tight">
                          {getBlockedMessage(e.estado)}
                        </p>
                        <span className="block w-full text-center py-2 px-3 bg-slate-700/50 text-slate-500 text-xs font-medium rounded-lg cursor-not-allowed border border-slate-700">
                          Consultar asistencia — deshabilitado
                        </span>
                      </div>
                    ) : completado ? (
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          navigate('/asistencias', { state: { fecha: e.fecha, categoria: e.categoria, entrenamiento_id: e.id } });
                        }}
                        className="w-full py-2.5 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>Registrar asistencia</span>
                        <Icon name="derecha" className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        to="/asistencias"
                        state={{ fecha: e.fecha, categoria: e.categoria, entrenamiento_id: e.id }}
                        onClick={(ev) => ev.stopPropagation()}
                        className="block w-full text-center py-2 px-3 border border-slate-600 hover:border-[#22C55E]/40 hover:bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium rounded-lg transition-colors"
                      >
                        Consultar asistencia
                      </Link>
                    )}
                    {/* subtle visual connection hint */}
                    {!blocked && (
                      <p className="text-[11px] text-slate-500 text-center mt-1.5">
                        {e.categoria} · {formatDate(e.fecha)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}

      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Entrenamiento' : 'Registrar entrenamiento'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          <Input label="Hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={opcionesCategoria} placeholder={opcionesCategoria.length ? 'Seleccionar...' : 'Primero crea una categoria'} required />
          <Select
            label="Profesor / Entrenador"
            value={form.entrenador}
            onChange={(e) => setForm({ ...form, entrenador: e.target.value })}
            options={profesores.map((p) => ({ value: p.nombre, label: `${p.nombre}${p.especialidad ? ' - ' + p.especialidad : ''}` }))}
            placeholder="Seleccionar profesor..."
          />
          <Input label="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
          <Input label="Tema" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} placeholder="Ej: Tecnica, tactica, fisico..." />
          <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            options={ESTADOS_ENTRENAMIENTO.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <div className="md:col-span-2">
            <Input label="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Registrar'}</Button>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar entrenamiento" message="¿Estas seguro?" />
    </div>
  );
}
