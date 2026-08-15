'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

/* ─────────────────────────── Gate ─────────────────────────── */

function AdminContent() {
  const { user } = useAuth();
  const router = useRouter();

  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-xl font-bold text-neutral-900">Admins only</h1>
        <p className="text-stone-500 mt-2 text-sm">
          Your account doesn&apos;t have permission to view this page.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-5 px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return <AdminPanel />;
}

/* ─────────────────────────── Panel ─────────────────────────── */

function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('coffees');

  const [coffees, setCoffees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Modal state: { type: 'coffee-create' | 'coffee-edit' | 'user-create' | 'user-edit', item? }
  const [modal, setModal] = useState(null);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const refresh = useCallback(async () => {
    try {
      const [c, u] = await Promise.all([api.getAllCoffees(), api.getAllUsers()]);
      setCoffees(c.data);
      setUsers(u.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDeleteCoffee = async (coffee) => {
    if (!window.confirm(`Delete "${coffee.name}" permanently?`)) return;
    try {
      await api.deleteCoffee(coffee._id);
      await refresh();
      flash(`Deleted coffee "${coffee.name}"`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u._id === user.id) {
      setError('You cannot delete your own account from the admin panel.');
      return;
    }
    if (!window.confirm(`Delete user "${u.username}" permanently? Their coffee logs stay in the database.`)) return;
    try {
      await api.deleteUser(u._id);
      await refresh();
      flash(`Deleted user "${u.username}"`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-600 text-lg animate-pulse">Loading admin panel…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">⚙️ Admin Panel</h1>
            <p className="text-stone-500 text-sm mt-1">
              Manage coffees and users — signed in as <span className="font-medium text-coffee-700">{user.username}</span>
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          <TabButton active={tab === 'coffees'} onClick={() => setTab('coffees')}>
            ☕ Coffees <CountBadge n={coffees.length} />
          </TabButton>
          <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
            👤 Users <CountBadge n={users.length} />
          </TabButton>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-stone-100 border border-stone-300 text-neutral-800 px-4 py-3 rounded-lg">
          {notice}
        </div>
      )}

      {/* Tables */}
      {tab === 'coffees' ? (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <h2 className="font-bold text-neutral-900">Coffees</h2>
            <button
              onClick={() => setModal({ type: 'coffee-create' })}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors"
            >
              + Add Coffee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Taste</th>
                  <th className="px-4 py-3 font-semibold">Energy</th>
                  <th className="px-4 py-3 font-semibold">Milk</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coffees.map((c) => (
                  <tr key={c._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-6 py-3 font-medium text-neutral-900">{c.name}</td>
                    <td className="px-4 py-3 text-stone-600">{c.taste}</td>
                    <td className="px-4 py-3 text-stone-600">⚡ {c.energy_boost}/10</td>
                    <td className="px-4 py-3 text-stone-600">{c.milk ? '🥛 Yes' : '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <RowActions
                        onEdit={() => setModal({ type: 'coffee-edit', item: c })}
                        onDelete={() => handleDeleteCoffee(c)}
                      />
                    </td>
                  </tr>
                ))}
                {coffees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                      No coffees yet — add the first one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <h2 className="font-bold text-neutral-900">Users</h2>
            <button
              onClick={() => setModal({ type: 'user-create' })}
              className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors"
            >
              + Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-200 bg-stone-50">
                  <th className="px-6 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-6 py-3 font-medium text-neutral-900">
                      {u.username}
                      {u._id === user.id && <span className="ml-2 text-xs text-stone-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{u.name}</td>
                    <td className="px-4 py-3 text-stone-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RowActions
                        onEdit={() => setModal({ type: 'user-edit', item: u })}
                        onDelete={() => handleDeleteUser(u)}
                        deleteDisabled={u._id === user.id}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-stone-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal */}
      {modal?.type === 'coffee-create' && (
        <CoffeeModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash('Coffee saved'); }} />
      )}
      {modal?.type === 'coffee-edit' && (
        <CoffeeModal initial={modal.item} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash('Coffee saved'); }} />
      )}
      {modal?.type === 'user-create' && (
        <UserModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash('User saved'); }} />
      )}
      {modal?.type === 'user-edit' && (
        <UserModal initial={modal.item} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash('User saved'); }} />
      )}
    </div>
  );
}

/* ─────────────────────────── Small pieces ─────────────────────────── */

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        active
          ? 'bg-neutral-900 text-white'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {children}
    </button>
  );
}

