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
import { Textarea } from '../../components/ui/Textarea';
import { NumberInput } from '../../components/ui/NumberInput';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatCurrency } from '../../utils/formatters';
import { ActionsCell } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';

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
  const [movItem, setMovItem] = useState<InventarioItem | null>(null);
  const [movTipo, setMovTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [movCantidad, setMovCantidad] = useState(0);
  const [movMotivo, setMovMotivo] = useState('');
  const [movSaving, setMovSaving] = useState(false);

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
      key: 'acciones', label: '', className: 'w-32',
      render: (i) => (
        <ActionsCell
          onEdit={() => openForm(i)}
          onDelete={() => setConfirmDelete(i)}
          extra={
            <button
              onClick={() => {
                setMovItem(i);
                setMovTipo('entrada');
                setMovCantidad(0);
                setMovMotivo('');
              }}
              className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
              title="Movimientos"
            >
              Movimientos
            </button>
          }
        />
      ),
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

  const handleMovimiento = async () => {
    if (!movItem) return;
    if (movCantidad <= 0) { showError('Cantidad debe ser mayor a 0'); return; }
    setMovSaving(true);
    try {
      await inventarioService.movimiento({ item_id: movItem.id, tipo: movTipo, cantidad: movCantidad, motivo: movMotivo });
      showSuccess(`Movimiento ${movTipo} registrado`);
      setMovItem(null);
      setMovCantidad(0);
      setMovMotivo('');
      refetch();
    } catch (err: any) { showError(err.message || 'Error al registrar movimiento'); } finally { setMovSaving(false); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Inventario" subtitle={`${total} registros`} actions={<Button onClick={() => openForm()}>+ Registrar material</Button>} />
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar item..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(i) => openForm(i)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Actualizar material' : 'Registrar material'}>
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
            <NumberInput label="Stock actual" value={form.stock} onChange={(v) => setForm({ ...form, stock: v === '' ? 0 : v })} min={0} />
            <NumberInput label="Stock minimo" value={form.stock_minimo} onChange={(v) => setForm({ ...form, stock_minimo: v === '' ? 0 : v })} min={0} />
          </div>
          <NumberInput label="Costo unitario" value={form.costo_unitario} onChange={(v) => setForm({ ...form, costo_unitario: v === '' ? 0 : v })} min={0} />
          <Input label="Proveedor" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </FormModal>
      <FormModal isOpen={!!movItem} onClose={() => setMovItem(null)} title={`Movimiento - ${movItem?.nombre ?? ''}`}>
        <div className="space-y-4">
          {movItem && (
            <div className="bg-slate-800 rounded-lg px-3 py-2 flex justify-between items-center border border-slate-700">
              <span className="text-sm text-slate-400">Stock actual</span>
              <span className="font-mono text-white font-bold">{movItem.stock}</span>
            </div>
          )}
          <Select
            label="Tipo"
            value={movTipo}
            onChange={(e) => setMovTipo(e.target.value as 'entrada' | 'salida' | 'ajuste')}
            options={[
              { value: 'entrada', label: 'Entrada' },
              { value: 'salida', label: 'Salida' },
              { value: 'ajuste', label: 'Ajuste' },
            ]}
          />
          <NumberInput label="Cantidad" value={movCantidad} onChange={(v) => setMovCantidad(v === '' ? 0 : v)} min={0} placeholder="0" />
          <Textarea label="Motivo" value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)} placeholder="Motivo del movimiento..." rows={3} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={() => setMovItem(null)}>Cancelar</Button>
          <Button onClick={handleMovimiento} loading={movSaving}>Registrar</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar item" message="¿Estas seguro de eliminar este item del inventario?" />
    </div>
  );
}
