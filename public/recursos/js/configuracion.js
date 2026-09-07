const API_BASE = '/api';

export const CATEGORIAS = [
  'Sub 17-18',
  'Sub 16-15',
  'Sub 14-13',
  'Sub 12-11',
  'Sub 10-9',
  'Sub 8-7',
];

export const MENSUALIDAD_POR_CATEGORIA = {
  'Sub 17-18': 50000,
  'Sub 16-15': 50000,
  'Sub 14-13': 40000,
  'Sub 12-11': 40000,
  'Sub 10-9': 30000,
  'Sub 8-7': 30000,
};

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function getMensualidadObjetivo(categoria) {
  return MENSUALIDAD_POR_CATEGORIA[categoria] || 50000;
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('efusa_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }
  try {
    const response = await fetch(url, { ...options, headers, body });
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') !== -1) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    if (response.status === 401) {
      localStorage.removeItem('efusa_token');
      window.location.href = '/login.html';
      throw new Error('Sesion expirada');
    }
    if (!response.ok) {
      const msg = (responseData && responseData.detalle) || responseData.error || 'Error en el servidor';
      throw new Error(msg);
    }
    return responseData;
  } catch (error) {
    if (error.message !== 'Sesion expirada') {
      console.error('Error en apiFetch:', error);
    }
    throw error;
  }
}
