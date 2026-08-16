'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import CoffeeCard from '@/components/CoffeeCard';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

export default function CoffeesPage() {
  const { user, requireAuth } = useAuth();
  const t = useTranslations('coffeesPage');
  const tt = useTranslations('tastes');
  const tc = useTranslations('common');

  // Filters — map straight onto existing /api/coffees query params
  const [taste, setTaste] = useState('');
  const [milk, setMilk] = useState('');
  const [minEnergy, setMinEnergy] = useState('');

  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCoffees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (taste) params.taste = taste;
      if (milk !== '') params.milk = milk;
      if (minEnergy) params.minEnergy = minEnergy;
      const res = await api.getAllCoffees(params);
      setCoffees(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taste, milk, minEnergy]);

  useEffect(() => {
    fetchCoffees();
  }, [fetchCoffees]);

  const hasFilters = taste || milk !== '' || minEnergy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <h1 className="text-2xl font-bold text-ink">☕ {t('title')}</h1>
        <p className="text-ink-2 text-sm mt-1">
          {t('subtitle', { count: tc('varieties', { count: coffees.length }) })}
          {!user && (
            <>{' '}{t.rich('subtitleGuest', {
              link: (chunks) => <Link href="/register" className="underline text-coffee-700">{chunks}</Link>,
            })}</>
          )}
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2 font-medium">{t('taste')}</span>
            <select
              value={taste}
              onChange={(e) => setTaste(e.target.value)}
              className="px-3 py-2 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">{t('anyTaste')}</option>
              {TASTES.map((tst) => <option key={tst} value={tst}>{tt(tst)}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2 font-medium">{t('milk')}</span>
            <select
              value={milk}
              onChange={(e) => setMilk(e.target.value)}
              className="px-3 py-2 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">{t('any')}</option>
              <option value="1">{t('withMilk')}</option>
              <option value="0">{t('noMilk')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-2 font-medium">{t('minEnergy')}</span>
            <select
              value={minEnergy}
              onChange={(e) => setMinEnergy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">{t('any')}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>⚡ {n}+</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => { setTaste(''); setMilk(''); setMinEnergy(''); }}
              disabled={!hasFilters}
              className="px-4 py-2 rounded-lg border border-line text-sm font-medium text-ink-2 hover:bg-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && coffees.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-ink-2 text-lg animate-pulse">{t('loading')}</div>
        </div>
      ) : coffees.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-ink font-medium">{t('noMatch')}</p>
          <p className="text-ink-2 text-sm mt-1">{t('noMatchHint')}</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {coffees.map((c) => (
            <CoffeeCard
              key={c._id}
              coffee={c}
              user={user}
              requireAuth={requireAuth}
              onLogged={() => fetchCoffees()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
