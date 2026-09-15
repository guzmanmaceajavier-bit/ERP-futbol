import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { whatsappService } from '../services/whatsappService';
import { LoadingOverlay } from '../components/feedback/LoadingOverlay';
import { ToastList } from '../components/feedback/ToastList';
import { Badge } from '../components/ui/Badge';
import type { WhatsAppPlantilla, WhatsAppHistorialEntry } from '../types';

export function WhatsApp() {
  const [plantillas, setPlantillas] = useState<WhatsAppPlantilla[]>([]);
  const [historial, setHistorial] = useState<WhatsAppHistorialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, dismiss } = useToast();

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

  if (loading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      <ToastList toasts={toasts} onDismiss={dismiss} />
      <h1 className="font-sport text-2xl font-bold text-white">WhatsApp</h1>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h2 className="font-sport font-bold text-white mb-4">Plantillas disponibles</h2>
        {plantillas.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay plantillas disponibles.</p>
        ) : (
          <div className="space-y-2">
            {plantillas.map((p) => (
              <div key={p.codigo} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-700/30">
                <div>
                  <p className="text-white text-sm font-medium">{p.nombre}</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg truncate">{p.mensaje}</p>
                </div>
                <Badge variant={p.aprobada_meta ? 'success' : 'warning'}>
                  {p.aprobada_meta ? 'Aprobada' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h2 className="font-sport font-bold text-white mb-4">Historial de envios</h2>
        {historial.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay envios registrados aun.</p>
        ) : (
          <div className="space-y-2">
            {historial.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div>
                  <p className="text-white text-sm">{h.jugador_nombre || `Jugador #${h.jugador_id}`}</p>
                  <p className="text-xs text-slate-400">{h.telefono} | {h.tipo}</p>
                </div>
                <Badge variant={h.estado === 'enviado' ? 'success' : h.estado === 'error' ? 'danger' : 'warning'}>
                  {h.estado}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
