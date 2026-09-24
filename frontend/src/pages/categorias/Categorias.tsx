import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { categoriaService } from '../../services/categoriaService';
import { profesorService } from '../../services/profesorService';
import type { Categoria, Profesor } from '../../types';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { NumberInput } from '../../components/ui/NumberInput';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatCurrency } from '../../utils/formatters';
import { validateCategoria } from '../../utils/validators';
import { ActionsCell } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Pagination } from '../../components/data/Pagination';

interface FormState {
  nombre: string;
  tipo_genero: string;
  mensualidad_base: number;
  profesor_id: string;
  edad_min: number | '';
  edad_max: number | '';
  horario: string;
  dias_entrenamiento: string;
  cancha: string;
  cupo_maximo: number | '';
}

const EMPTY_FORM: FormState = { nombre: '', tipo_genero: 'Masculino', mensualidad_base: 0, profesor_id: '', edad_min: '', edad_max: '', horario: '', dias_entrenamiento: '', cancha: '', cupo_maximo: '' };

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

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination((categorias || []) as any);

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
        edad_min: (cat as any).edad_min ?? '',
        edad_max: (cat as any).edad_max ?? '',
        horario: (cat as any).horario ?? '',
        dias_entrenamiento: (cat as any).dias_entrenamiento ?? '',
        cancha: (cat as any).cancha ?? '',
        cupo_maximo: (cat as any).cupo_maximo ?? '',
      });
      openEdit(cat);
    } else {
      setForm(EMPTY_FORM);
      openNew();
    }
  };

  const handleSave = async () => {
    const errors = validateCategoria({ nombre: form.nombre, mensualidad_base: form.mensualidad_base });
    if (Object.keys(errors).length > 0) { showError(errors.nombre || errors.mensualidad_base || 'Corrige los campos'); return; }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      tipo_genero: form.tipo_genero,
      mensualidad_base: form.mensualidad_base,
      profesor_id: form.profesor_id !== '' ? Number(form.profesor_id) : null,
      edad_min: form.edad_min !== '' ? Number(form.edad_min) : null,
      edad_max: form.edad_max !== '' ? Number(form.edad_max) : null,
      horario: form.horario.trim() || null,
      dias_entrenamiento: form.dias_entrenamiento.trim() || null,
      cancha: form.cancha.trim() || null,
      cupo_maximo: form.cupo_maximo !== '' ? Number(form.cupo_maximo) : null,
    };
    try {
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
      <PageHeader title="Categorias" actions={<Button onClick={() => openForm()}>+ Registrar categoria</Button>} />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados as any} onRowClick={(c) => openForm(c)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total} onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Actualizar categoria' : 'Registrar categoria'}>
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
           <NumberInput label="Mensualidad base" value={form.mensualidad_base} onChange={(v) => setForm({ ...form, mensualidad_base: v === '' ? 0 : v })} min={0} placeholder="0" />
          <div className="grid grid-cols-2 gap-4">
            <NumberInput label="Edad minima" value={form.edad_min} onChange={(v) => setForm({ ...form, edad_min: v })} min={0} placeholder="Ej: 12" />
            <NumberInput label="Edad maxima" value={form.edad_max} onChange={(v) => setForm({ ...form, edad_max: v })} min={0} placeholder="Ej: 14" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Horario" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Ej: 16:00 - 18:00" />
            <Input label="Cancha" value={form.cancha} onChange={(e) => setForm({ ...form, cancha: e.target.value })} placeholder="Ej: Cancha 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dias de entrenamiento" value={form.dias_entrenamiento} onChange={(e) => setForm({ ...form, dias_entrenamiento: e.target.value })} placeholder="Ej: Lun/Mie/Vie" />
            <NumberInput label="Cupo maximo" value={form.cupo_maximo} onChange={(v) => setForm({ ...form, cupo_maximo: v })} min={0} placeholder="Ej: 25" />
          </div>
          <Select
            label="Profesor encargado"
            value={form.profesor_id}
            onChange={(e) => setForm({ ...form, profesor_id: e.target.value })}
            options={[{ value: '', label: '-- Sin asignar --' }, ...profesores.filter(p => p.activo !== false).map((p) => ({ value: String(p.id), label: `${p.nombre}${p.especialidad ? ' (' + p.especialidad + ')' : ''}` }))]}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Registrar'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar categoria" message="No se puede eliminar si tiene jugadores activos." confirmLabel="Entendido" />
    </div>
  );
}
