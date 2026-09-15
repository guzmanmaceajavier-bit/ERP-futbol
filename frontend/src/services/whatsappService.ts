import { apiClient } from './apiClient';
import type { WhatsAppPlantilla, WhatsAppHistorialEntry } from '../types';

export const whatsappService = {
  getPlantillas: () =>
    apiClient.get<WhatsAppPlantilla[]>('/whatsapp?tipo=plantillas'),

  getHistorial: () =>
    apiClient.get<WhatsAppHistorialEntry[]>('/whatsapp?tipo=historial'),

  enviar: (payload: { accion: string; jugador_id?: number; jugador_ids?: number[]; plantilla_codigo?: string; mensaje_custom?: string }) =>
    apiClient.post('/whatsapp', payload),
};
