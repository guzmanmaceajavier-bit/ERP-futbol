export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  error?: string;
}

export interface ApiError {
  error: string;
  detalle?: string;
}

export interface PaginationState {
  pagina: number;
  porPagina: number;
}
