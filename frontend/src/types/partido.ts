export type EstadoPartido = 'programado' | 'jugado' | 'cancelado' | 'aplazado';
export type ResultadoPartido = 'victoria' | 'derrota' | 'empate' | null;

export interface Partido {
  id: number;
  rival: string;
  fecha: string;
  hora: string;
  lugar: string;
  categoria: string;
  resultado: ResultadoPartido;
  goles_favor: number | null;
  goles_contra: number | null;
  observaciones: string;
  estado: EstadoPartido;
  created_at: string;
}

export interface PartidoForm {
  rival: string;
  fecha: string;
  hora: string;
  lugar: string;
  categoria: string;
  resultado: ResultadoPartido;
  goles_favor: number | null;
  goles_contra: number | null;
  observaciones: string;
  estado: EstadoPartido;
}
