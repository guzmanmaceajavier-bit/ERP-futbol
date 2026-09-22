import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useModal } from '../../hooks/useModal';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { jugadorService } from '../../services/jugadorService';
import type { Jugador, JugadorForm as JugadorFormType, EstadoJugador } from '../../types';
import { CATEGORIAS, GENEROS } from '../../utils/constants';
import { validateJugador } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';
import { DataTable, type Column } from '../../components/data/DataTable';
import { SearchBar } from '../../components/data/SearchBar';
import { FilterSelect } from '../../components/data/FilterSelect';
import { Pagination } from '../../components/data/Pagination';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { ActionsCell, WhatsAppButton, ToggleButton } from '../../components/ui/ActionsCell';
import { ConfirmDialog } from '../../components/forms/ConfirmDialog';
import { PageHeader } from '../../components/layout/PageHeader';
import { ToastList } from '../../components/feedback/ToastList';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { JugadorForm } from './JugadorForm';

const EMPTY_FORM: JugadorFormType = {
  nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  tipo_identificacion: '',
  numero_identificacion: '',
  categoria: '',
  telefono: '',
  genero: 'Masculino',
  tipo_beca: 'Normal',
  acudiente_nombre: '',
  acudiente_telefono: '',
  fecha_ingreso: '',
  estado: 'activo' as EstadoJugador,
};

