'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import PageTitle from '@/components/PageTitle';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

/* ─────────────────────────── Gate ─────────────────────────── */

function AdminContent() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const tt = useTranslations('tastes');

  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-16 bg-surface rounded-xl border border-line p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="text-xl font-bold text-ink">{t('lockedTitle')}</h1>
        <p className="text-ink-2 mt-2 text-sm">
          {t('lockedBody')}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-5 px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {t('backHome')}
        </button>
      </div>
    );
  }

  return <AdminPanel />;
}

/* ─────────────────────────── Panel ─────────────────────────── */

function AdminPanel() {
  const { user } = useAuth();
  const t = useTranslations('admin');
  const tt = useTranslations('tastes');
  const tc = useTranslations('common');
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
    if (!window.confirm(t('confirmDeleteCoffee', { name: coffee.name }))) return;
    try {
      await api.deleteCoffee(coffee._id);
      await refresh();
      flash(t('coffeeDeleted', { name: coffee.name }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u._id === user.id) {
      setError(t('selfDeleteError'));
      return;
    }
    if (!window.confirm(t('confirmDeleteUser', { username: u.username }))) return;
    try {
      await api.deleteUser(u._id);
      await refresh();
      flash(t('userDeleted', { username: u.username }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-ink-2 text-lg animate-pulse">{t('loadingPanel')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-lg border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">⚙️ {t('title')}</h1>
            <p className="text-ink-2 text-sm mt-1">
              {t('signedInAs', { user: user.username })}
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink-2 hover:bg-surface-3 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          <TabButton active={tab === 'coffees'} onClick={() => setTab('coffees')}>
            ☕ {t('tabCoffees')} <CountBadge n={coffees.length} />
          </TabButton>
          <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
            👤 {t('tabUsers')} <CountBadge n={users.length} />
          </TabButton>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error-soft border border-error/25 text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-surface-2 border border-line text-ink px-4 py-3 rounded-lg">
          {notice}
        </div>
      )}

      {/* Tables */}
      {tab === 'coffees' ? (
        <section className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-ink">Coffees</h2>
            <button
              onClick={() => setModal({ type: 'coffee-create' })}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              {t('addCoffee')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-2 border-b border-line bg-surface-2">
                  <th className="px-6 py-3 font-semibold">{t('colName')}</th>
                  <th className="px-4 py-3 font-semibold">{t('colTaste')}</th>
                  <th className="px-4 py-3 font-semibold">{t('colEnergy')}</th>
                  <th className="px-4 py-3 font-semibold">{t('colMilk')}</th>
                  <th className="px-6 py-3 text-right font-semibold">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {coffees.map((c) => (
                  <tr key={c._id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-6 py-3 font-medium text-ink">{c.name}</td>
                    <td className="px-4 py-3 text-ink-2">{tt.has(c.taste) ? tt(c.taste) : c.taste}</td>
                    <td className="px-4 py-3 text-ink-2">⚡ {c.energy_boost}/10</td>
                    <td className="px-4 py-3 text-ink-2">{c.milk ? t('milkYes') : t('milkNo')}</td>
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
                    <td colSpan={5} className="px-6 py-10 text-center text-ink-3">
                      {t('noCoffees')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="font-semibold text-ink">Users</h2>
            <button
              onClick={() => setModal({ type: 'user-create' })}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              {t('addUser')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-2 border-b border-line bg-surface-2">
                  <th className="px-6 py-3 font-semibold">{tc('username')}</th>
                  <th className="px-4 py-3 font-semibold">{tc('fullName')}</th>
                  <th className="px-4 py-3 font-semibold">{t('colEmail')}</th>
                  <th className="px-4 py-3 font-semibold">{t('colRole')}</th>
                  <th className="px-6 py-3 text-right font-semibold">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-6 py-3 font-medium text-ink">
                      {u.username}
                      {u._id === user.id && <span className="ml-2 text-xs text-ink-3">{t('you')}</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-2">{u.name}</td>
                    <td className="px-4 py-3 text-ink-2">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} labels={{ user: tc('roleUser'), admin: tc('roleAdmin') }} />
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
                    <td colSpan={5} className="px-6 py-10 text-center text-ink-3">
                      {t('noUsers')}
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
        <CoffeeModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash(t('coffeeSaved')); }} />
      )}
      {modal?.type === 'coffee-edit' && (
        <CoffeeModal initial={modal.item} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash(t('coffeeSaved')); }} />
      )}
      {modal?.type === 'user-create' && (
        <UserModal onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash(t('userSaved')); }} />
      )}
      {modal?.type === 'user-edit' && (
        <UserModal initial={modal.item} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await refresh(); flash(t('userSaved')); }} />
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
          ? 'bg-accent text-white'
          : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  );
}

function CountBadge({ n, active = false }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-mono tabular-nums ${
        active ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-ink-3'
      }`}
    >
      {n}
    </span>
  );
}

function RoleBadge({ role, labels }) {
  return role === 'admin' ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-soft text-accent">
      {labels.admin}
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-3 text-ink-2">
      {labels.user}
    </span>
  );
}

function RowActions({ onEdit, onDelete, deleteDisabled = false }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  return (
    <div className="inline-flex gap-2">
      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink-2 hover:bg-surface-3 transition-colors"
      >
        ✏️ {tc('edit')}
      </button>
      <button
        onClick={onDelete}
        disabled={deleteDisabled}
        title={deleteDisabled ? t('selfDeleteDisabled') : tc('delete')}
        className="px-3 py-1.5 rounded-lg border border-error/40 text-xs font-medium text-error hover:bg-error-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        🗑 {tc('delete')}
      </button>
    </div>
  );
}

/* ─────────────────────────── Coffee modal ─────────────────────────── */

function CoffeeModal({ initial, onClose, onSaved }) {
  const t = useTranslations('admin');
  const tt = useTranslations('tastes');
  const tc = useTranslations('common');
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
    <Modal title={isEdit ? t('editCoffeeTitle', { name: initial.name }) : t('addCoffeeTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error-soft border border-error/25 text-error px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
            {t('fieldName')} <span className="text-error">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder={t('namePh')}
            className="w-full px-4 py-2.5 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
              {t('fieldTaste')} <span className="text-error">*</span>
            </label>
            <select
              value={form.taste}
              onChange={(e) => setForm({ ...form, taste: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-accent"
            >
              {TASTES.map((tst) => <option key={tst} value={tst}>{tt(tst)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
              {t('fieldEnergy', { value: form.energy_boost })}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={form.energy_boost}
              onChange={(e) => setForm({ ...form, energy_boost: e.target.value })}
              className="w-full mt-3 accent-accent"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.milk}
            onChange={(e) => setForm({ ...form, milk: e.target.checked })}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm text-ink">{t('fieldMilk')}</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? tc('saving') : isEdit ? t('saveChanges') : t('createCoffee')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-surface-2 text-ink-2 font-medium hover:bg-surface-3 transition-colors"
          >
            {tc('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────── User modal ─────────────────────────── */

function UserModal({ initial, onClose, onSaved }) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
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
    <Modal title={isEdit ? t('editUserTitle', { username: initial.username }) : t('addUserTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error-soft border border-error/25 text-error px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
              {tc('username')} <span className="text-error">*</span>
            </label>
            <input value={form.username} onChange={set('username')} required minLength={3}
              placeholder={t("nameUserPh")}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
              {t('fieldRole')}
            </label>
            <select value={form.role} onChange={set('role')}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-accent text-sm">
              <option value="user">{tc('roleUser')}</option>
              <option value="admin">{tc('roleAdmin')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
            {tc('email')} <span className="text-error">*</span>
          </label>
          <input type="email" value={form.email} onChange={set('email')} required
            placeholder={t('emailPh')}
            className="w-full px-4 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
            {tc('fullName')} <span className="text-error">*</span>
          </label>
          <input value={form.name} onChange={set('name')} required
            placeholder={t("fullPh")}
            className="w-full px-4 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">{tc('age')}</label>
            <input type="number" min="0" max="150" value={form.age} onChange={set('age')}
              placeholder={t("agePh")}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">{tc('gender')}</label>
            <select value={form.gender} onChange={set('gender')}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:border-accent text-sm">
              <option value="male">{tc('genderMale')}</option>
              <option value="female">{tc('genderFemale')}</option>
              <option value="other">{tc('genderOther')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">{tc('favCoffee')}</label>
            <input value={form.favourite_coffee} onChange={set('favourite_coffee')}
              placeholder={t("favPh")}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-ink-2 mb-1.5">
            {isEdit ? t('fieldNewPw') : tc('password')}
            {!isEdit && <span className="text-error">*</span>}
          </label>
          <input type="password" value={form.password} onChange={set('password')}
            required={!isEdit} minLength={isEdit && !form.password ? undefined : 6}
            placeholder={isEdit ? '••••••••' : t('pwHint')}
            className="w-full px-4 py-2 rounded-lg border border-line bg-surface text-ink placeholder-ink-3 focus:outline-none focus:border-accent text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? tc('saving') : isEdit ? t('saveChanges') : t('createUser')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-surface-2 text-ink-2 font-medium hover:bg-surface-3 transition-colors"
          >
            {tc('cancel')}
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
