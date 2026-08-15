'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboardPage');
  const tc = useTranslations('common');
  const format = useFormatter();
  const [period, setPeriod] = useState('week');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getLeaderboard(period)
      .then((res) => {
        setRows(res.data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [period]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">🏆 {t('title')}</h1>
            <p className="text-ink-2 text-sm mt-1">{t('subtitle', { period: t(period === 'week' ? 'last7' : 'last30') })}</p>
          </div>
          <div className="flex gap-2">
            <PeriodButton active={period === 'week'} onClick={() => setPeriod('week')}>
              {t('d7')}
            </PeriodButton>
            <PeriodButton active={period === 'month'} onClick={() => setPeriod('month')}>
              {t('d30')}
            </PeriodButton>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-ink-2 text-lg animate-pulse">{t('loading')}</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-10 text-center">
          <div className="text-4xl mb-3">☕</div>
          <p className="text-ink font-medium">{t('empty')}</p>
          <p className="text-ink-2 text-sm mt-1">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className={`bg-surface rounded-xl border border-line overflow-hidden transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {rows.map((r, i) => (
            <div
              key={r.username}
              className={`flex items-center gap-4 px-6 py-4 ${
                i !== rows.length - 1 ? 'border-b border-line' : ''
              } hover:bg-surface-2 transition-colors`}
            >
              <span className="w-8 text-center text-lg font-bold text-ink-3">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <Link href={`/users/${r.username}`} className="flex-1 min-w-0 hover:underline">
                <div className="font-medium text-ink truncate">{r.name}</div>
                <div className="text-xs text-ink-2">@{r.username}</div>
              </Link>
              <div className="hidden sm:block text-right text-xs text-ink-2 w-24">
                {tc('varieties', { count: r.unique_coffees })}
                <br />
                {tc('entries', { count: r.entries })}
              </div>
              <div className="text-right w-20">
                <div className="text-lg font-bold text-coffee-700">{format.number(r.cups)}</div>
                <div className="text-xs text-ink-3">{tc('cupsLabel')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PeriodButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-ink text-surface'
          : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  );
}
