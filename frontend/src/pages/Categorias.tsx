import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useModal } from '../hooks/useModal';
import { useToast } from '../hooks/useToast';
import { categoriaService } from '../services/categoriaService';
import { profesorService } from '../services/profesorService';
import type { Categoria, Profesor } from '../types';
import { DataTable, type Column } from '../components/data/DataTable';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormModal } from '../components/forms/FormModal';
import { ConfirmDialog } from '../components/forms/ConfirmDialog';
import { ToastList } from '../components/feedback/ToastList';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { ErrorState } from '../components/feedback/ErrorState';
import { formatCurrency } from '../utils/formatters';
import { ActionsCell } from '../components/ui/ActionsCell';

interface FormState {
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id: string;
}

const EMPTY_FORM: FormState = { nombre: '', tipo_genero: 'Masculino', mensualidad_base: 0, profesor_id: '' };

export function Categorias() {
  const { data: categorias, loading, error, refetch } = useApi(() => categoriaService.getAll());
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Categoria>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profesorService.getAll().then(setProfesores).catch(() => {});
  }, []);

  const columns: Column<Categoria & { profesor_nombre?: string }>[] = [
    { key: 'nombre', label: 'Nombre', render: (c) => <span className="text-white font-medium">{c.nombre}</span> },
    { key: 'tipo_genero', label: 'Genero', render: (c) => <Badge variant="info">{c.tipo_genero}</Badge> },
    { key: 'mensualidad_base', label: 'Mensualidad', render: (c) => <span className="font-mono text-[#22C55E]">{formatCurrency(c.mensualidad_base)}</span> },
    { key: 'total_jugadores', label: 'Jugadores', render: (c) => <span className="font-mono">{c.total_jugadores || 0}</span> },
    {
      key: 'profesor_nombre',
      label: 'Profesor',
      render: (c) => (
        <span className={c.profesor_nombre ? 'text-white font-medium' : 'text-slate-500 italic'}>
          {c.profesor_nombre || 'Sin asignar'}
        </span>
      ),
    },
    { key: 'activo', label: 'Estado', render: (c) => <Badge variant={c.activo ? 'success' : 'danger'}>{c.activo ? 'Activa' : 'Inactiva'}</Badge> },
    {
      key: 'acciones', label: '', className: 'w-24',
      render: (c) => <ActionsCell onEdit={() => openForm(c)} onDelete={() => setConfirmDelete(c)} />,
    },
  ];

  const openForm = (cat?: Categoria) => {
    if (cat) {
      const profId = (cat as any).profesor_id;
      setForm({
        nombre: cat.nombre,
        tipo_genero: cat.tipo_genero || 'Masculino',
        mensualidad_base: cat.mensualidad_base,
        profesor_id: profId != null ? String(profId) : '',
      });
      openEdit(cat);
    } else {
      setForm(EMPTY_FORM);
      openNew();
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { showError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo_genero: form.tipo_genero,
        mensualidad_base: form.mensualidad_base,
        profesor_id: form.profesor_id !== '' ? Number(form.profesor_id) : null,
      };
      if (editing) {
        await categoriaService.update(editing.id, payload as any);
        showSuccess('Categoria actualizada');
      } else {
        await categoriaService.create(payload as any);
        showSuccess('Categoria creada');
      }
      close();
      refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await categoriaService.remove(confirmDelete.id); showSuccess('Categoria eliminada'); setConfirmDelete(null); refetch(); }
    catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-sport text-2xl font-bold text-white">Categorias</h1>
        <Button onClick={() => openForm()}>+ Nueva Categoria</Button>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={(categorias || []) as any} onRowClick={(c) => openForm(c)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Categoria' : 'Nueva Categoria'}>
        <div className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Sub 14-13" required />
          <Select
            label="Genero"
            value={form.tipo_genero}
            onChange={(e) => setForm({ ...form, tipo_genero: e.target.value })}
            options={[
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' },
              { value: 'Mixto', label: 'Mixto' },
            ]}
          />
          <Input label="Mensualidad base" type="number" value={form.mensualidad_base} onChange={(e) => setForm({ ...form, mensualidad_base: Number(e.target.value) })} />
          <Select
            label="Profesor encargado"
            value={form.profesor_id}
            onChange={(e) => setForm({ ...form, profesor_id: e.target.value })}
            options={[{ value: '', label: '-- Sin asignar --' }, ...profesores.filter(p => p.activo !== false).map((p) => ({ value: String(p.id), label: `${p.nombre}${p.especialidad ? ' (' + p.especialidad + ')' : ''}` }))]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar categoria" message="No se puede eliminar si tiene jugadores activos." confirmLabel="Entendido" />
    </div>
  );
}
