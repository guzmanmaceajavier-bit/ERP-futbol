export interface Nota {
  id: number;
  jugador_id: number;
  nota: string;
  creado_por: number;
  creador_nombre?: string;
  created_at: string;
}

export interface NotaForm {
  jugador_id: number;
  nota: string;
}
