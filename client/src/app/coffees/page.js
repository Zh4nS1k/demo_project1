'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import CoffeeCard from '@/components/CoffeeCard';
import PageTitle from '@/components/PageTitle';
import Select from '@/components/Select';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';

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
      <PageTitle
        title={t('title')}
        subtitle={
          <>
            {t('subtitle', { count: tc('varieties', { count: coffees.length }) })}
            {!user && (
              <>
                {' '}
                {t.rich('subtitleGuest', {
                  link: (chunks) => <Link href="/register" className="underline text-accent">{chunks}</Link>,
                })}
              </>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <Select label={t('taste')} name="taste" value={taste} onChange={(e) => setTaste(e.target.value)}>
          <option value="">{t('anyTaste')}</option>
          {TASTES.map((tst) => <option key={tst} value={tst}>{tt(tst)}</option>)}
        </Select>

        <Select label={t('milk')} name="milk" value={milk} onChange={(e) => setMilk(e.target.value)}>
          <option value="">{t('any')}</option>
          <option value="1">{t('withMilk')}</option>
          <option value="0">{t('noMilk')}</option>
        </Select>

        <Select label={t('minEnergy')} name="minEnergy" value={minEnergy} onChange={(e) => setMinEnergy(e.target.value)}>
          <option value="">{t('any')}</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>⚡ {n}+</option>
          ))}
        </Select>

        <Button
          variant="secondary"
          onClick={() => { setTaste(''); setMilk(''); setMinEnergy(''); }}
          disabled={!hasFilters}
        >
          {t('clearFilters')}
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-error-soft border border-error/25 text-error px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && coffees.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-ink-2 animate-pulse">{t('loading')}</div>
        </div>
      ) : coffees.length === 0 ? (
        <Card padding="none">
          <EmptyState title={t('noMatch')} hint={t('noMatchHint')} />
        </Card>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
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
