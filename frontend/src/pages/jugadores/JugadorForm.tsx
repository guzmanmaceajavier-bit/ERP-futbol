import type { JugadorForm as FormType } from '../../types';
import { CATEGORIAS, GENEROS, TIPOS_BECA } from '../../utils/constants';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { Button } from '../../components/ui/Button';
import { FormModal } from '../../components/forms/FormModal';

interface JugadorFormProps {
  isOpen: boolean;
  editing: boolean;
  form: FormType;
  setForm: (f: FormType) => void;
  errors?: Record<string, string>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

export function JugadorForm({ isOpen, editing, form, setForm, errors = {}, onClose, onSave, saving }: JugadorFormProps) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar Jugador' : 'Nuevo Jugador'} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} error={errors.nombre} required />
        <Input label="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} error={errors.apellidos} required />
        <Input label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} error={errors.telefono} required />
        <DatePicker label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} error={errors.fecha_nacimiento} />
        <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Seleccionar..." required />
        <Select label="Genero" value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value as any })}
          options={GENEROS.map((g) => ({ value: g, label: g }))} />
        <Select label="Tipo de beca" value={form.tipo_beca} onChange={(e) => setForm({ ...form, tipo_beca: e.target.value as any })}
          options={TIPOS_BECA.map((b) => ({ value: b, label: b }))} />
        <Input label="Acudiente (nombre)" value={form.acudiente_nombre} onChange={(e) => setForm({ ...form, acudiente_nombre: e.target.value })} />
        <Input label="Acudiente (telefono)" value={form.acudiente_telefono} onChange={(e) => setForm({ ...form, acudiente_telefono: e.target.value })} />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} loading={saving}>{editing ? 'Actualizar' : 'Crear Jugador'}</Button>
      </div>
    </FormModal>
  );
}
