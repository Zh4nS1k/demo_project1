/**
 * API client for the Coffee Drinker backend.
 * Uses Next.js rewrites so all requests go through /api/* (same origin).
 */

const API_BASE = '/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  // Attach JWT if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data;
}

// ─── Auth ───
export const api = {
  // Users
  register: (body) =>
    request('/users', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) =>
    request('/users/login', { method: 'POST', body: JSON.stringify(body) }),

  getAllUsers: () => request('/users'),
  getUserById: (id) => request(`/users/${id}`),
  getUserByUsername: (username) => request(`/users/username/${username}`),
  updateUser: (id, body) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Coffees
  createCoffee: (body) =>
    request('/coffees', { method: 'POST', body: JSON.stringify(body) }),
  getAllCoffees: (params = '') => request(`/coffees${params}`),
  getCoffeeById: (id) => request(`/coffees/${id}`),
  getCoffeeByName: (name) => request(`/coffees/name/${name}`),
  updateCoffee: (id, body) =>
    request(`/coffees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoffee: (id) => request(`/coffees/${id}`, { method: 'DELETE' }),

  // Days
  createDay: (body) =>
    request('/days', { method: 'POST', body: JSON.stringify(body) }),
  getAllDays: (params = '') => request(`/days${params}`),
  getDayById: (id) => request(`/days/${id}`),
  getDaysByUsername: (username) => request(`/days/user/${username}`),
  getUserSummary: (username) => request(`/days/summary/${username}`),
  updateDay: (id, body) =>
    request(`/days/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDay: (id) => request(`/days/${id}`, { method: 'DELETE' }),
};
