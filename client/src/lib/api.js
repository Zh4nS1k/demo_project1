/**
 * API client for the Coffee Drinker backend.
 * Uses Next.js rewrites so all requests go through /api/* (same origin).
 *
 * Offline resilience:
 * - Eligible writes (day logging, profile updates) that fail due to network
 *   errors or 5xx are queued in localStorage and retried automatically
 *   (on 'online', every 30s, and on app load). They resolve with
 *   { queued: true } so callers can show a "saved locally" state.
 * - Successful GET responses are cached; when a GET fails, the cached copy
 *   is returned with a __stale flag instead of throwing.
 * - Status changes are broadcast via window events (see SYNC_EVENT).
 */

const API_BASE = '/api';
const QUEUE_KEY = 'coffee:queue';
const CACHE_KEY = 'coffee:cache';
const RETRY_INTERVAL = 30000;
const CACHE_MAX_ENTRIES = 40;

/** Writes eligible for offline queueing. Auth, deletes and admin CRUD fail normally. */
const QUEUEABLE = [
  { method: 'POST', pattern: /^\/days\/?$/ },
  { method: 'PUT', pattern: /^\/days\/[^/]+$/ },
  { method: 'PUT', pattern: /^\/users\/[^/]+$/ },
];

let syncing = false;

/* ── storage helpers (private-mode safe) ── */
const readQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
};
const writeQueue = (q) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* full/blocked */ }
};
const readCacheMap = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
};
const writeCacheMap = (m) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(m)); } catch { /* full/blocked */ }
};

/* ── status broadcasting ── */
function emitStatus() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, {
    detail: { online: navigator.onLine, pending: readQueue().length, syncing },
  }));
}

const isQueueable = (method, path) =>
  QUEUEABLE.some((r) => r.method === method && r.pattern.test(path));

/* ── GET cache ── */
function cachePut(path, data) {
  const map = readCacheMap();
  map[path] = { ts: Date.now(), data };
  const keys = Object.keys(map);
  if (keys.length > CACHE_MAX_ENTRIES) {
    keys.sort((a, b) => map[a].ts - map[b].ts)
      .slice(0, keys.length - CACHE_MAX_ENTRIES)
      .forEach((k) => delete map[k]);
  }
  writeCacheMap(map);
}

function staleOrThrow(path) {
  const cached = readCacheMap()[path];
  if (cached) return { ...cached.data, __stale: true };
  const err = new Error('Offline — and no cached copy of this data yet');
  err.offline = true;
  throw err;
}

/* ── write queue ── */
function enqueue(method, path, options) {
  const q = readQueue();
  q.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method,
    path,
    body: options.body || null,
    createdAt: Date.now(),
  });
  writeQueue(q);
  emitStatus();
  return {
    success: true,
    queued: true,
    message: 'Saved locally — will sync automatically when the connection returns',
    data: options.body ? JSON.parse(options.body) : null,
  };
}

async function rawFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

/* ── main request pipeline ── */
async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  let res;
  try {
    res = await rawFetch(path, options);
  } catch {
    if (method === 'GET') return staleOrThrow(path);
    if (isQueueable(method, path)) return enqueue(method, path, options);
    throw new Error('You appear to be offline — try again once reconnected');
  }

  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    if (method === 'GET') cachePut(path, data);
    return data;
  }

  const data = await res.json().catch(() => ({}));

  // Backend down / crashing (5xx): eligible writes wait in the queue
  if (res.status >= 500 && isQueueable(method, path)) {
    return enqueue(method, path, options);
  }

  const err = new Error(data.message || `Request failed: ${res.status}`);
  err.status = res.status;
  err.errors = data.errors;
  throw err;
}

/**
 * Retry all queued writes in order. Entries the server rejects with 4xx
 * (validation/conflict — they'd never succeed) are dropped; 5xx/network
 * failures keep them queued for the next round.
 */
async function syncPending() {
  if (syncing) return;
  const q = readQueue();
  if (q.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    emitStatus();
    return;
  }

  syncing = true;
  emitStatus();

  const remaining = [];
  let syncedAny = false;

  for (const item of q) {
    try {
      const res = await rawFetch(item.path, { method: item.method, body: item.body || undefined });
      if (res.ok) {
        syncedAny = true;
      } else if (res.status >= 400 && res.status < 500) {
        // permanently rejected — drop so it doesn't retry forever
        console.warn(`[sync] dropped ${item.method} ${item.path}: server rejected (${res.status})`);
      } else {
        remaining.push(item); // still down
      }
    } catch {
      remaining.push(item); // network gone again mid-sync
    }
  }

  writeQueue(remaining);
  syncing = false;
  emitStatus();

  if (syncedAny && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_DONE_EVENT));
  }
}

/* ── background sync wiring (browser only) ── */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => syncPending());
  window.addEventListener('offline', emitStatus);
  setInterval(() => {
    if (readQueue().length > 0) syncPending();
  }, RETRY_INTERVAL);
  // try once shortly after load (covers "app opened while server was down")
  setTimeout(() => syncPending(), 1500);
}

/* ── public helpers ── */
export const SYNC_EVENT = 'coffee:sync-status';
export const SYNC_DONE_EVENT = 'coffee:sync-done';
export const getPendingCount = () => readQueue().length;
export const syncNow = syncPending;

/** Build a query string from a params object, skipping empty values. */
function toQueryString(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return qs ? `?${qs}` : '';
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
  getUserByUsername: (username) => request(`/users/username/${encodeURIComponent(username)}`),
  getPublicUser: (username) => request(`/users/public/${encodeURIComponent(username)}`),
  updateUser: (id, body) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // Coffees
  createCoffee: (body) =>
    request('/coffees', { method: 'POST', body: JSON.stringify(body) }),
  getAllCoffees: (params = {}) => request(`/coffees${toQueryString(params)}`),
  getCoffeeById: (id) => request(`/coffees/${id}`),
  getCoffeeByName: (name) => request(`/coffees/name/${encodeURIComponent(name)}`),
  updateCoffee: (id, body) =>
    request(`/coffees/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCoffee: (id) => request(`/coffees/${id}`, { method: 'DELETE' }),

  // Days
  createDay: (body) =>
    request('/days', { method: 'POST', body: JSON.stringify(body) }),
  getAllDays: (params = {}) => request(`/days${toQueryString(params)}`),
  getDayById: (id) => request(`/days/${id}`),
  getDaysByUsername: (username, params = {}) =>
    request(`/days/user/${encodeURIComponent(username)}${toQueryString(params)}`),
  getUserSummary: (username) => request(`/days/summary/${encodeURIComponent(username)}`),
  getLeaderboard: (period = 'week') => request(`/days/leaderboard${toQueryString({ period })}`),
  updateDay: (id, body) =>
    request(`/days/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDay: (id) => request(`/days/${id}`, { method: 'DELETE' }),
};
