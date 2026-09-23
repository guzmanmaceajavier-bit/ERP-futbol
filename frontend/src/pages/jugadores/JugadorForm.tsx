import type { JugadorForm as FormType } from '../../types';
import { CATEGORIAS, GENEROS, TIPOS_BECA, ESTADOS_JUGADOR } from '../../utils/constants';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
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

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero', 'Extremo', 'Volante'] as const;
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function JugadorForm({ isOpen, editing, form, setForm, errors = {}, onClose, onSave, saving }: JugadorFormProps) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={editing ? 'Actualizar ficha' : 'Registrar jugador'} wide>
      {/* Personal */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Datos personales</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} error={errors.nombre} required />
        <Input label="Apellidos" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} error={errors.apellidos} required />
        <DatePicker label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} error={errors.fecha_nacimiento} />
        <Select label="Genero" value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value as any })}
          options={GENEROS.map((g) => ({ value: g, label: g }))} />
        <Select label="Tipo documento" value={form.tipo_identificacion} onChange={(e) => setForm({ ...form, tipo_identificacion: e.target.value as any })}
          options={[{ value: 'Cedula', label: 'Cedula' }, { value: 'Tarjeta', label: 'Tarjeta' }, { value: 'Pasaporte', label: 'Pasaporte' }]} placeholder="Seleccionar..." />
        <Input label="Numero documento" value={form.numero_identificacion} onChange={(e) => setForm({ ...form, numero_identificacion: e.target.value })} />
        <Input label="Telefono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} error={errors.telefono} required />
        <Input label="Direccion" value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Ej: Calle 10 #5-20" />
      </div>

      {/* Deportivo */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informacion deportiva</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Seleccionar..." required />
        <Select label="Posicion" value={form.posicion || ''} onChange={(e) => setForm({ ...form, posicion: e.target.value })}
          options={POSICIONES.map((p) => ({ value: p, label: p }))} placeholder="Seleccionar..." />
        <Input label="Numero de camiseta" type="number" value={form.numero_camiseta ?? ''} onChange={(e) => setForm({ ...form, numero_camiseta: e.target.value ? Number(e.target.value) : null })} placeholder="Ej: 10" />
        <DatePicker label="Fecha de ingreso" value={form.fecha_ingreso || ''} onChange={(e) => setForm({ ...form, fecha_ingreso: e.target.value })} />
        <Select label="Tipo de beca" value={form.tipo_beca} onChange={(e) => setForm({ ...form, tipo_beca: e.target.value as any })}
          options={TIPOS_BECA.map((b) => ({ value: b, label: b }))} />
        <Select label="Estado" value={form.estado || 'activo'} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
          options={ESTADOS_JUGADOR.map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))} />
      </div>

      {/* Medica */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informacion medica</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select label="Tipo de sangre" value={form.tipo_sangre || ''} onChange={(e) => setForm({ ...form, tipo_sangre: e.target.value })}
          options={TIPOS_SANGRE.map((t) => ({ value: t, label: t }))} placeholder="Seleccionar..." />
        <Input label="EPS" value={form.eps || ''} onChange={(e) => setForm({ ...form, eps: e.target.value })} placeholder="Ej: Sura, Nueva EPS" />
        <Input label="Alergias" value={form.alergias || ''} onChange={(e) => setForm({ ...form, alergias: e.target.value })} placeholder="Ej: Penicilina, mani" />
        <Textarea label="Condiciones relevantes" value={form.condiciones_medicas || ''} onChange={(e) => setForm({ ...form, condiciones_medicas: e.target.value })} rows={2} placeholder="Ej: Asma leve" />
        <Input label="Contacto de emergencia" value={form.contacto_emergencia || ''} onChange={(e) => setForm({ ...form, contacto_emergencia: e.target.value })} placeholder="Nombre del contacto" />
        <Input label="Telefono de emergencia" value={form.telefono_emergencia || ''} onChange={(e) => setForm({ ...form, telefono_emergencia: e.target.value })} placeholder="Numero de contacto" />
      </div>

      {/* Acudiente */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Acudiente</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input label="Nombre del acudiente" value={form.acudiente_nombre} onChange={(e) => setForm({ ...form, acudiente_nombre: e.target.value })} />
        <Input label="Telefono del acudiente" value={form.acudiente_telefono} onChange={(e) => setForm({ ...form, acudiente_telefono: e.target.value })} />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} loading={saving}>{editing ? 'Guardar cambios' : 'Registrar jugador'}</Button>
      </div>
    </FormModal>
  );
}
