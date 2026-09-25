import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { profesorService } from '../../services/profesorService';
import type { Profesor, ProfesorForm } from '../../types';
import { TIPOS_CONTRATO } from '../../utils/constants';
import { useCategorias } from '../../hooks/useCategorias';
import { DataTable, type Column } from '../../components/data/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ActionsCell, WhatsAppButton } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';
import { Pagination } from '../../components/data/Pagination';

const ESPECIALIDADES_FIJAS = [
  'Arquero',
  'Preparacion fisica',
  'Acondicionamiento',
  'Otros',
];

type ExtendedForm = ProfesorForm & { especialidad_custom?: string };

const EMPTY_FORM: ExtendedForm = {
  nombre: '',
  telefono: '',
  especialidad: '',
  salario: 0,
  fecha_ingreso: '',
  especialidad_custom: '',
  tipo_contrato: '',
  categorias_asignadas: [],
};

export function Profesores() {
  const { data: profesores, loading, error, refetch } = useApi(() => profesorService.getAll());
  const { nombres: nombresCategoria } = useCategorias();
  /** Categorias creadas en el menu + especialidades fijas. */
  const ESPECIALIDADES = [...nombresCategoria, ...ESPECIALIDADES_FIJAS];
  const { isOpen, editing, openNew, openEdit, close } = useModal<Profesor>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<ExtendedForm>({ ...EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState<Profesor | null>(null);
  const [saving, setSaving] = useState(false);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination((profesores || []) as any);

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
        tipo_contrato: (prof.tipo_contrato as ExtendedForm['tipo_contrato']) || '',
        categorias_asignadas: prof.categorias_asignadas || [],
      });
      openEdit(prof);
    } else {
      setForm({ ...EMPTY_FORM });
      openNew();
    }
  };

  const handleSave = async () => {
    const finalEspecialidad = form.especialidad === 'Otros' && form.especialidad_custom ? form.especialidad_custom : form.especialidad;
    setSaving(true);
    try {
      const payload: ProfesorForm = {
        nombre: form.nombre,
        telefono: form.telefono,
        especialidad: finalEspecialidad,
        salario: form.salario,
        fecha_ingreso: form.fecha_ingreso,
        tipo_contrato: (form.tipo_contrato as ProfesorForm['tipo_contrato']) || undefined,
        categorias_asignadas: form.categorias_asignadas || [],
      };
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
      <PageHeader title="Profesores" actions={<Button onClick={() => openForm()}>+ Registrar profesor</Button>} />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados as any} onRowClick={(p) => openForm(p)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total} onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Actualizar profesor' : 'Registrar profesor'}>
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
          <Select
            label="Tipo de contrato"
            value={form.tipo_contrato || ''}
            onChange={(e) => setForm({ ...form, tipo_contrato: e.target.value as ExtendedForm['tipo_contrato'] })}
            options={TIPOS_CONTRATO.map((t) => ({ value: t, label: t }))}
            placeholder="Seleccionar..."
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Categorias asignadas</label>
            <div className="grid grid-cols-2 gap-2">
              {nombresCategoria.length === 0 && (
                <p className="col-span-2 text-xs text-slate-500">No hay categorias creadas en el menu Categorias.</p>
              )}
              {nombresCategoria.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.categorias_asignadas || []).includes(cat)}
                    onChange={(e) => {
                      const current = form.categorias_asignadas || [];
                      const next = e.target.checked ? [...current, cat] : current.filter((c) => c !== cat);
                      setForm({ ...form, categorias_asignadas: next });
                    }}
                    className="rounded border-slate-600 bg-slate-800 text-[#22C55E] focus:ring-[#22C55E]"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <DatePicker label="Fecha de ingreso" value={form.fecha_ingreso} onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Registrar'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar profesor" message="¿Estas seguro de eliminar este profesor?" />
    </div>
  );
}