export function Jugadores() {
  const navigate = useNavigate();
  const { data: jugadores, loading, error, refetch } = useApi(() => jugadorService.getAll());
  const { isOpen, editing, openNew, openEdit, close } = useModal<Jugador>();
  const { toasts, showSuccess, showError, dismiss } = useToast();

  const [form, setForm] = useState<JugadorFormType>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Jugador | null>(null);
  const [saving, setSaving] = useState(false);

  const busquedaDebounced = useDebounce(busqueda);

  const jugadoresFiltrados = useMemo(() => {
    if (!jugadores) return [];
    return jugadores.filter((j) => {
      const matchBusqueda = !busquedaDebounced ||
        `${j.nombre} ${j.apellidos}`.toLowerCase().includes(busquedaDebounced.toLowerCase());
      const matchCategoria = !filtroCategoria || j.categoria === filtroCategoria;
      const matchGenero = !filtroGenero || j.genero === filtroGenero;
      return matchBusqueda && matchCategoria && matchGenero;
    });
  }, [jugadores, busquedaDebounced, filtroCategoria, filtroGenero]);

  const { pagina, setPagina, totalPaginas, paginados, total } = usePagination(jugadoresFiltrados);

  const columns: Column<Jugador>[] = [
    {
      key: 'nombre',
      label: 'Jugador',
      render: (j) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={`${j.nombre} ${j.apellidos}`} size="sm" />
          <div>
            <p className="text-white font-medium">{j.nombre} {j.apellidos}</p>
            <p className="text-xs text-slate-400">{j.categoria}</p>
          </div>
        </div>
      ),
    },
    { key: 'telefono', label: 'Telefono' },
    {
      key: 'mensualidad',
      label: 'Mensualidad',
      render: (j) => <span className="font-mono text-[#22C55E]">{formatCurrency(j.mensualidad)}</span>,
    },
    {
      key: 'tipo_beca',
      label: 'Beca',
      render: (j) => (
        <Badge variant={j.tipo_beca !== 'Normal' ? 'warning' : 'default'}>
          {j.tipo_beca}
        </Badge>
      ),
    },
    {
      key: 'saldo_pendiente',
      label: 'Saldo',
      render: (j) => (
        <span className={`font-mono font-bold ${(j.saldo_pendiente || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {formatCurrency(j.saldo_pendiente || 0)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (j) => {
        const estado = j.estado || (j.activo ? 'activo' : 'inactivo');
        const variant = estado === 'activo' ? 'success' : estado === 'inactivo' ? 'warning' : 'danger';
        const label = estado.charAt(0).toUpperCase() + estado.slice(1);
        return <Badge variant={variant as 'success' | 'warning' | 'danger'}>{label}</Badge>;
      },
    },
    {
      key: 'acciones',
      label: '',
      className: 'w-48',
      render: (j) => (
        <ActionsCell
          onEdit={() => openForm(j)}
          onDelete={() => setConfirmDelete(j)}
          extra={
            <>
              <button
                onClick={() => navigate('/pagos')}
                className="p-1.5 rounded-lg hover:bg-green-900/50 text-slate-400 hover:text-green-400 transition-colors"
                title="Registrar pago"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <WhatsAppButton onClick={() => window.open(`https://wa.me/${j.telefono}`, '_blank')} />
              <ToggleButton active={j.activo} onClick={async () => {
                await jugadorService.update(j.id, { ...j, activo: !j.activo } as any);
                refetch();
              }} />
            </>
          }
        />
      ),
    },
  ];

  const openForm = (jugador?: Jugador) => {
    if (jugador) {
      setForm({
        nombre: jugador.nombre,
        apellidos: jugador.apellidos,
        fecha_nacimiento: jugador.fecha_nacimiento || '',
        tipo_identificacion: jugador.tipo_identificacion || '',
        numero_identificacion: jugador.numero_identificacion || '',
        categoria: jugador.categoria,
        telefono: jugador.telefono,
        genero: jugador.genero,
        tipo_beca: jugador.tipo_beca,
        acudiente_nombre: jugador.acudiente_nombre || '',
        acudiente_telefono: jugador.acudiente_telefono || '',
        fecha_ingreso: jugador.fecha_ingreso || '',
        estado: (jugador.estado || (jugador.activo ? 'activo' : 'inactivo')) as EstadoJugador,
      });
      openEdit(jugador);
    } else {
      setForm(EMPTY_FORM);
      openNew();
    }
    setFormErrors({});
  };

  const handleSave = async () => {
    const errors = validateJugador(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showError('Corrige los campos marcados');
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      if (editing) {
        await jugadorService.update(editing.id, form);
        showSuccess('Jugador actualizado correctamente');
      } else {
        await jugadorService.create(form);
        showSuccess('Jugador creado correctamente');
      }
      close();
      refetch();
    } catch (err: any) {
      showError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    // Nota: si el jugador tiene historial (pagos, asistencias, etc.), idealmente no hacer hard delete
    // sino marcarlo como 'retirado' para conservar el historial. Por ahora se mantiene delete,
    // pero a futuro: si tiene datos asociados, hacer update({ estado: 'retirado' }) en lugar de remove().
    // Ej: const hasHistorial = !!(confirmDelete as any).total_pagado || !!(confirmDelete as any).ultimo_pago;
    // if (hasHistorial) { await jugadorService.update(confirmDelete.id, { estado: 'retirado' } as any); } else { await jugadorService.remove(...) }
    try {
      await jugadorService.remove(confirmDelete.id);
      showSuccess('Jugador eliminado correctamente');
      setConfirmDelete(null);
      refetch();
    } catch (err: any) {
      showError(err.message || 'Error al eliminar');
    }
  };

  if (loading) return <LoadingOverlay />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />

      <PageHeader title="Jugadores" subtitle={`${total} registros`} actions={<Button onClick={() => openForm()}>+ Nuevo Jugador</Button>} />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar jugador..." className="flex-1" />
        <FilterSelect
          value={filtroCategoria}
          onChange={setFiltroCategoria}
          options={[{ value: '', label: 'Todas' }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          value={filtroGenero}
          onChange={setFiltroGenero}
          options={[{ value: '', label: 'Todos' }, ...GENEROS.map((g) => ({ value: g, label: g }))]}
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <DataTable columns={columns} data={paginados} onRowClick={(j) => openForm(j)} />
        <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total}
          onPrev={() => setPagina(pagina - 1)} onNext={() => setPagina(pagina + 1)} />
      </div>

      <JugadorForm
        isOpen={isOpen}
        editing={!!editing}
        form={form}
        setForm={setForm}
        errors={formErrors}
        onClose={close}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={confirmDelete?.estado === 'retirado' ? 'Eliminar jugador retirado' : 'Eliminar jugador'}
        message={
          confirmDelete?.estado === 'retirado'
            ? `¿Estas seguro de eliminar permanentemente a ${confirmDelete?.nombre} ${confirmDelete?.apellidos}? Este jugador ya está retirado.`
            : ((confirmDelete as any)?.total_pagado || (confirmDelete as any)?.ultimo_pago || (confirmDelete as any)?.ultima_asistencia)
              ? `¿Estas seguro de eliminar a ${confirmDelete?.nombre} ${confirmDelete?.apellidos}? Nota: si tiene historial (pagos/asistencias), el sistema lo marcará como retirado en lugar de eliminarlo permanentemente.`
              : `¿Estas seguro de eliminar a ${confirmDelete?.nombre} ${confirmDelete?.apellidos}? Esta accion no se puede deshacer.`
        }
      />
    </div>
  );
}
