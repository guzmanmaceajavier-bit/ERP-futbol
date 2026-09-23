import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { torneoService } from '../../services/torneoService';
import type { Torneo, TorneoForm, EstadoTorneo } from '../../types';
import { CATEGORIAS, ESTADOS_TORNEO } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
import { ActionsCell } from '../../components/ui/ActionsCell';
import { PageHeader } from '../../components/layout/PageHeader';

const EMPTY_FORM: TorneoForm = { nombre: '', tipo_genero: '', categoria_requerida: '', fecha_inicio: '', fecha_fin: '', lugar: '', costo: 0, estado: 'proximo', equipos_participantes: [], observacion: '' };

type EquipoRow = { id: number; nombre: string; ciudad: string };

function parseEquipoRow(raw: unknown, idx: number): EquipoRow {
  if (typeof raw === 'object' && raw !== null && 'nombre' in (raw as Record<string, unknown>)) {
    const obj = raw as Record<string, unknown>;
    return {
      id: typeof obj.id === 'number' ? obj.id : idx + 1,
      nombre: String(obj.nombre ?? '').trim(),
      ciudad: String((obj as Record<string, unknown>).ciudad ?? '').trim(),
    };
  }
  const s = String(raw ?? '').trim();
  const sep = ' - ';
  const idxSep = s.indexOf(sep);
  if (idxSep !== -1) {
    return { id: idx + 1, nombre: s.slice(0, idxSep).trim(), ciudad: s.slice(idxSep + sep.length).trim() };
  }
  return { id: idx + 1, nombre: s, ciudad: '' };
}

function stringifyEquipo(e: EquipoRow): string {
  return e.ciudad ? `${e.nombre} - ${e.ciudad}` : e.nombre;
}

