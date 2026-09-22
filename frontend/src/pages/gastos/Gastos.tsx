import { useState, useMemo } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { gastoService } from '../../services/gastoService';
import type { Gasto, GastoForm } from '../../types';
import { CATEGORIAS_GASTO } from '../../utils/constants';
import { formatCurrency, formatDate, todayISO } from '../../utils/formatters';
import { DataTable, type Column } from '../../components/data/DataTable';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ActionsCell } from '../../components/ui/ActionsCell';

export function Gastos() {
  const { data: gastos, loading, error, refetch } = useApi(() => gastoService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Gasto>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<GastoForm>({ concepto: '', descripcion: '', monto: 0, categoria: 'General', fecha: todayISO() });
  const [busqueda, setBusqueda] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Gasto | null>(null);
  const [saving, setSaving] = useState(false);

  const busquedaDebounced = useDebounce(busqueda);

  const gastosFiltrados = useMemo(() => {
    if (!gastos) return [];
    return gastos.filter((g) => !busquedaDebounced || g.concepto.toLowerCase().includes(busquedaDebounced.toLowerCase()));
  }, [gastos, busquedaDebounced]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(gastosFiltrados);

  const columns: Column<Gasto>[] = [
    { key: 'concepto', label: 'Concepto', render: (g) => <span className="text-white font-medium">{g.concepto}</span> },
    { key: 'categoria', label: 'Categoria' },
    { key: 'monto', label: 'Monto', render: (g) => <span className="font-mono text-red-400">{formatCurrency(g.monto)}</span> },
    { key: 'fecha', label: 'Fecha', render: (g) => formatDate(g.fecha) },
    {
      key: 'acciones',
      label: '',
      className: 'w-24',
      render: (g) => (
        <ActionsCell onEdit={() => openForm(g)} onDelete={() => setConfirmDelete(g)} />
      ),
    },
  ];

  const openForm = (g?: Gasto) => {
    if (g) { setForm({ concepto: g.concepto, descripcion: g.descripcion || '', monto: g.monto, categoria: g.categoria, fecha: g.fecha }); openEdit(g); }
    else { setForm({ concepto: '', descripcion: '', monto: 0, categoria: 'General', fecha: todayISO() }); openNew(); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await gastoService.update(editing.id, form); showSuccess('Gasto actualizado'); }
      else { await gastoService.create(form); showSuccess('Gasto registrado'); }
      close(); refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await gastoService.remove(confirmDelete.id); showSuccess('Gasto eliminado'); setConfirmDelete(null); refetch(); }
    catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex items-center justify-between">
        <h1 className="font-sport text-2xl font-bold text-white">Gastos</h1>
        <Button onClick={() => openForm()}>+ Nuevo Gasto</Button>
      </div>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar gasto..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(g) => openForm(g)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Gasto' : 'Nuevo Gasto'}>
        <div className="space-y-4">
          <Input label="Concepto" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} required />
          <Input label="Descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Monto" type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })} required />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={CATEGORIAS_GASTO.map((c) => ({ value: c, label: c }))} />
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Registrar'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar gasto" message="¿Estas seguro de eliminar este gasto?" />
    </div>
  );
}
