export type TipoAlerta = 'DEUDA' | 'ABONO' | 'VENCIMIENTO' | 'MANUAL';
export type TipoOrigen = 'automatica' | 'manual';
export type EstadoCobranza = 'deuda' | 'contactado' | 'prometio_pagar' | 'pagado' | 'descartada';

export interface Alerta {
  id: string | number;
  jugador_id: number | null;
  jugador_nombre?: string;
  nombre: string;
  categoria: string;
  telefono: string;
  pagado?: number;
  deuda: number;
  mensualidad_objetivo?: number;
  mes_abono?: string;
  periodo?: string;
  vencimiento?: string | null;
  tipo_alerta: TipoAlerta;
  tipo: TipoOrigen;
  estado_cobranza: EstadoCobranza;
  ultimo_contacto?: string | null;
  titulo?: string;
  mensaje?: string;
  fecha_vencimiento?: string | null;
  descartada?: boolean;
  created_at?: string;
}

export interface AlertaManualForm {
  titulo: string;
  mensaje: string;
  jugador_id: number | null;
  fecha_vencimiento: string;
}

export type AlertaAccion = 'crear' | 'descartar' | 'restaurar' | 'contactado' | 'prometio_pagar' | 'whatsapp_masivo';
