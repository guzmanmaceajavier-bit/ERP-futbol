import { useState, useEffect } from 'react';
import { convocatoriaService } from '../../services/convocatoriaService';
import { partidoService } from '../../services/partidoService';
import { jugadorService } from '../../services/jugadorService';
import { useToast } from '../../hooks/useToast';
import type { Convocado, Partido, Jugador, Convocatoria } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ToastList } from '../../components/feedback/ToastList';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';

export function Convocatorias() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showSuccess, showError, dismiss } = useToast();
  const [selectedPartido, setSelectedPartido] = useState<number | null>(null);
  const [convocados, setConvocados] = useState<Convocado[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, j, c] = await Promise.all([
        partidoService.getAll(),
        jugadorService.getAll(),
        convocatoriaService.getAll()
      ]);
      setPartidos(p);
      setJugadores(j);
      setConvocatorias(c);
    } catch {}
    setLoading(false);
  };

  const openConvocatoria = async (partidoId: number) => {
    setSelectedPartido(partidoId);
    try {
      const existentes = await convocatoriaService.getAll({ partido_id: partidoId });
      if (existentes.length > 0) {
        setConvocados(existentes[0].convocados || []);
      } else {
        const partido = partidos.find((p) => p.id === partidoId);
        const cats = partido?.categoria ? [partido.categoria] : [];
        setConvocados(
          jugadores
            .filter((j) => j.activo && (cats.length === 0 || cats.includes(j.categoria)))
            .map((j) => ({
              jugador_id: j.id,
              jugador_nombre: `${j.nombre} ${j.apellidos}`,
              categoria: j.categoria,
              seleccionado: false,
            }))
        );
      }
    } catch {}
  };

  const toggleConvocado = (idx: number) => {
    setConvocados((prev) => prev.map((c, i) => i === idx ? { ...c, seleccionado: !c.seleccionado } : c));
  };

  const saveConvocatoria = async () => {
    if (!selectedPartido) return;
    const partido = partidos.find((p) => p.id === selectedPartido);
    try {
      const existentes = await convocatoriaService.getAll({ partido_id: selectedPartido });
      if (existentes.length > 0) {
        await convocatoriaService.update(existentes[0].id, { convocados });
      } else {
        await convocatoriaService.create({
          partido_id: selectedPartido,
          categoria: partido?.categoria || '',
          convocados,
        });
      }
      showSuccess('Convocatoria guardada');
      setSelectedPartido(null);
      loadAll();
    } catch (err: any) { showError(err.message); }
  };

  const seleccionados = convocados.filter((c) => c.seleccionado);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="Convocatorias" />

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h2 className="font-sport font-bold text-white mb-4">Partidos</h2>
        {partidos.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay partidos programados. Crea uno primero.</p>
        ) : (
          <div className="space-y-2">
            {partidos.map((p) => {
              const existente = convocatorias.find((c) => c.partido_id === p.id);
              const cnt = (existente?.convocados as any[])?.filter((c: any) => c.seleccionado).length || 0;
              return (
                <div key={p.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                  onClick={() => openConvocatoria(p.id)}>
                  <div>
                    <p className="text-white font-medium">vs {p.rival}</p>
                    <p className="text-xs text-slate-400">{p.fecha} {p.hora} | {p.categoria}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cnt > 0 && <Badge variant="success">{cnt} convocados</Badge>}
                    <Button size="sm" variant="ghost">Convocar</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPartido && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sport font-bold text-white">
              Convocatoria vs {partidos.find((p) => p.id === selectedPartido)?.rival}
            </h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPartido(null)}>Cerrar</Button>
              <Button size="sm" onClick={saveConvocatoria}>Guardar ({seleccionados.length})</Button>
            </div>
          </div>

          {convocados.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay jugadores disponibles para esta categoria</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {convocados.map((c, idx) => (
                <div key={c.jugador_id}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer transition-all
                    ${c.seleccionado ? 'bg-[#22C55E]/10 border border-[#22C55E]/30' : 'bg-slate-700/30 border border-transparent hover:bg-slate-700/50'}`}
                  onClick={() => toggleConvocado(idx)}>
                  <div className="flex items-center gap-3">
                    <Avatar nombre={c.jugador_nombre} size="sm" />
                    <div>
                      <p className="text-white text-sm">{c.jugador_nombre}</p>
                      <p className="text-xs text-slate-400">{c.categoria}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                    ${c.seleccionado ? 'bg-[#22C55E] text-white' : 'bg-slate-600 text-slate-400'}`}>
                    {c.seleccionado ? '\u2713' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {convocatorias.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <h2 className="font-sport font-bold text-white mb-4">Convocatorias guardadas</h2>
          <div className="space-y-2">
            {convocatorias.map((cv) => {
              const cnt = (cv.convocados as any[])?.filter((c: any) => c.seleccionado).length || 0;
              const partido = partidos.find((p) => p.id === cv.partido_id);
              return (
                <div key={cv.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white text-sm">vs {partido?.rival || ''} | {partido?.fecha || ''}</p>
                    <p className="text-xs text-slate-400">{cv.categoria}</p>
                  </div>
                  <Badge variant="success">{cnt} jugadores</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
