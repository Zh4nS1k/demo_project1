'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function LoginPage() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
            label={tc('email')}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPh')}
            required
          />
          <Input
            label={tc('password')}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-accent hover:text-accent-hover underline decoration-line underline-offset-2">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
