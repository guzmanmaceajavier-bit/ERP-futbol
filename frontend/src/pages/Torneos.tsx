import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { usePagination } from '../hooks/usePagination';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { torneoService } from '../services/torneoService';
import type { Torneo, TorneoForm } from '../types';
import { CATEGORIAS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DataTable, type Column } from '../components/data/DataTable';
import { SearchBar } from '../components/data/SearchBar';
import { Pagination } from '../components/data/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormModal } from '../components/forms/FormModal';
import { ConfirmDialog } from '../components/forms/ConfirmDialog';
import { ToastList } from '../components/feedback/ToastList';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { ErrorState } from '../components/feedback/ErrorState';
import { ActionsCell } from '../components/ui/ActionsCell';

export function Torneos() {
  const { data: torneos, loading, error, refetch } = useApi(() => torneoService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Torneo>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<TorneoForm>({ nombre: '', tipo_genero: '', categoria_requerida: '', fecha_inicio: '', fecha_fin: '', lugar: '', costo: 0, observacion: '' });
  const [confirmDelete, setConfirmDelete] = useState<Torneo | null>(null);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const busquedaDebounced = useDebounce(busqueda);
  const torneosFiltrados = (torneos || []).filter((t) => !busquedaDebounced || t.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()));
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(torneosFiltrados);

  const columns: Column<Torneo>[] = [
    { key: 'nombre', label: 'Nombre', render: (t) => <span className="text-white font-medium">{t.nombre}</span> },
    { key: 'categoria_requerida', label: 'Categoria', render: (t) => <Badge variant="info">{t.categoria_requerida || 'Todas'}</Badge> },
    { key: 'fecha_inicio', label: 'Inicio', render: (t) => formatDate(t.fecha_inicio) },
    { key: 'fecha_fin', label: 'Fin', render: (t) => formatDate(t.fecha_fin) },
    { key: 'lugar', label: 'Lugar' },
    { key: 'costo', label: 'Costo', render: (t) => <span className="font-mono text-[#22C55E]">{formatCurrency(t.costo)}</span> },
    { key: 'convocados', label: 'Convocados', render: (t) => <span className="font-mono">{t.convocados || 0}</span> },
    {
      key: 'acciones', label: '', className: 'w-24',
      render: (t) => <ActionsCell onEdit={() => openForm(t)} onDelete={() => setConfirmDelete(t)} />,
    },
  ];

  const openForm = (t?: Torneo) => {
    if (t) { setForm({ nombre: t.nombre, tipo_genero: t.tipo_genero || '', categoria_requerida: t.categoria_requerida || '', fecha_inicio: t.fecha_inicio || '', fecha_fin: t.fecha_fin || '', lugar: t.lugar || '', costo: t.costo, observacion: t.observacion || '' }); openEdit(t); }
    else { setForm({ nombre: '', tipo_genero: '', categoria_requerida: '', fecha_inicio: '', fecha_fin: '', lugar: '', costo: 0, observacion: '' }); openNew(); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await torneoService.update(editing.id, form); showSuccess('Torneo actualizado'); }
      else { await torneoService.create(form); showSuccess('Torneo creado'); }
      close(); refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await torneoService.remove(confirmDelete.id); showSuccess('Torneo eliminado'); setConfirmDelete(null); refetch(); }
    catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sport text-2xl font-bold text-white">Torneos</h1>
          <p className="text-slate-400 text-sm">{total} registros</p>
        </div>
        <Button onClick={() => openForm()}>+ Nuevo Torneo</Button>
      </div>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar torneo..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(t) => openForm(t)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Torneo' : 'Nuevo Torneo'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre del torneo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej: Copa Efusa 2026" />
          <Input label="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Ej: Cancha municipal" />
          <Select label="Categoria requerida" value={form.categoria_requerida} onChange={(e) => setForm({ ...form, categoria_requerida: e.target.value })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Todas" />
          <Input label="Costo de inscripcion" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} />
          <Input label="Fecha de inicio" type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
          <Input label="Fecha de fin" type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Observaciones" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Detalles adicionales..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear Torneo'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar torneo" message={`¿Estas seguro de eliminar "${confirmDelete?.nombre}"?`} />
    </div>
  );
}
