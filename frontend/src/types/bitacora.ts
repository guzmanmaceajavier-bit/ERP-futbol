export type AccionBitacora =
  | 'login' | 'logout'
  | 'crear_jugador' | 'editar_jugador' | 'cambiar_estado_jugador'
  | 'registrar_pago' | 'anular_pago'
  | 'registrar_gasto' | 'anular_gasto'
  | 'abrir_caja' | 'cerrar_caja' | 'ajuste_caja'
  | 'movimiento_inventario'
  | 'crear_torneo' | 'editar_torneo'
  | 'crear_entrenamiento' | 'editar_entrenamiento'
  | 'crear_partido' | 'editar_partido'
  | 'crear_convocatoria'
  | 'registrar_asistencia'
  | 'crear_nota' | 'editar_nota'
  | 'gestion_cobranza' | 'envio_whatsapp'
  | 'modificar_config' | 'crear_usuario' | 'cambiar_permisos' | 'backup' | 'restore';

export interface BitacoraEntry {
  id?: number;
  fecha: string;
  usuario_id?: number;
  usuario_nombre: string;
  accion: AccionBitacora | string;
  modulo: string;
  detalle: string;
  antes?: string | null;
  despues?: string | null;
  motivo?: string | null;
}
