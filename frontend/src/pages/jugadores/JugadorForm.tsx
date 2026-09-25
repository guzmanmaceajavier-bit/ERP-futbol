import type { JugadorForm as FormType } from '../../types';
import { GENEROS, ESTADOS_JUGADOR } from '../../utils/constants';
import { calcularEdad } from '../../utils/formatters';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { DatePicker } from '../../components/ui/DatePicker';
import { NumberInput } from '../../components/ui/NumberInput';
import { Button } from '../../components/ui/Button';
import { FormModal } from '../../components/forms/FormModal';

interface JugadorFormProps {
  isOpen: boolean;
  editing: boolean;
  form: FormType;
  setForm: (f: FormType) => void;
  /** Categorias creadas en el menu Categorias (fuente unica). */
  categorias: { value: string; label: string }[];
  /** Mensualidad base de una categoria; 0 si no existe. */
  mensualidadDe: (categoria: string) => number;
  errors?: Record<string, string>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero', 'Extremo', 'Volante'] as const;
const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export function JugadorForm({ isOpen, editing, form, setForm, categorias, mensualidadDe, errors = {}, onClose, onSave, saving }: JugadorFormProps) {
  const edad = calcularEdad(form.fecha_nacimiento);

  const handleChange = (patch: Partial<FormType>) => setForm({ ...form, ...patch });

  /** Al elegir categoria, la mensualidad toma el valor base de esa categoria. */
  const handleCategoriaChange = (categoria: string) => {
    const base = mensualidadDe(categoria);
    setForm({ ...form, categoria, mensualidad: base });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={editing ? 'Actualizar ficha' : 'Registrar jugador'} wide>
      {/* Personal */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Datos personales</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input label="Nombre" value={form.nombre} onChange={(e) => handleChange({ nombre: e.target.value })} error={errors.nombre} required />
        <Input label="Apellidos" value={form.apellidos} onChange={(e) => handleChange({ apellidos: e.target.value })} error={errors.apellidos} required />
        <DatePicker label="Fecha de nacimiento" value={form.fecha_nacimiento} onChange={(e) => handleChange({ fecha_nacimiento: e.target.value })} error={errors.fecha_nacimiento} />
        <Input
          label="Edad (automatica)"
          value={form.fecha_nacimiento ? (edad != null ? `${edad} anos` : '-') : ''}
          onChange={() => {}}
          readOnly
          placeholder="Se calcula al elegir la fecha"
          hint="Se calcula sola desde la fecha de nacimiento"
        />
        <Select label="Genero" value={form.genero} onChange={(e) => handleChange({ genero: e.target.value as any })}
          options={GENEROS.map((g) => ({ value: g, label: g }))} />
        <Select label="Tipo documento" value={form.tipo_identificacion} onChange={(e) => handleChange({ tipo_identificacion: e.target.value as any })}
          options={[{ value: 'Cedula', label: 'Cedula' }, { value: 'Tarjeta', label: 'Tarjeta' }, { value: 'Pasaporte', label: 'Pasaporte' }]} placeholder="Seleccionar..." />
        <Input label="Numero documento" value={form.numero_identificacion} onChange={(e) => handleChange({ numero_identificacion: e.target.value })} />
        <Input label="Telefono" value={form.telefono} onChange={(e) => handleChange({ telefono: e.target.value })} error={errors.telefono} required />
        <Input label="Direccion" value={form.direccion || ''} onChange={(e) => handleChange({ direccion: e.target.value })} placeholder="Ej: Calle 10 #5-20" />
      </div>

      {/* Deportivo */}
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informacion deportiva</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Categoria"
          value={form.categoria}
          onChange={(e) => handleCategoriaChange(e.target.value)}
          options={categorias}
          placeholder={categorias.length ? 'Seleccionar...' : 'Primero crea una categoria'}
          error={categorias.length === 0 ? 'No hay categorias creadas en el menu Categorias' : errors.categoria}
          required
        />
        <NumberInput
          label="Mensualidad"
          value={form.mensualidad}
          onChange={(v) => handleChange({ mensualidad: v === '' ? 0 : v })}
          min={0}
          placeholder={form.categoria ? 'Viene de la categoria' : 'Se llena al elegir categoria'}
          hint="Se toma de la mensualidad base de la categoria"
        />
        <Select label="Posicion" value={form.posicion || ''} onChange={(e) => handleChange({ posicion: e.target.value })}
          options={POSICIONES.map((p) => ({ value: p, label: p }))} placeholder="Seleccionar..." />
        <Input label="Numero de camiseta" type="number" value={form.numero_camiseta ?? ''} onChange={(e) => handleChange({ numero_camiseta: e.target.value ? Number(e.target.value) : null })} placeholder="Ej: 10" />
        <DatePicker label="Fecha de ingreso" value={form.fecha_ingreso || ''} onChange={(e) => handleChange({ fecha_ingreso: e.target.value })} />
        <Select label="Estado" value={form.estado || 'activo'} onChange={(e) => handleChange({ estado: e.target.value as any })}
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
