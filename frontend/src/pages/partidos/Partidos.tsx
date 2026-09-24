import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { partidoService } from '../../services/partidoService';
import { torneoService } from '../../services/torneoService';
import type { Partido, PartidoForm, LocaliaPartido, Torneo } from '../../types';
import { CATEGORIAS, ESTADOS_PARTIDO, RESULTADOS_PARTIDO, LOCALIAS_PARTIDO } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { DataTable, type Column } from '../../components/data/DataTable';
import { SearchBar } from '../../components/data/SearchBar';
import { Pagination } from '../../components/data/Pagination';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormModal } from '../../components/forms/FormModal';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { ToastList } from '../../components/feedback/ToastList';
import { Icon } from '../../components/ui/Icon';

const EMPTY_FORM: PartidoForm = {
  rival: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: '16:00',
  lugar: '',
  categoria: '',
  localia: '',
  torneo_id: null,
  arbitro: '',
  resultado: null,
  goles_favor: null,
  goles_contra: null,
  observaciones: '',
  estado: 'programado',
};

export function Partidos() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Partido[]>([]);
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, editing, openNew, openEdit, close } = useModal<Partido>();
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [form, setForm] = useState<PartidoForm>(EMPTY_FORM);
  const [confirmDelete, setConfirmDelete] = useState<Partido | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [viewPartido, setViewPartido] = useState<Partido | null>(null);

  const busquedaDebounced = useDebounce(busqueda);

  useEffect(() => { reload(); }, []);

  const reload = async () => {
    setLoading(true);
    try { const data = await partidoService.getAll(); setItems(data); } catch {}
    try { const t = await torneoService.getAll(); setTorneos(t); } catch {}
    setLoading(false);
  };

  const itemsFiltrados = items.filter((p) =>
    !busquedaDebounced ||
    p.rival?.toLowerCase().includes(busquedaDebounced.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busquedaDebounced.toLowerCase())
  );

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(itemsFiltrados);

  const openForm = (p?: Partido) => {
    if (p) { setForm({ rival: p.rival, fecha: p.fecha, hora: p.hora, lugar: p.lugar, categoria: p.categoria, localia: p.localia || '', torneo_id: p.torneo_id ?? null, arbitro: p.arbitro || '', resultado: p.resultado, goles_favor: p.goles_favor, goles_contra: p.goles_contra, observaciones: p.observaciones, estado: p.estado }); openEdit(p); }
    else { setForm(EMPTY_FORM); openNew(); }
  };

  const handleSave = async () => {
    try {
      if (editing) { await partidoService.update(editing.id, form); showSuccess('Partido actualizado'); }
      else { await partidoService.create(form); showSuccess('Partido registrado'); }
      close(); reload();
    } catch (err: any) { showError(err.message); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try { await partidoService.remove(confirmDelete.id); showSuccess('Partido eliminado'); setConfirmDelete(null); reload(); }
    catch (err: any) { showError(err.message); }
  };

  const resultadoColor = (r: string | null) => {
    if (r === 'victoria') return 'success';
    if (r === 'derrota') return 'danger';
    return 'warning';
  };

  const localiaVariant = (l: string | null) => {
    if (l === 'local') return 'success' as const;
    if (l === 'visitante') return 'warning' as const;
    if (l === 'neutral') return 'info' as const;
    return 'default' as const;
  };

  const estadoVariant = (e: string) => {
    if (e === 'programado') return 'info' as const;
    if (e === 'jugado') return 'success' as const;
    if (e === 'cancelado') return 'danger' as const;
    if (e === 'aplazado') return 'warning' as const;
    return 'default' as const;
  };

  const columns: Column<Partido>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (p) => (
        <span className="font-mono text-sm whitespace-nowrap">
          {formatDate(p.fecha)} <span className="text-slate-400">{p.hora}</span>
        </span>
      ),
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (p) => <span className="text-slate-300 text-sm">{p.categoria || '—'}</span>,
    },
    {
      key: 'rival',
      label: 'Rival',
      render: (p) => (
        <div>
          <p className="text-white font-medium text-sm">vs {p.rival}</p>
          {p.lugar && <p className="text-xs text-slate-500">{p.lugar}</p>}
        </div>
      ),
    },
    {
      key: 'localia',
      label: 'Localia',
      render: (p) => p.localia ? <Badge variant={localiaVariant(p.localia)}>{p.localia.charAt(0).toUpperCase() + p.localia.slice(1)}</Badge> : <span className="text-slate-500 text-sm">—</span>,
    },
    {
      key: 'torneo',
      label: 'Torneo',
      render: (p) => <span className="text-slate-300 text-sm">{p.torneo_nombre ?? (p.torneo_id ? `#${p.torneo_id}` : '—')}</span>,
    },
    {
      key: 'resultado',
      label: 'Resultado',
      render: (p) => {
        if (p.goles_favor == null || p.goles_contra == null) return <span className="text-slate-500">—</span>;
        const color = p.resultado === 'victoria' ? 'text-[#22C55E]' : p.resultado === 'derrota' ? 'text-red-400' : p.resultado === 'empate' ? 'text-yellow-400' : 'text-slate-200';
        return (
          <span className={`font-mono font-bold text-sm ${color}`}>
            {p.goles_favor} - {p.goles_contra}
            {p.resultado && <Badge variant={resultadoColor(p.resultado) as any} className="ml-2">{p.resultado}</Badge>}
          </span>
        );
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => <Badge variant={estadoVariant(p.estado)}>{p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</Badge>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      className: 'w-36',
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setViewPartido(p); }}
            className="p-1.5 rounded-md bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 hover:text-white transition-all"
            title="Ver"
          >
            <Icon name="ver" className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openForm(p); }}
            className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all"
            title="Editar"
          >
            <Icon name="editar" className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
            className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
            title="Eliminar"
          >
            <Icon name="eliminar" className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-[#22C55E] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Partidos" subtitle={`${total} registros`} actions={<Button onClick={() => openForm()}>+ Registrar partido</Button>} />

      <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por rival o categoria..." />

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(p) => setViewPartido(p)} emptyMessage="No hay partidos programados" />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>

      {/* Detail view modal */}
      <FormModal isOpen={!!viewPartido} onClose={() => setViewPartido(null)} title="Ver partido" wide>
        {viewPartido && (
          <div className="space-y-5">
            {/* EFUSA vs RIVAL header with score */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-5 text-center">
              <p className="text-xs tracking-widest text-slate-400 font-semibold mb-2">PARTIDO</p>
              <h3 className="text-white font-bold text-xl">
                EFUSA <span className="text-slate-400 font-normal mx-2">vs</span> {viewPartido.rival}
              </h3>
              <div className="mt-3">
                {viewPartido.goles_favor != null && viewPartido.goles_contra != null ? (
                  <p className="font-mono font-bold text-3xl">
                    <span className="text-white">{viewPartido.goles_favor}</span>
                    <span className="text-slate-500 mx-3">VS</span>
                    <span className="text-white">{viewPartido.goles_contra}</span>
                  </p>
                ) : (
                  <p className="font-mono text-slate-500 text-lg">— : —</p>
                )}
                {viewPartido.resultado && (
                  <Badge variant={resultadoColor(viewPartido.resultado) as any} className="mt-2">
                    {viewPartido.resultado.charAt(0).toUpperCase() + viewPartido.resultado.slice(1)}
                  </Badge>
                )}
                {viewPartido.estado !== 'jugado' && !viewPartido.resultado && (
                  <p className="text-xs text-slate-500 mt-1">Partido no jugado</p>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-3">
                {formatDate(viewPartido.fecha)} {viewPartido.hora} {viewPartido.lugar ? `| ${viewPartido.lugar}` : ''} | {viewPartido.categoria}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {viewPartido.localia && <Badge variant={localiaVariant(viewPartido.localia)}>{viewPartido.localia}</Badge>}
                <Badge variant={estadoVariant(viewPartido.estado)}>{viewPartido.estado}</Badge>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Categoria</p>
                <p className="text-white font-medium mt-1">{viewPartido.categoria || '—'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Torneo</p>
                <p className="text-white font-medium mt-1">{viewPartido.torneo_nombre ?? (viewPartido.torneo_id ? `#${viewPartido.torneo_id}` : '—')}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Arbitro</p>
                <p className="text-white font-medium mt-1">{viewPartido.arbitro || '—'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Lugar</p>
                <p className="text-white font-medium mt-1">{viewPartido.lugar || '—'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Goles</p>
                <p className="text-white font-mono font-bold mt-1">
                  {viewPartido.goles_favor != null && viewPartido.goles_contra != null ? `${viewPartido.goles_favor} - ${viewPartido.goles_contra}` : '—'}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Convocados</p>
                <p className="text-white font-medium mt-1">
                  {(viewPartido as any).convocados_count ?? (viewPartido as any).convocados?.length ?? '—'}
                </p>
              </div>
            </div>

            {/* Tarjetas if exists */}
            {(viewPartido as any).tarjetas && (
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tarjetas</p>
                <p className="text-white text-sm">{String((viewPartido as any).tarjetas)}</p>
              </div>
            )}

            {/* Observaciones */}
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{viewPartido.observaciones || '—'}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-between pt-2 border-t border-slate-700">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setViewPartido(null); navigate('/convocatorias'); }}>
                  Ver convocatorias
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setViewPartido(null); navigate('/asistencias'); }}>
                  Asistencia
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setViewPartido(null)}>Cerrar</Button>
                <Button onClick={() => { const p = viewPartido; setViewPartido(null); if (p) openForm(p); }}>Editar</Button>
              </div>
            </div>
          </div>
        )}
      </FormModal>

      <FormModal isOpen={isOpen} onClose={close} title={editing ? 'Editar Partido' : 'Registrar partido'} wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Rival" value={form.rival} onChange={(e) => setForm({ ...form, rival: e.target.value })} required placeholder="Nombre del equipo rival" />
          <Input label="Fecha" type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
          <Input label="Hora" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required />
          <Select label="Categoria" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            options={CATEGORIAS.map((c) => ({ value: c, label: c }))} placeholder="Seleccionar..." required />
          <Input label="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} placeholder="Ej: Cancha principal" />
          <Select label="Localia" value={(form.localia as string) || ''} onChange={(e) => setForm({ ...form, localia: e.target.value as LocaliaPartido || '' })}
            options={LOCALIAS_PARTIDO.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} placeholder="Seleccionar..." />
          <Select label="Torneo" value={form.torneo_id != null ? String(form.torneo_id) : ''} onChange={(e) => setForm({ ...form, torneo_id: e.target.value ? Number(e.target.value) : null })} options={torneos.map((t) => ({ value: String(t.id), label: t.nombre }))} placeholder="Sin torneo" />
          <Input label="Arbitro" value={form.arbitro || ''} onChange={(e) => setForm({ ...form, arbitro: e.target.value })} placeholder="Nombre del arbitro" />
          <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
            options={ESTADOS_PARTIDO.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          <Select label="Resultado" value={form.resultado || ''} onChange={(e) => setForm({ ...form, resultado: e.target.value as any || null })}
            options={RESULTADOS_PARTIDO.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} placeholder="Pendiente" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Goles a favor" type="number" value={form.goles_favor ?? ''} onChange={(e) => setForm({ ...form, goles_favor: e.target.value ? Number(e.target.value) : null })} />
            <Input label="Goles en contra" type="number" value={form.goles_contra ?? ''} onChange={(e) => setForm({ ...form, goles_contra: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Registrar'}</Button>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Eliminar partido" message={`¿Estas seguro de eliminar el partido vs ${confirmDelete?.rival}?`} />
    </div>
  );
}
