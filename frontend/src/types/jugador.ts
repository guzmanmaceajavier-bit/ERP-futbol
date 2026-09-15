export type TipoIdentificacion = 'Cedula' | 'Tarjeta' | 'Pasaporte';
export type Genero = 'Masculino' | 'Femenino';
export type TipoBeca = 'Normal' | 'Becado 50%' | 'Becado 100%' | 'Patrocinado';

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
  created_at: string;
  objetivo_real?: number;
  saldo_pendiente?: number;
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
}

export interface JugadorFiltros {
  busqueda: string;
  categoria: string;
  genero: Genero | '';
  estado: 'activo' | 'inactivo' | '';
}
