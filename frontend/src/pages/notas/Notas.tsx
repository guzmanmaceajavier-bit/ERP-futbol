import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useModal } from '../../hooks/useModal';
import { notaService } from '../../services/notaService';
import { jugadorService } from '../../services/jugadorService';
import type { Nota, NotaForm, Jugador } from '../../types';
import { TIPOS_NOTA } from '../../utils/constants';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ToastList } from '../../components/feedback/ToastList';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { Icon } from '../../components/ui/Icon';
import { formatDateTime } from '../../utils/formatters';

export function Notas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Nota>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<NotaForm & { jugador_id: number }>({ jugador_id: 0, nota: '', tipo: 'otra', visibilidad: 'privada' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Nota | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroJugador, setFiltroJugador] = useState('');

  const busquedaDebounced = useDebounce(busqueda);

  useEffect(() => { loadAll(); }, [filtroJugador]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const j = await jugadorService.getAll();
      setJugadores(j);
      if (filtroJugador) {
        const n = await notaService.getAll(Number(filtroJugador));
        setNotas(n);
      } else {
        const allNotasNested = await Promise.all(j.map((jug: Jugador) => notaService.getAll(jug.id).catch(() => [] as Nota[])));
        setNotas(allNotasNested.flat());
      }
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  };

  const notasFiltradas = notas.filter((n) => {
    const matchBus = !busquedaDebounced || n.nota?.toLowerCase().includes(busquedaDebounced.toLowerCase());
    const matchJug = !filtroJugador || String(n.jugador_id) === filtroJugador;
    return matchBus && matchJug;
  });

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(notasFiltradas);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await notaService.remove(editing.id);
        await notaService.create(form);
        showSuccess('Nota actualizada');
      } else {
        await notaService.create(form);
        showSuccess('Nota registrada');
      }
      close();
      loadAll();
    } catch (err: any) { showError(err.message); } finally { setSaving(false); }
  };

  const openEditNota = (n: Nota) => {
    setForm({ jugador_id: n.jugador_id, nota: n.nota, tipo: n.tipo, visibilidad: n.visibilidad });
    openEdit(n);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await notaService.remove(confirmDelete.id); showSuccess('Nota eliminada'); setConfirmDelete(null); loadAll(); }
    catch (err: any) { showError(err.message); }
  };

  const getTipoVariant = (tipo?: string): 'info' | 'warning' | 'danger' | 'success' | 'default' => {
    switch (tipo) {
      case 'disciplinaria': return 'danger';
      case 'medica': return 'warning';
      case 'deportiva': return 'success';
      case 'administrativa': return 'info';
      default: return 'default';
    }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={loadAll} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Notas" subtitle={`${total} registros`} actions={<Button onClick={() => { setForm({ jugador_id: 0, nota: '', tipo: 'otra', visibilidad: 'privada' }); openNew(); }}>+ Registrar nota</Button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar notas..." className="flex-1" />
        <Select
          label=""
          value={filtroJugador}
          onChange={(e) => setFiltroJugador(e.target.value)}
          options={[{ value: '', label: 'Todos' }, ...jugadores.map((j) => ({ value: String(j.id), label: `${j.nombre} ${j.apellidos}` }))]}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {notasFiltradas.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No hay notas registradas</p>
        ) : (
          <>
            <div className="divide-y divide-slate-700/50">
              {paginados.map((n) => (
                <div key={n.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-800/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{n.nota}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {n.tipo && <Badge variant={getTipoVariant(n.tipo)}>{n.tipo}</Badge>}
                      {n.visibilidad && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${n.visibilidad === 'privada' ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-green-900/30 text-green-300 border-green-700'}`}>
                          {n.visibilidad === 'privada' ? '🔒 privada' : '🌐 publica'}
                        </span>
                      )}
                      <p className="text-xs text-slate-400">{n.creador_nombre || 'Sistema'}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(n.created_at)}</p>
                      {(() => {
                        const jug = jugadores.find((j) => j.id === n.jugador_id);
                        return jug ? <span className="text-xs text-slate-500">· {jug.nombre} {jug.apellidos}</span> : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEditNota(n)}
                      className="p-1.5 rounded hover:bg-blue-900/50 text-slate-500 hover:text-blue-400 transition-colors">
                      <Icon name="editar" className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(n)}
                      className="p-1.5 rounded hover:bg-red-900/50 text-slate-500 hover:text-red-400 transition-colors">
                      <Icon name="eliminar" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
              onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
          </>
        )}
      </div>

      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar nota' : 'Registrar nota'}>
        <div className="space-y-4">
          <Select
            label="Jugador"
            value={String(form.jugador_id)}
            onChange={(e) => setForm({ ...form, jugador_id: Number(e.target.value) })}
            options={jugadores.map((j) => ({ value: String(j.id), label: `${j.nombre} ${j.apellidos}` }))}
            placeholder="Seleccionar jugador..."
          />
          <Select
            label="Tipo"
            value={form.tipo || 'otra'}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as NotaForm['tipo'] })}
            options={TIPOS_NOTA.map((t) => ({ value: t, label: t }))}
          />
          <Select
            label="Visibilidad"
            value={form.visibilidad || 'privada'}
            onChange={(e) => setForm({ ...form, visibilidad: e.target.value as NotaForm['visibilidad'] })}
            options={[
              { value: 'publica', label: 'Publica' },
              { value: 'privada', label: 'Privada' },
            ]}
          />
          <Textarea label="Nota" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} required placeholder="Escribe tu nota..." rows={3} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Guardar'}</Button>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar nota" message="¿Estas seguro de eliminar esta nota?" />
    </div>
  );
}
