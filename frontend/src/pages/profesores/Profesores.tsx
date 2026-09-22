import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { profesorService } from '../../services/profesorService';
import type { Profesor, ProfesorForm } from '../../types';
import { CATEGORIAS } from '../../utils/constants';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ActionsCell, WhatsAppButton } from '../../components/ui/ActionsCell';

const ESPECIALIDADES = [
  ...CATEGORIAS,
  'Arquero',
  'Preparacion fisica',
  'Acondicionamiento',
  'Otros',
];

export function Profesores() {
  const { data: profesores, loading, error, refetch } = useApi(() => profesorService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Profesor>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<ProfesorForm & { especialidad_custom?: string }>({
    nombre: '', telefono: '', especialidad: '', salario: 0, fecha_ingreso: '', especialidad_custom: '',
  });
  const [confirmDelete, setConfirmDelete] = useState<Profesor | null>(null);
  const [saving, setSaving] = useState(false);

  const columns: Column<Profesor>[] = [
    { key: 'nombre', label: 'Nombre', render: (p) => <span className="text-white font-medium">{p.nombre}</span> },
    { key: 'telefono', label: 'Telefono' },
    { key: 'especialidad', label: 'Especialidad', render: (p) => <Badge variant="info">{p.especialidad || 'General'}</Badge> },
    { key: 'salario', label: 'Salario', render: (p) => <span className="font-mono text-[#22C55E]">{formatCurrency(p.salario)}</span> },
    { key: 'fecha_ingreso', label: 'Ingreso', render: (p) => formatDate(p.fecha_ingreso) },
    { key: 'activo', label: 'Estado', render: (p) => <Badge variant={p.activo ? 'success' : 'danger'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'acciones', label: '', className: 'w-32',
      render: (p) => (
        <ActionsCell
          onEdit={() => openForm(p)}
          onDelete={() => setConfirmDelete(p)}
          extra={<WhatsAppButton onClick={() => window.open(`https://wa.me/${p.telefono || ''}`, '_blank')} />}
        />
      ),
    },
  ];

  const openForm = (prof?: Profesor) => {
    if (prof) {
      const isCustom = prof.especialidad && !ESPECIALIDADES.includes(prof.especialidad);
      setForm({
        nombre: prof.nombre,
        telefono: prof.telefono || '',
        especialidad: isCustom ? 'Otros' : (prof.especialidad || ''),
        salario: prof.salario,
        fecha_ingreso: prof.fecha_ingreso || '',
        especialidad_custom: isCustom ? prof.especialidad || '' : '',
      });
      openEdit(prof);
    } else {
      setForm({ nombre: '', telefono: '', especialidad: '', salario: 0, fecha_ingreso: '', especialidad_custom: '' });
      openNew();
    }
  };

  const handleSave = async () => {
    const finalEspecialidad = form.especialidad === 'Otros' && form.especialidad_custom ? form.especialidad_custom : form.especialidad;
    setSaving(true);
    try {
      const payload = { nombre: form.nombre, telefono: form.telefono, especialidad: finalEspecialidad, salario: form.salario, fecha_ingreso: form.fecha_ingreso };
      if (editing) { await profesorService.update(editing.id, payload); showSuccess('Profesor actualizado'); }
      else { await profesorService.create(payload); showSuccess('Profesor creado'); }
      close(); refetch();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await profesorService.remove(confirmDelete.id); showSuccess('Profesor eliminado'); setConfirmDelete(null); refetch(); }
    catch (err: any) { showError(err.message); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <div className="flex items-center justify-between">
        <h1 className="font-sport text-2xl font-bold text-white">Profesores</h1>
        <Button onClick={() => openForm()}>+ Nuevo Profesor</Button>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={profesores || []} onRowClick={(p) => openForm(p)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Profesor' : 'Nuevo Profesor'}>
        <div className="space-y-4">
          <Input label="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          <Input label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Select
            label="Especialidad"
            value={form.especialidad}
            onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
            options={ESPECIALIDADES.map((e) => ({ value: e, label: e }))}
            placeholder="Seleccionar..."
          />
          {form.especialidad === 'Otros' && (
            <Input label="Escribe la especialidad" value={form.especialidad_custom || ''} onChange={(e) => setForm({ ...form, especialidad_custom: e.target.value })} placeholder="Ej: Scouting, Psicologia..." required />
          )}
          <Input label="Salario mensual" type="number" value={form.salario} onChange={(e) => setForm({ ...form, salario: Number(e.target.value) })} />
          <Input label="Fecha de ingreso" type="date" value={form.fecha_ingreso} onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar profesor" message="¿Estas seguro de eliminar este profesor?" />
    </div>
  );
}