function CountBadge({ n }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs ${
        'bg-black/20 text-white'
      }`}
    >
      {n}
    </span>
  );
}

function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-coffee-700 text-white">
      admin
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-600">
      user
    </span>
  );
}

function RowActions({ onEdit, onDelete, deleteDisabled = false }) {
  return (
    <div className="inline-flex gap-2">
      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
      >
        ✏️ Edit
      </button>
      <button
        onClick={onDelete}
        disabled={deleteDisabled}
        title={deleteDisabled ? 'You cannot delete yourself' : 'Delete'}
        className="px-3 py-1.5 rounded-lg border border-rust-300 text-xs font-medium text-rust-700 hover:bg-rust-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        🗑 Delete
      </button>
    </div>
  );
}

/* ─────────────────────────── Modal shell ─────────────────────────── */

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="font-bold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors text-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Coffee modal ─────────────────────────── */

function CoffeeModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    name: initial?.name || '',
    taste: initial?.taste || 'bitter',
    energy_boost: initial?.energy_boost ?? 5,
    milk: initial?.milk ?? 0,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        taste: form.taste,
        energy_boost: parseInt(form.energy_boost),
        milk: form.milk ? 1 : 0,
      };
      if (isEdit) await api.updateCoffee(initial._id, body);
      else await api.createCoffee(body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit “${initial.name}”` : 'Add Coffee'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rust-100 border border-rust-300 text-rust-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1">
            Name <span className="text-rust-700">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Flat White"
            className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Taste <span className="text-rust-700">*</span>
            </label>
            <select
              value={form.taste}
              onChange={(e) => setForm({ ...form, taste: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              {TASTES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Energy boost: {form.energy_boost}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.energy_boost}
              onChange={(e) => setForm({ ...form, energy_boost: e.target.value })}
              className="w-full mt-3 accent-coffee-600"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.milk}
            onChange={(e) => setForm({ ...form, milk: e.target.checked })}
            className="w-4 h-4 accent-coffee-600"
          />
          <span className="text-sm text-neutral-800">Contains milk 🥛</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Coffee'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────── User modal ─────────────────────────── */

function UserModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    username: initial?.username || '',
    email: initial?.email || '',
    name: initial?.name || '',
    password: '',
    age: initial?.age || '',
    gender: initial?.gender || 'other',
    favourite_coffee: initial?.favourite_coffee || '',
    role: initial?.role || 'user',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let saved;
      if (isEdit) {
        const body = {
          username: form.username.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          gender: form.gender,
          role: form.role,
        };
        if (form.age) body.age = parseInt(form.age);
        if (form.favourite_coffee.trim()) body.favourite_coffee = form.favourite_coffee.trim();
        if (form.password) body.password = form.password; // optional reset
        saved = await api.updateUser(initial._id, body);
      } else {
        saved = await api.register({
          username: form.username.trim(),
          email: form.email.trim(),
          name: form.name.trim(),
          password: form.password,
          gender: form.gender,
          role: form.role,
        });
        // register doesn't accept role reliably — set it via update for new users
        if (form.role === 'admin') {
          await api.updateUser(saved.data.id, { role: 'admin' });
        }
      }
      void saved;
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit “${initial.username}”` : 'Add User'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rust-100 border border-rust-300 text-rust-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Username <span className="text-rust-700">*</span>
            </label>
            <input value={form.username} onChange={set('username')} required minLength={3}
              placeholder="coffee_lover"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">
              Role
            </label>
            <select value={form.role} onChange={set('role')}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1">
            Email <span className="text-rust-700">*</span>
          </label>
          <input type="email" value={form.email} onChange={set('email')} required
            placeholder="you@example.com"
            className="w-full px-4 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1">
            Full name <span className="text-rust-700">*</span>
          </label>
          <input value={form.name} onChange={set('name')} required
            placeholder="Jane Doe"
            className="w-full px-4 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">Age</label>
            <input type="number" min="0" max="150" value={form.age} onChange={set('age')}
              placeholder="25"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">Gender</label>
            <select value={form.gender} onChange={set('gender')}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm">
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="other">other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800 mb-1">Fav coffee</label>
            <input value={form.favourite_coffee} onChange={set('favourite_coffee')}
              placeholder="Latte"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800 mb-1">
            {isEdit ? 'New password (leave blank to keep)' : 'Password '}
            {!isEdit && <span className="text-rust-700">*</span>}
          </label>
          <input type="password" value={form.password} onChange={set('password')}
            required={!isEdit} minLength={isEdit && !form.password ? undefined : 6}
            placeholder={isEdit ? '••••••••' : 'min 6 characters'}
            className="w-full px-4 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
