import { isDemoMode, setDemoMode, demoHandle } from './demoStore';

const API_BASE = '/api';

let _backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.status === 404) return false;
    if (res.status === 405) return false;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return false;
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (_backendAvailable === null) {
    _backendAvailable = await checkBackend();
    if (!_backendAvailable) {
      setDemoMode(true);
    }
  }

  if (_backendAvailable === false || isDemoMode()) {
    const method = (options.method || 'GET').toUpperCase();
    let body = undefined;
    if (options.body) {
      try { body = JSON.parse(options.body as string); } catch { body = options.body; }
    }
    return demoHandle(method, endpoint, body) as T;
  }

  const token = localStorage.getItem('erp_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
      throw new Error('No autorizado');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error del servidor' }));
      throw new Error(err.error || 'Error del servidor');
    }

    return res.json();
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
      _backendAvailable = false;
      setDemoMode(true);
      const method = (options.method || 'GET').toUpperCase();
      let body = undefined;
      if (options.body) {
        try { body = JSON.parse(options.body as string); } catch { body = options.body; }
      }
      return demoHandle(method, endpoint, body) as T;
    }
    throw err;
  }
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
