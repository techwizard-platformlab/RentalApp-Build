/**
 * API client — all requests go to /api/proxy/* (same-origin Next.js route)
 * The actual backend URL is NEVER exposed to the browser.
 * 
 * Usage:
 *   import api from '@/lib/api';
 *   const data = await api.get('v1/tenants/');
 */

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rental_token');
};

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
};

const request = async (method, path, body = null) => {
  // All traffic goes to /api/proxy/* — same origin, no CORS, no hardcoded IPs
  const url = `/api/proxy/${path}`;
  const options = { method, headers: buildHeaders() };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  if (res.status === 401) {
    // Token expired or invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rental_token');
      localStorage.removeItem('rental_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = text; }

  if (!res.ok) {
    const msg = data?.detail || data?.non_field_errors?.[0] || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
};

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),

  // Auth helpers
  login: async (username, password) => {
    const data = await request('POST', 'v1/auth/login/', { username, password });
    if (data.token) {
      localStorage.setItem('rental_token', data.token);
      localStorage.setItem('rental_user', JSON.stringify(data.user || { username }));
    }
    return data;
  },
  logout: async () => {
    try { await request('POST', 'v1/auth/logout/'); } catch (_) {}
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
  },
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('rental_token');
  },
  getUser: () => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('rental_user')); } catch (_) { return null; }
  },
};

export default api;
