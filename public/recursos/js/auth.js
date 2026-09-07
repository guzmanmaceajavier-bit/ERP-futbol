import { apiFetch } from './configuracion.js';

export async function login(username, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  localStorage.setItem('efusa_token', data.token);
  localStorage.setItem('efusa_user', JSON.stringify(data.usuario));
  return data;
}

export function logout() {
  localStorage.removeItem('efusa_token');
  localStorage.removeItem('efusa_user');
  window.location.href = '/login.html';
}

export function getToken() {
  return localStorage.getItem('efusa_token');
}

export function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('efusa_user'));
  } catch {
    return null;
  }
}

export async function verificarSesion() {
  const token = getToken();
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  try {
    const data = await apiFetch('/auth/verify');
    return data.usuario;
  } catch {
    logout();
    return null;
  }
}
