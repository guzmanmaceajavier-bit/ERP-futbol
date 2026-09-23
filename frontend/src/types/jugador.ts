export type TipoIdentificacion = 'Cedula' | 'Tarjeta' | 'Pasaporte';
export type Genero = 'Masculino' | 'Femenino';
export type TipoBeca = 'Normal' | 'Becado 50%' | 'Becado 100%' | 'Patrocinado';
export type EstadoJugador = 'activo' | 'inactivo' | 'retirado';

export interface Jugador {
  id: number;
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  tipo_identificacion: TipoIdentificacion | null;
  numero_identificacion: string | null;
  categoria: string;
  telefono: string;
  mensualidad: number;
  mensualidad_objetivo: number;
  genero: Genero;
  tipo_beca: TipoBeca;
  descuento_beca: number;
  acudiente_nombre: string | null;
  acudiente_telefono: string | null;
  whatsapp_opt_out: boolean;
  activo: boolean;
  estado: EstadoJugador;
  fecha_ingreso: string | null;
  // Hoja de vida
  direccion?: string | null;
  posicion?: string | null;
  numero_camiseta?: number | null;
  tipo_sangre?: string | null;
  eps?: string | null;
  alergias?: string | null;
  condiciones_medicas?: string | null;
  contacto_emergencia?: string | null;
  telefono_emergencia?: string | null;
  created_at: string;
  objetivo_real?: number;
  saldo_pendiente?: number;
  // Calculados (no persisted, vienen de periodos)
  total_pagado?: number;
  deuda_actual?: number;
  proximo_vencimiento?: string | null;
  ultima_asistencia?: string | null;
  ultimo_pago?: string | null;
}

export interface JugadorForm {
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  tipo_identificacion: TipoIdentificacion | '';
  numero_identificacion: string;
  categoria: string;
  telefono: string;
  genero: Genero;
  tipo_beca: TipoBeca;
  acudiente_nombre: string;
  acudiente_telefono: string;
  fecha_ingreso?: string;
  estado?: EstadoJugador;
  direccion?: string;
  posicion?: string;
  numero_camiseta?: number | null;
  tipo_sangre?: string;
  eps?: string;
  alergias?: string;
  condiciones_medicas?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
}

export interface JugadorFiltros {
  busqueda: string;
  categoria: string;
  genero: Genero | '';
  estado: EstadoJugador | '';
}
