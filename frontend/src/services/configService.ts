import { apiClient } from './apiClient';
import type { ConfigMap } from '../types';

export const configService = {
  getAll: () => apiClient.get<ConfigMap>('/config'),

  update: (keys: Partial<ConfigMap>) =>
    apiClient.put('/config', keys),
};
