'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Input from '@/components/Input';

function ProfileContent() {
  const { user, updateUserInContext } = useAuth();

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
        // Offline: saved to the sync queue — don't clobber the auth context
        // with the local echo; it will apply after the server accepts it.
        setSuccess('Saved locally — will sync automatically when you\u2019re back online ☕');
      } else {
        updateUserInContext(res.data);
        setSuccess('Profile updated successfully! ✅');
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
        <div className="text-stone-600 text-lg animate-pulse">Loading profile…</div>
      </div>
    );
  }

  const fieldEmpty = (val) => !val || val === 'other';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-200 to-coffee-100 rounded-2xl p-6 border border-stone-300 text-center">
        <div className="text-5xl mb-2">☕</div>
        <h1 className="text-2xl font-bold text-neutral-900">{user.name || user.username}</h1>
        <p className="text-stone-500">@{user.username}</p>
        {fieldEmpty(user.name) || fieldEmpty(user.age) || !user.favourite_coffee ? (
          <p className="mt-2 text-sm text-stone-500 italic">
            💡 Complete your profile — click Edit below
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
        <div className="bg-stone-100 border border-stone-300 text-neutral-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-900">Profile Details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 rounded-lg bg-stone-200 text-neutral-800 text-sm font-medium hover:bg-stone-300 transition-colors"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-3">
            <InfoRow label="Username" value={user.username} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Full Name" value={user.name || 'Not set'} highlight={fieldEmpty(user.name)} />
            <InfoRow label="Age" value={user.age || 'Not set'} highlight={fieldEmpty(user.age)} />
            <InfoRow label="Gender" value={user.gender || 'Not set'} highlight={fieldEmpty(user.gender)} />
            <InfoRow label="Favourite Coffee" value={user.favourite_coffee || 'Not set'} highlight={!user.favourite_coffee} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-1">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Age"
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              placeholder="25"
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-800 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Favourite Coffee"
              name="favourite_coffee"
              value={form.favourite_coffee}
              onChange={handleChange}
              placeholder="Latte, Espresso, Cappuccino…"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-coffee-800 transition-colors"
              >
                Save Changes
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
                className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-medium hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Account</h2>
        <div className="space-y-3">
          <InfoRow label="User ID" value={user.id} />
          <InfoRow
            label="Member Since"
            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-stone-400 italic' : 'text-neutral-900'}`}>
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
