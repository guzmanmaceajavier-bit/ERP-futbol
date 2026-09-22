export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste';

export interface MovimientoInventario {
  id: number;
  item_id: number;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  motivo: string;
  usuario_id: number;
  usuario_nombre?: string;
  created_at: string;
}

export interface InventarioItem {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string | null;
  alerta_bajo?: boolean;
  movimientos?: MovimientoInventario[];
}

export interface InventarioForm {
  nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string;
}
