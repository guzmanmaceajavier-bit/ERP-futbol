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
import { validateGasto, validateAnulacion } from '../../utils/validators';
import { ActionsCell } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Textarea } from '../../components/ui/Textarea';
import { Icon } from '../../components/ui/Icon';

export function Gastos() {
  const { data: gastos, loading, error, refetch } = useApi(() => gastoService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Gasto>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<GastoForm>({ concepto: '', descripcion: '', monto: 0, categoria: 'General', fecha: todayISO() });
  const [busqueda, setBusqueda] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Gasto | null>(null);
  const [anularGasto, setAnularGasto] = useState<Gasto | null>(null);
  const [motivoAnular, setMotivoAnular] = useState('');
  const [saving, setSaving] = useState(false);

  const busquedaDebounced = useDebounce(busqueda);

  const gastosFiltrados = useMemo(() => {
    if (!gastos) return [];
    return gastos.filter((g) => !busquedaDebounced || g.concepto.toLowerCase().includes(busquedaDebounced.toLowerCase()));
  }, [gastos, busquedaDebounced]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(gastosFiltrados);

  const columns: Column<Gasto>[] = [
    { key: 'concepto', label: 'Concepto', render: (g) => (
      <span className={`${g.anulado ? 'text-slate-500 line-through' : 'text-white'} font-medium`}>{g.concepto}{g.anulado && g.anulado_motivo ? <span className="block text-[10px] text-amber-400 font-normal">Motivo: {g.anulado_motivo}</span> : null}</span>
    ) },
    { key: 'categoria', label: 'Categoria' },
    { key: 'monto', label: 'Monto', render: (g) => <span className={`font-mono ${g.anulado ? 'text-slate-500 line-through' : 'text-red-400'}`}>{formatCurrency(g.monto)}</span> },
    { key: 'fecha', label: 'Fecha', render: (g) => formatDate(g.fecha) },
    {
      key: 'acciones',
      label: '',
      className: 'w-36',
      render: (g) => (
        g.anulado ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-600 text-slate-300 border border-slate-500">Anulado</span>
        ) : (
          <ActionsCell
            onEdit={() => openForm(g)}
            onDelete={() => setConfirmDelete(g)}
            extra={
              <button
                onClick={(e) => { e.stopPropagation(); setAnularGasto(g); setMotivoAnular(''); }}
                className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                title="Anular operacion"
              >
                <Icon name="bloqueo" className="w-4 h-4" />
              </button>
            }
          />
        )
      ),
    },
  ];

  const openForm = (g?: Gasto) => {
    if (g) { setForm({ concepto: g.concepto, descripcion: g.descripcion || '', monto: g.monto, categoria: g.categoria, fecha: g.fecha }); openEdit(g); }
    else { setForm({ concepto: '', descripcion: '', monto: 0, categoria: 'General', fecha: todayISO() }); openNew(); }
  };

  const handleSave = async () => {
    const errors = validateGasto(form);
    if (Object.keys(errors).length > 0) { showError(errors.concepto || errors.monto || errors.categoria || 'Corrige los campos'); return; }
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

  const handleAnular = async () => {
    if (!anularGasto) return;
    const errors = validateAnulacion(motivoAnular);
    if (Object.keys(errors).length > 0) { showError(errors.motivo || 'Motivo invalido'); return; }
    setSaving(true);
    try {
      await gastoService.anular({ gasto_id: anularGasto.id, motivo: motivoAnular });
      showSuccess('Operacion anulada correctamente');
      setAnularGasto(null);
      setMotivoAnular('');
      refetch();
    } catch (err: any) { showError(err.message || 'Error al anular operacion'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Gastos" actions={<Button onClick={() => openForm()}>+ Registrar gasto</Button>} />
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar gasto..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(g) => openForm(g)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Actualizar gasto' : 'Registrar gasto'}>
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

      <FormModal isOpen={!!anularGasto} onClose={() => { setAnularGasto(null); setMotivoAnular(''); }} title="Anular operacion">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            ¿Anular la operacion <span className="text-white font-bold">{anularGasto?.concepto}</span> por <span className="font-mono text-red-400">{formatCurrency(anularGasto?.monto || 0)}</span>?
          </p>
          <Textarea
            label="Motivo de anulacion *"
            placeholder="Minimo 10 caracteres..."
            value={motivoAnular}
            onChange={(e) => setMotivoAnular(e.target.value)}
            rows={3}
            required
          />
          <p className="text-[11px] text-slate-500">Esta accion no se puede deshacer.</p>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button onClick={() => { setAnularGasto(null); setMotivoAnular(''); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors">Cancelar</button>
          <button onClick={handleAnular} disabled={saving} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
            {saving ? 'Anulando...' : 'Anular operacion'}
          </button>
        </div>
      </FormModal>
    </div>
  );
}
