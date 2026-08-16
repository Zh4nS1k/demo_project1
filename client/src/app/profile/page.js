'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Input from '@/components/Input';

function ProfileContent() {
  const { user, updateUserInContext } = useAuth();
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const format = useFormatter();
  const genderLabel = (g) =>
    g === 'male' ? tc('genderMale') : g === 'female' ? tc('genderFemale') : g === 'other' ? tc('genderOther') : g;

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'other',
    favourite_coffee: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || 'other',
        favourite_coffee: user.favourite_coffee || '',
        email: user.email || '',
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const body = { ...form };
      if (body.age) body.age = parseInt(body.age);
      else delete body.age;
      if (!body.favourite_coffee) delete body.favourite_coffee;

      const res = await api.updateUser(user.id, body);
      if (res.queued) {
        setSuccess(tc('savedLocally'));
      } else {
        updateUserInContext(res.data);
        setSuccess(t('updated'));
      }
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-ink-2 text-lg animate-pulse">{t('loading')}</div>
      </div>
    );
  }

  const fieldEmpty = (val) => !val || val === 'other';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-surface-3 to-coffee-100 rounded-2xl p-6 border border-line text-center">
        <div className="text-5xl mb-2">☕</div>
        <h1 className="text-2xl font-bold text-ink">{user.name || user.username}</h1>
        <p className="text-ink-2">@{user.username}</p>
        {fieldEmpty(user.name) || fieldEmpty(user.age) || !user.favourite_coffee ? (
          <p className="mt-2 text-sm text-ink-2 italic">
            💡 {t('complete')}
          </p>
        ) : null}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-surface-2 border border-line text-ink px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Info */}
      <div className="bg-surface rounded-xl border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">{t('details')}</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 rounded-lg bg-surface-3 text-ink text-sm font-medium hover:bg-surface-2 transition-colors"
            >
              ✏️ {tc('edit')}
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3">
            <InfoRow label={tc('username')} value={user.username} />
            <InfoRow label={tc('email')} value={user.email} />
            <InfoRow label={tc('fullName')} value={user.name || tc('notSet')} highlight={fieldEmpty(user.name)} />
            <InfoRow label={tc('age')} value={user.age || tc('notSet')} highlight={fieldEmpty(user.age)} />
            <InfoRow label={tc('gender')} value={user.gender ? genderLabel(user.gender) : tc('notSet')} highlight={fieldEmpty(user.gender)} />
            <InfoRow label={tc('favCoffee')} value={user.favourite_coffee || tc('notSet')} highlight={!user.favourite_coffee} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-1">
            <Input
              label={tc('fullName')}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t('namePh')}
              required
            />
            <Input
              label={tc('email')}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label={tc('age')}
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              placeholder={t('agePh')}
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-1">{tc('gender')}</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500"
              >
                <option value="male">{tc('genderMale')}</option>
                <option value="female">{tc('genderFemale')}</option>
                <option value="other">{tc('genderOther')}</option>
              </select>
            </div>
            <Input
              label={tc('favCoffee')}
              name="favourite_coffee"
              value={form.favourite_coffee}
              onChange={handleChange}
              placeholder={t('favPh')}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-ink text-surface font-medium hover:bg-coffee-800 transition-colors"
              >
                {t('saveChanges')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm({
                    name: user.name || '',
                    age: user.age || '',
                    gender: user.gender || 'other',
                    favourite_coffee: user.favourite_coffee || '',
                    email: user.email || '',
                  });
                }}
                className="flex-1 py-2.5 rounded-lg bg-surface-2 text-ink-2 font-medium hover:bg-surface-3 transition-colors"
              >
                {tc('cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-surface rounded-xl border border-line p-6">
        <h2 className="text-lg font-bold text-ink mb-4">{t('account')}</h2>
        <div className="space-y-3">
          <InfoRow label={t('userId')} value={user.id} />
          <InfoRow
            label={t('memberSince')}
            value={user.member_since || user.createdAt ? format.dateTime(new Date(user.member_since || user.createdAt), { dateStyle: 'medium' }) : t('unknown')}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-line last:border-0">
      <span className="text-sm text-ink-2">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-ink-3 italic' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
