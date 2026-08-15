'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/Input';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.username, // default name = username, editable later in profile
      });
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-2xl font-bold text-neutral-900">Join Coffee Drinker</h1>
          <p className="text-stone-500 mt-1">Create your account — set up your profile later</p>
        </div>

        {error && (
          <div className="mb-4 bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-stone-200 p-6 space-y-1"
        >
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="coffee_lover"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 rounded-lg bg-neutral-900 text-white font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-stone-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium underline text-coffee-700 hover:text-coffee-900">
            Login
          </Link>
        </p>

        <div className="mt-6 p-3 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-600 text-center">
          💡 <strong>Tip:</strong> You can add your name, age, gender, and favourite coffee
          from your <Link href="/profile" className="underline">profile page</Link> after registration.
        </div>
      </div>
    </div>
  );
}
