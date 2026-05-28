import { buildHeaders, request } from './client.js';

export function login({ login, password }) {
  return request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password }),
  });
}

export function register({ login, password, display_name }) {
  return request('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password, display_name }),
  });
}

export function getCurrentUser(token) {
  return request('/auth/me', {
    headers: buildHeaders({ token }),
  });
}

export function updateProfile({ display_name, token }) {
  return request('/profile', {
    method: 'PATCH',
    headers: buildHeaders({
      token,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: JSON.stringify({ display_name }),
  });
}
