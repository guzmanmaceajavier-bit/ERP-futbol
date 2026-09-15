export interface InventarioItem {
  id: number;
  nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string | null;
  alerta_bajo?: boolean;
}

export interface InventarioForm {
  nombre: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor: string;
}
