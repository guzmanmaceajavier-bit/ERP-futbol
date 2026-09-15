import { apiClient } from './apiClient';
import type { LoginPayload, LoginResponse, VerifyResponse } from '../types';

export const authService = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  register: (data: { username: string; password: string; nombre: string; role: string }) =>
    apiClient.post('/auth/register', data),

  verify: () =>
    apiClient.get<VerifyResponse>('/auth/verify'),
};
