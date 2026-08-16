'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function RegisterPage() {
  const t = useTranslations('register');
  const tc = useTranslations('common');
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
      setError(t('pwMismatch'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('pwShort'));
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
          <div className="text-4xl mb-3" aria-hidden>☕</div>
          <h1 className="font-display text-3xl text-ink">{t('title')}</h1>
          <p className="text-ink-2 mt-2 text-sm">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 bg-error-soft border border-error/25 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-lg border border-line p-6 space-y-1"
        >
          <Input
            label={tc('username')}
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder={t('usernamePh')}
            required
          />
          <Input
            label={tc('email')}
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder={t('emailPh')}
            required
          />
          <Input
            label={tc('password')}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t('passwordPh')}
            required
          />
          <Input
            label={t('confirmPassword')}
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t('passwordPh')}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-ink-2">
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover underline decoration-line underline-offset-2">
            {t('login')}
          </Link>
        </p>

        <div className="mt-6 p-3 bg-surface-2 border border-line rounded-lg text-xs text-ink-2 text-center">
          💡 <strong>{t('tipTitle')}</strong>{' '}
          {t.rich('tip', {
            link: (chunks) => <Link href="/profile" className="underline">{chunks}</Link>,
          })}
        </div>
      </div>
    </div>
  );
}
