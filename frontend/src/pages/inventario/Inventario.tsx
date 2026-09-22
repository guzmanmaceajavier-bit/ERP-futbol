import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { inventarioService } from '../../services/inventarioService';
import type { InventarioItem, InventarioForm } from '../../types';
import { DataTable, type Column } from '../../components/data/DataTable';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatCurrency } from '../../utils/formatters';
import { ActionsCell } from '../../components/ui/ActionsCell';

const CATEGORIAS_INV = [
  'Balones',
  'Conos',
  'Petos',
  'Arcos',
  'Chalecos',
  'Uniformes',
  'Botiquin',
  'Cintas',
  'Redes',
  'Otros',
];

const EMPTY_FORM: InventarioForm = { nombre: '', categoria: 'Balones', stock: 0, stock_minimo: 0, costo_unitario: 0, proveedor: '' };

export function Inventario() {
  const { data: items, loading, error, refetch } = useApi(() => inventarioService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<InventarioItem>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<InventarioForm>(EMPTY_FORM);
  const [customCategoria, setCustomCategoria] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<InventarioItem | null>(null);
  const [saving, setSaving] = useState(false);

  const busquedaDebounced = useDebounce(busqueda);
  const itemsFiltrados = (items || []).filter((i) => !busquedaDebounced || i.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()));
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(itemsFiltrados);

  const columns: Column<InventarioItem>[] = [
    { key: 'nombre', label: 'Nombre', render: (i) => <span className="text-white font-medium">{i.nombre}</span> },
    { key: 'categoria', label: 'Categoria', render: (i) => <Badge variant="info">{i.categoria}</Badge> },
    { key: 'stock', label: 'Stock', render: (i) => <span className="font-mono">{i.stock}</span> },
    { key: 'stock_minimo', label: 'Minimo', render: (i) => <span className="font-mono text-slate-400">{i.stock_minimo}</span> },
    { key: 'costo_unitario', label: 'Costo', render: (i) => <span className="font-mono">{formatCurrency(i.costo_unitario)}</span> },
    { key: 'alerta_bajo', label: 'Alerta', render: (i) => i.alerta_bajo ? <Badge variant="danger">Bajo</Badge> : null },
    {
      key: 'acciones', label: '', className: 'w-24',
      render: (i) => <ActionsCell onEdit={() => openForm(i)} onDelete={() => setConfirmDelete(i)} />,
    },
  ];

  const openForm = (item?: InventarioItem) => {
    if (item) {
      const isCustom = !CATEGORIAS_INV.includes(item.categoria);
      setForm({ nombre: item.nombre, categoria: isCustom ? 'Otros' : item.categoria, stock: item.stock, stock_minimo: item.stock_minimo, costo_unitario: item.costo_unitario, proveedor: item.proveedor || '' });
      setCustomCategoria(isCustom ? item.categoria : '');
      openEdit(item);
    } else {
      setForm(EMPTY_FORM);
      setCustomCategoria('');
      openNew();
    }
  };

  const handleSave = async () => {
    const finalCategoria = form.categoria === 'Otros' && customCategoria ? customCategoria : form.categoria;
    setSaving(true);
    try {
      const payload = { ...form, categoria: finalCategoria };
      if (editing) { await inventarioService.update(editing.id, payload); showSuccess('Item actualizado'); }
      else { await inventarioService.create(payload); showSuccess('Item creado'); }
      close(); refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await inventarioService.remove(confirmDelete.id); showSuccess('Item eliminado'); setConfirmDelete(null); refetch(); }
    catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-sport text-2xl font-bold text-white">Inventario</h1>
          <p className="text-slate-400 text-sm">{total} registros</p>
        </div>
        <Button onClick={() => openForm()}>+ Agregar Material</Button>
      </div>
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar item..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(i) => openForm(i)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Material' : 'Agregar Material'}>
        <div className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Select
            label="Categoria"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={CATEGORIAS_INV.map((c) => ({ value: c, label: c }))}
          />
          {form.categoria === 'Otros' && (
            <Input label="Escribe la categoria" value={customCategoria} onChange={(e) => setCustomCategoria(e.target.value)} placeholder="Ej: GPS, Radar..." required />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock actual" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            <Input label="Stock minimo" type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} />
          </div>
          <Input label="Costo unitario" type="number" value={form.costo_unitario} onChange={(e) => setForm({ ...form, costo_unitario: Number(e.target.value) })} />
          <Input label="Proveedor" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar item" message="¿Estas seguro de eliminar este item del inventario?" />
    </div>
  );
}
