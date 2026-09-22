import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { entrenamientoService } from '../../services/entrenamientoService';
import { profesorService } from '../../services/profesorService';
import type { Entrenamiento, EntrenamientoForm, Profesor } from '../../types';
import { CATEGORIAS, ESTADOS_ENTRENAMIENTO } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
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
  const [items, setItems] = useState<Entrenamiento[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Entrenamiento>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<EntrenamientoForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Entrenamiento | null>(null);
  const [busqueda, setBusqueda] = useState('');

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
      else { await entrenamientoService.create(form); showSuccess('Entrenamiento creado'); }
      close(); reload();
    } catch (err: any) { showError(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await entrenamientoService.remove(confirmDelete.id); showSuccess('Entrenamiento eliminado'); setConfirmDelete(null); reload(); }
    catch (err: any) { showError(err.message); }
  };

  const estadoColor = (e: string) => e === 'completado' ? 'success' : e === 'cancelado' ? 'danger' : 'info';

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-[#22C55E] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Entrenamientos" subtitle={`${total} registros`} actions={
        <div className="flex gap-2">
          <Link to="/asistencias">
            <Button variant="ghost">Ver asistencia</Button>
          </Link>
          <Button onClick={() => openForm()}>+ Nuevo Entrenamiento</Button>
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
            {paginados.map((e) => (
              <div key={e.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all cursor-pointer relative group"
                onClick={() => openForm(e)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-slate-400">{e.fecha} {e.hora}</span>
                  <Badge variant={estadoColor(e.estado) as any}>{e.estado}</Badge>
                </div>
                <h3 className="text-white font-medium mb-1">{e.tema || 'Sin tema'}</h3>
                <p className="text-sm text-slate-400">{e.categoria}</p>
                <p className="text-sm text-[#22C55E] mt-1">{e.entrenador || 'Sin asignar'}</p>
                <p className="text-xs text-slate-500 mt-1">{e.lugar}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(ev) => { ev.stopPropagation(); openForm(e); }} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(e); }} className="p-1.5 rounded bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
            onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
        </>
      )}

      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          <Input label="Hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Seleccionar..." required />
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
          <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar entrenamiento" message="¿Estas seguro?" />
    </div>
  );
}
