export type EstadoPartido = 'programado' | 'jugado' | 'cancelado' | 'aplazado';
export type ResultadoPartido = 'victoria' | 'derrota' | 'empate' | null;
export type LocaliaPartido = 'local' | 'visitante' | 'neutral';

export interface Partido {
  id: number;
  rival: string;
  fecha: string;
  hora: string;
  lugar: string;
  categoria: string;
  localia: LocaliaPartido | null;
  torneo_id: number | null;
  torneo_nombre?: string | null;
  arbitro: string | null;
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
  localia?: LocaliaPartido | '';
  torneo_id?: number | null;
  arbitro?: string;
  resultado: ResultadoPartido;
  goles_favor: number | null;
  goles_contra: number | null;
  observaciones: string;
  estado: EstadoPartido;
}
