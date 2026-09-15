export interface WhatsAppPlantilla {
  codigo: string;
  nombre: string;
  mensaje: string;
  aprobada_meta: boolean;
  activa?: boolean;
}

export interface WhatsAppHistorialEntry {
  id: number;
  jugador_id: number;
  jugador_nombre?: string;
  telefono: string;
  plantilla_codigo: string | null;
  mensaje: string;
  tipo: 'individual' | 'masivo' | 'automatico';
  estado: 'enviado' | 'en_cola' | 'pendiente' | 'error';
  enviado_por?: number;
  created_at: string;
}

export type WhatsAppAccion = 'individual' | 'masivo' | 'opt_out';

export interface WhatsAppPayload {
  accion: WhatsAppAccion;
  plantilla_codigo?: string;
  jugador_id?: number;
  jugador_ids?: number[];
  mensaje_custom?: string;
}
