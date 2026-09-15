export type TipoAlerta = 'DEUDA' | 'ABONO' | 'VENCIMIENTO' | 'MANUAL';
export type TipoOrigen = 'automatica' | 'manual';

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
  tipo_alerta: TipoAlerta;
  tipo: TipoOrigen;
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

export type AlertaAccion = 'crear' | 'descartar' | 'restaurar' | 'whatsapp_masivo';