export function Torneos() {
  const { data: torneos, loading, error, refetch } = useApi(() => torneoService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Torneo>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<TorneoForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Torneo | null>(null);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [equipos, setEquipos] = useState<EquipoRow[]>([]);
  const [equipoNombre, setEquipoNombre] = useState('');
  const [equipoCiudad, setEquipoCiudad] = useState('');
  const [editingEquipoId, setEditingEquipoId] = useState<number | null>(null);
  const [showEquipoForm, setShowEquipoForm] = useState(false);

  const busquedaDebounced = useDebounce(busqueda);
  const torneosFiltrados = (torneos || []).filter((t) => !busquedaDebounced || t.nombre.toLowerCase().includes(busquedaDebounced.toLowerCase()));
  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(torneosFiltrados);

  const columns: Column<Torneo>[] = [
    { key: 'nombre', label: 'Nombre', render: (t) => <span className="text-white font-medium">{t.nombre}</span> },
    { key: 'categoria_requerida', label: 'Categoria', render: (t) => <Badge variant="info">{t.categoria_requerida || 'Todas'}</Badge> },
    { key: 'fecha_inicio', label: 'Inicio', render: (t) => formatDate(t.fecha_inicio) },
    { key: 'fecha_fin', label: 'Fin', render: (t) => formatDate(t.fecha_fin) },
    { key: 'lugar', label: 'Lugar' },
    { key: 'costo', label: 'Costo', render: (t) => <span className="font-mono text-[#22C55E]">{formatCurrency(t.costo)}</span> },
    { key: 'convocados', label: 'Convocados', render: (t) => <span className="font-mono">{t.convocados || 0}</span> },
    {
      key: 'acciones', label: '', className: 'w-24',
      render: (t) => <ActionsCell onEdit={() => openForm(t)} onDelete={() => setConfirmDelete(t)} />,
    },
  ];

  const openForm = (t?: Torneo) => {
    if (t) {
      const rawEquipos = (t.equipos_participantes || []) as unknown[];
      const parsed = rawEquipos.map((r, idx) => parseEquipoRow(r, idx));
      setEquipos(parsed);
      setForm({ nombre: t.nombre, tipo_genero: t.tipo_genero || '', categoria_requerida: t.categoria_requerida || '', fecha_inicio: t.fecha_inicio || '', fecha_fin: t.fecha_fin || '', lugar: t.lugar || '', costo: t.costo, estado: t.estado || 'proximo', equipos_participantes: (t.equipos_participantes || []) as string[], observacion: t.observacion || '' });
      openEdit(t);
    } else {
      setForm(EMPTY_FORM);
      setEquipos([]);
      openNew();
    }
    setShowEquipoForm(false);
    setEditingEquipoId(null);
    setEquipoNombre('');
    setEquipoCiudad('');
  };

  const syncEquiposToForm = (next: EquipoRow[]) => {
    setForm((prev) => ({ ...prev, equipos_participantes: next.map(stringifyEquipo) }));
  };

  const handleEquipoSave = () => {
    const nombre = equipoNombre.trim();
    if (!nombre) return;
    const ciudad = equipoCiudad.trim();
    if (editingEquipoId !== null) {
      const next = equipos.map((e) => (e.id === editingEquipoId ? { ...e, nombre, ciudad } : e));
      setEquipos(next);
      syncEquiposToForm(next);
    } else {
      const newId = equipos.length > 0 ? Math.max(...equipos.map((e) => e.id)) + 1 : 1;
      const next = [...equipos, { id: newId, nombre, ciudad }];
      setEquipos(next);
      syncEquiposToForm(next);
    }
    setEquipoNombre('');
    setEquipoCiudad('');
    setEditingEquipoId(null);
    setShowEquipoForm(false);
  };

  const handleEquipoEdit = (row: EquipoRow) => {
    setEquipoNombre(row.nombre);
    setEquipoCiudad(row.ciudad);
    setEditingEquipoId(row.id);
    setShowEquipoForm(true);
  };

  const handleEquipoDelete = (id: number) => {
    const next = equipos.filter((e) => e.id !== id);
    // reindex not needed, keep ids stable but display # is index-based
    setEquipos(next);
    syncEquiposToForm(next);
    if (editingEquipoId === id) {
      setEditingEquipoId(null);
      setEquipoNombre('');
      setEquipoCiudad('');
      setShowEquipoForm(false);
    }
  };

  const handleEquipoCancel = () => {
    setEquipoNombre('');
    setEquipoCiudad('');
    setEditingEquipoId(null);
    setShowEquipoForm(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: TorneoForm = { ...form, equipos_participantes: equipos.map(stringifyEquipo) };
      if (editing) { await torneoService.update(editing.id, payload); showSuccess('Torneo actualizado'); }
      else { await torneoService.create(payload); showSuccess('Torneo registrado'); }
      close(); refetch();
    } catch (err: unknown) { showError(err instanceof Error ? err.message : String(err)); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await torneoService.remove(confirmDelete.id); showSuccess('Torneo eliminado'); setConfirmDelete(null); refetch(); }
    catch (err: unknown) { showError(err instanceof Error ? err.message : String(err)); }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Torneos" subtitle={`${total} registros`} actions={<Button onClick={() => openForm()}>+ Registrar torneo</Button>} />
      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar torneo..." />
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(t) => openForm(t)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>
      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Torneo' : 'Registrar torneo'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre del torneo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Ej: Copa Efusa 2026" />
          <Input label="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Ej: Cancha municipal" />
          <Select label="Categoria requerida" value={form.categoria_requerida} onChange={(e) => setForm({ ...form, categoria_requerida: e.target.value })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Todas" />
          <Input label="Costo de inscripcion" type="number" value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} />
          <Input label="Fecha de inicio" type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
          <Input label="Fecha de fin" type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
          <Select label="Estado" value={(form.estado as string) || 'proximo'} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoTorneo })}
            options={ESTADOS_TORNEO.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ') }))} />
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-300">Equipos participantes</label>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 border border-slate-600 text-slate-300 font-medium">
                {equipos.length} {equipos.length === 1 ? 'equipo participante' : 'equipos participantes'}
              </span>
            </div>

            {equipos.length === 0 ? (
              <div className="border border-dashed border-slate-600 rounded-xl px-4 py-6 text-center">
                <p className="text-sm text-slate-400">No hay equipos agregados aún.</p>
                <p className="text-xs text-slate-500 mt-1">Usa &quot;Agregar equipo&quot; para sumar participantes con nombre y ciudad.</p>
              </div>
            ) : (
              <div className="border border-slate-600 rounded-xl overflow-hidden">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700/60 text-slate-300 text-xs uppercase tracking-wider">
                        <th className="text-left px-3 py-2.5 font-semibold w-12">#</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Equipo</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Ciudad</th>
                        <th className="text-right px-3 py-2.5 font-semibold w-32">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {equipos.map((eq, idx) => (
                        <tr key={eq.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-white font-medium">{eq.nombre}</td>
                          <td className="px-3 py-2.5 text-slate-300">{eq.ciudad || <span className="text-slate-500 italic">—</span>}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEquipoEdit(eq)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEquipoDelete(eq.id)}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-700">
                  {equipos.map((eq, idx) => (
                    <div key={eq.id} className="px-3 py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-slate-600 text-xs font-mono text-slate-300">{idx + 1}</span>
                          <span className="text-white font-medium truncate">{eq.nombre}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{eq.ciudad ? `Ciudad: ${eq.ciudad}` : 'Sin ciudad'}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEquipoEdit(eq)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEquipoDelete(eq.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showEquipoForm ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-3 bg-slate-700/30 border border-slate-600 rounded-xl items-end">
                <Input
                  label="Nombre del equipo"
                  value={equipoNombre}
                  onChange={(e) => setEquipoNombre(e.target.value)}
                  placeholder="Ej: Real Juvenil"
                  autoFocus
                />
                <Input
                  label="Ciudad"
                  value={equipoCiudad}
                  onChange={(e) => setEquipoCiudad(e.target.value)}
                  placeholder="Ej: Medellín"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEquipoSave(); } }}
                />
                <div className="flex gap-2 md:pt-6">
                  <Button size="sm" onClick={handleEquipoSave} disabled={!equipoNombre.trim()}>
                    {editingEquipoId !== null ? 'Actualizar' : 'Agregar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleEquipoCancel}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowEquipoForm(true)}>
                + Agregar equipo
              </Button>
            )}
          </div>
          <div className="md:col-span-2">
            <Input label="Observaciones" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} placeholder="Detalles adicionales..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Registrar'}</Button>
        </div>
      </FormModal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar torneo" message={`¿Estas seguro de eliminar "${confirmDelete?.nombre}"?`} />
    </div>
  );
}
