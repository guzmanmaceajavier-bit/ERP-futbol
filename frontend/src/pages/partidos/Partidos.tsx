import { useState, useEffect } from 'react';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { partidoService } from '../../services/partidoService';
import type { Partido, PartidoForm } from '../../types';
import { CATEGORIAS, ESTADOS_PARTIDO, RESULTADOS_PARTIDO } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { ActionsCell } from '../../components/ui/ActionsCell';

const EMPTY_FORM: PartidoForm = {
  rival: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: '16:00',
  lugar: '',
  categoria: '',
  resultado: null,
  goles_favor: null,
  goles_contra: null,
  observaciones: '',
  estado: 'programado',
};

export function Partidos() {
  const [items, setItems] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Partido>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<PartidoForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Partido | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const busquedaDebounced = useDebounce(busqueda);

  useEffect(() => { reload(); }, []);

  const reload = async () => {
    setLoading(true);
    try { const data = await partidoService.getAll(); setItems(data); } catch {}
    setLoading(false);
  };

  const itemsFiltrados = items.filter((p) =>
    !busquedaDebounced ||
    p.rival?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(itemsFiltrados);

  const openForm = (p?: Partido) => {
    if (p) { setForm({ rival: p.rival, fecha: p.fecha, hora: p.hora, lugar: p.lugar, categoria: p.categoria, resultado: p.resultado, goles_favor: p.goles_favor, goles_contra: p.goles_contra, observaciones: p.observaciones, estado: p.estado }); openEdit(p); }
    else { setForm(EMPTY_FORM); openNew(); }
  };

  const handleSave = async () => {
    try {
      if (editing) { await partidoService.update(editing.id, form); showSuccess('Partido actualizado'); }
      else { await partidoService.create(form); showSuccess('Partido creado'); }
      close(); reload();
    } catch (err: any) { showError(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await partidoService.remove(confirmDelete.id); showSuccess('Partido eliminado'); setConfirmDelete(null); reload(); }
    catch (err: any) { showError(err.message); }
  };

  const resultadoColor = (r: string | null) => {
    if (r === 'victoria') return 'success';
    if (r === 'derrota') return 'danger';
    return 'warning';
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-[#22C55E] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sport text-2xl font-bold text-white">Partidos</h1>
          <p className="text-slate-400 text-sm">{total} registros</p>
        </div>
        <Button onClick={() => openForm()}>+ Nuevo Partido</Button>
      </div>

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por rival o categoria..." />

      {itemsFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <p className="text-slate-400 mt-4">No hay partidos programados</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginados.map((p) => (
              <div key={p.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all cursor-pointer relative group"
                onClick={() => openForm(p)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-slate-400">{p.fecha} {p.hora}</span>
                  <Badge variant={resultadoColor(p.resultado) as any}>{p.estado}</Badge>
                </div>
                <h3 className="text-white font-medium mb-1">vs {p.rival}</h3>
                <p className="text-sm text-slate-400">{p.categoria}</p>
                {p.resultado && (
                  <p className="font-mono text-lg text-[#22C55E] mt-2">
                    {p.goles_favor} - {p.goles_contra}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">{p.lugar}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={(ev) => { ev.stopPropagation(); openForm(p); }} className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(ev) => { ev.stopPropagation(); setConfirmDelete(p); }} className="p-1.5 rounded bg-slate-700 hover:bg-red-900/50 text-slate-300 hover:text-red-400">
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

      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Partido' : 'Nuevo Partido'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Rival" value={form.rival} onChange={(e) => setForm({ ...form, rival: e.target.value })} required placeholder="Nombre del equipo rival" />
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          <Input label="Hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Seleccionar..." required />
          <Input label="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Ej: Cancha principal" />
          <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            options={ESTADOS_PARTIDO.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <Select label="Resultado" value={form.resultado || ''} onChange={(e) => setForm({ ...form, resultado: e.target.value as any || null })}
            options={RESULTADOS_PARTIDO.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} placeholder="Pendiente" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Goles a favor" type="number" value={form.goles_favor ?? ''} onChange={(e) => setForm({ ...form, goles_favor: e.target.value ? Number(e.target.value) : null })} />
            <Input label="Goles en contra" type="number" value={form.goles_contra ?? ''} onChange={(e) => setForm({ ...form, goles_contra: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Crear Partido'}</Button>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar partido" message={`¿Estas seguro de eliminar el partido vs ${confirmDelete?.rival}?`} />
    </div>
  );
}
