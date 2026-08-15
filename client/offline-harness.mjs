/**
 * Offline-resilience harness for client/src/lib/api.js (run with plain node).
 * Shims browser globals, flips fetch between up/down, and asserts the
 * queue + cache + sync behavior end-to-end.
 */

// ── browser shims ──
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const listeners = {};
global.window = {
  addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn); },
  removeEventListener: () => {},
  dispatchEvent: (e) => { (listeners[e.type] || []).forEach((fn) => fn(e)); },
};
Object.defineProperty(global, 'navigator', { value: { onLine: true }, configurable: true });
global.CustomEvent = class { constructor(type, opts) { this.type = type; this.detail = opts?.detail; } };

// fetch state machine: 'down' → network error; otherwise routes to mockServer
let netState = 'up';
const received = [];
const mockServer = async (url, options = {}) => {
  if (netState === 'down') throw new TypeError('fetch failed');
  received.push({ url, method: options.method || 'GET' });
  if (url.includes('/api/days') && (options.method || 'GET') === 'POST') {
    return { ok: true, status: 201, json: async () => ({ success: true, data: { _id: 'x' } }) };
  }
  if (url.includes('/api/users/') && (options.method || 'GET') === 'PUT') {
    return { ok: true, status: 200, json: async () => ({ success: true, data: { name: 'ok' } }) };
  }
  if (url.includes('/api/coffees')) {
    return { ok: true, status: 200, json: async () => ({ success: true, data: [{ name: 'Latte' }] }) };
  }
  return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) };
};
global.fetch = (url, options) => Promise.resolve(mockServer(url, options)).catch((e) => { if (netState === 'down') throw e; throw e; });

const assert = (cond, msg) => { if (!cond) { console.error('✗ FAIL:', msg); process.exit(1); } console.log('✓', msg); };

const { api, syncNow, getPendingCount, SYNC_DONE_EVENT } = await import(
  new URL('./src/lib/api.js', `file://${process.cwd()}/`).href
);

// ── 1. write fails while down → queued, not thrown ──
netState = 'down';
let res = await api.createDay({ username: 'alice', coffee_name: 'Latte', count_of_cups: 2, rating: 5 });
assert(res.queued === true, 'day POST while offline resolves as queued');
assert(getPendingCount() === 1, 'queue length is 1');

// ── 2. non-queueable write while down → throws ──
let threw = false;
try { await api.login({ email: 'a@b.c', password: 'x'.repeat(8) }); } catch { threw = true; }
assert(threw, 'login while offline throws (not queued)');

// ── 3. GET while down with empty cache → throws; after a success → cached ──
threw = false;
try { await api.getAllCoffees(); } catch (e) { threw = true; assert(e.offline === true, 'offline+uncached GET throws with offline flag'); }
assert(threw, 'uncached GET while offline throws');

netState = 'up';
res = await api.getAllCoffees();
assert(res.__stale === undefined && res.data[0].name === 'Latte', 'GET while up returns fresh data');

netState = 'down';
res = await api.getAllCoffees();
assert(res.__stale === true && res.data[0].name === 'Latte', 'GET while down falls back to cached copy (__stale)');

// ── 4. sync drains the queue when the server returns ──
let syncDoneFired = false;
listeners[SYNC_DONE_EVENT] = [() => { syncDoneFired = true; }];
netState = 'up';
await syncNow();
assert(getPendingCount() === 0, 'queue drained after sync');
assert(syncDoneFired, 'SYNC_DONE_EVENT fired after successful sync');
assert(received.some((r) => r.method === 'POST' && r.url.includes('/days')), 'queued day POST was retried against server');

// ── 5. server rejects a queued item with 4xx → dropped, not retried forever ──
netState = 'down';
await api.createDay({ username: 'alice', coffee_name: 'Bad', count_of_cups: 1 });
assert(getPendingCount() === 1, 'second offline write queued');
// server now up but returns 400 for this item
global.fetch = async () => ({ ok: false, status: 400, json: async () => ({ success: false, message: 'Validation failed' }) });
await syncNow();
assert(getPendingCount() === 0, '4xx-rejected queue item dropped after one attempt');

console.log('\nAll offline-resilience assertions passed.');
process.exit(0);
