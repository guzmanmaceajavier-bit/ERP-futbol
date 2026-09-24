import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { usePagination } from '../../hooks/usePagination';
import { whatsappService } from '../../services/whatsappService';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ToastList } from '../../components/feedback/ToastList';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/layout/PageHeader';
import { Pagination } from '../../components/data/Pagination';
import { FormModal } from '../../components/forms/FormModal';
import type { WhatsAppPlantilla, WhatsAppHistorialEntry } from '../../types';

export function WhatsApp() {
  const [plantillas, setPlantillas] = useState<WhatsAppPlantilla[]>([]);
  const [historial, setHistorial] = useState<WhatsAppHistorialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showSuccess, showError, dismiss } = useToast();

  const { pagina: paginaPlantillas, setPagina: setPaginaPlantillas, totalPaginas: totalPaginasPlantillas, paginados: plantillasPaginadas, total: totalPlantillas } = usePagination(plantillas);
  const { pagina: paginaHistorial, setPagina: setPaginaHistorial, totalPaginas: totalPaginasHistorial, paginados: historialPaginado, total: totalHistorial } = usePagination(historial);

  const [enviarPlantilla, setEnviarPlantilla] = useState<WhatsAppPlantilla | null>(null);
  const [reenviarEntry, setReenviarEntry] = useState<WhatsAppHistorialEntry | null>(null);
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  const isModalOpen = !!enviarPlantilla || !!reenviarEntry;
  const activePlantilla = enviarPlantilla || (reenviarEntry ? plantillas.find((p) => p.codigo === (reenviarEntry as any).tipo || p.codigo === (reenviarEntry as any).plantilla_codigo) || null : null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pl, hist] = await Promise.all([
        whatsappService.getPlantillas(),
        whatsappService.getHistorial(),
      ]);
      setPlantillas(pl);
      setHistorial(hist);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = (plantilla: WhatsAppPlantilla) => {
    setEnviarPlantilla(plantilla);
    setReenviarEntry(null);
    setTelefono('');
  };

  const handleReenviar = (entry: WhatsAppHistorialEntry) => {
    setReenviarEntry(entry);
    setEnviarPlantilla(null);
    setTelefono(entry.telefono || '');
  };

  const handleCloseModal = () => {
    setEnviarPlantilla(null);
    setReenviarEntry(null);
    setTelefono('');
  };

  const handleConfirmEnviar = async () => {
    const tel = telefono.trim();
    if (!tel) {
      showError('Ingresa un teléfono');
      return;
    }
    const plantilla = enviarPlantilla || activePlantilla;
    const entry = reenviarEntry;
    const payload: Record<string, unknown> = {
      accion: 'enviar',
      plantilla_codigo: (plantilla?.codigo || (entry as any)?.tipo || (entry as any)?.plantilla_codigo || ''),
      telefono: tel,
      mensaje_custom: plantilla?.mensaje || entry?.mensaje || activePlantilla?.mensaje || '',
    };
    if (entry?.jugador_id) payload.jugador_id = entry.jugador_id;
    setEnviando(true);
    try {
      await (whatsappService.enviar as unknown as (p: Record<string, unknown>) => Promise<unknown>)(payload);
      showSuccess('Mensaje enviado (demo)');
      handleCloseModal();
      // Optionally refresh historial
      try { const hist = await whatsappService.getHistorial(); setHistorial(hist); } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error enviando mensaje';
      showError(msg);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <PageHeader title="WhatsApp" />

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h2 className="font-sport font-bold text-white mb-4">Plantillas disponibles</h2>
        {plantillas.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay plantillas disponibles.</p>
        ) : (
          <>
            <div className="space-y-2">
              {plantillasPaginadas.map((p) => (
                <div key={p.codigo} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-700/30 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium">{p.nombre}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-lg truncate">{p.mensaje}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={p.aprobada_meta ? 'success' : 'warning'}>
                      {p.aprobada_meta ? 'Aprobada' : 'Pendiente'}
                    </Badge>
                    <Button size="sm" onClick={() => handleEnviar(p)}>Enviar</Button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagina={paginaPlantillas} totalPaginas={totalPaginasPlantillas} total={totalPlantillas} onPrev={() => setPaginaPlantillas(paginaPlantillas - 1)} onNext={() => setPaginaPlantillas(paginaPlantillas + 1)} />
          </>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h2 className="font-sport font-bold text-white mb-4">Historial de envios</h2>
        {historial.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay envios registrados aun.</p>
        ) : (
          <>
            <div className="space-y-2">
              {historialPaginado.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm">{h.jugador_nombre || `Jugador #${h.jugador_id}`}</p>
                    <p className="text-xs text-slate-400">{h.telefono} | {h.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={h.estado === 'enviado' ? 'success' : h.estado === 'error' ? 'danger' : 'warning'}>
                      {h.estado}
                    </Badge>
                    <Button size="sm" variant="secondary" onClick={() => handleReenviar(h)}>Reenviar</Button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagina={paginaHistorial} totalPaginas={totalPaginasHistorial} total={totalHistorial} onPrev={() => setPaginaHistorial(paginaHistorial - 1)} onNext={() => setPaginaHistorial(paginaHistorial + 1)} />
          </>
        )}
      </div>

      <FormModal isOpen={isModalOpen} onClose={handleCloseModal} title={enviarPlantilla ? `Enviar: ${enviarPlantilla.nombre}` : reenviarEntry ? `Reenviar a ${reenviarEntry.jugador_nombre || `Jugador #${reenviarEntry.jugador_id}`}` : 'Enviar mensaje'}>
        <div className="space-y-4">
          {activePlantilla && (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Plantilla: {activePlantilla.nombre} ({activePlantilla.codigo})</p>
              <p className="text-sm text-slate-200 mt-1">{activePlantilla.mensaje}</p>
            </div>
          )}
          {reenviarEntry && !activePlantilla && (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-xs text-slate-400">Mensaje original</p>
              <p className="text-sm text-slate-200 mt-1">{reenviarEntry.mensaje}</p>
            </div>
          )}
          <Input label="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 3001234567" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleConfirmEnviar} loading={enviando}>Enviar</Button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
