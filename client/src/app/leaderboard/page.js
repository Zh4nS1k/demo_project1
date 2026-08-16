'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { api } from '@/lib/api';
import PageTitle from '@/components/PageTitle';
import Card from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';

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
      <PageTitle
        title={t('title')}
        subtitle={t('subtitle', { period: t(period === 'week' ? 'last7' : 'last30') })}
        actions={
          <div className="flex p-0.5 rounded-md border border-line bg-surface" role="group" aria-label={t('title')}>
            {['week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`px-4 h-8 rounded-[6px] text-sm font-medium transition-colors duration-150 ${
                  period === p
                    ? 'bg-accent-soft text-accent'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {t(p === 'week' ? 'd7' : 'd30')}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="bg-error-soft border border-error/25 text-error px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-ink-2 animate-pulse">{t('loading')}</div>
        </div>
      ) : rows.length === 0 ? (
        <Card padding="none">
          <EmptyState title={t('empty')} hint={t('emptyHint')} />
        </Card>
      ) : (
        <Card padding="none" className={`overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-60' : ''}`}>
          {rows.map((r, i) => (
            <div
              key={r.username}
              className={`flex items-center gap-4 px-6 py-4 ${
                i !== rows.length - 1 ? 'border-b border-line' : ''
              } hover:bg-surface-2 transition-colors duration-150`}
            >
              <span
                className={`w-7 text-center text-sm font-mono tabular-nums ${
                  i < 3 ? 'text-accent font-semibold' : 'text-ink-3'
                }`}
                aria-label={`#${i + 1}`}
              >
                {i + 1}
              </span>
              <Link href={`/users/${r.username}`} className="flex-1 min-w-0 hover:underline decoration-line">
                <div className="font-medium text-ink truncate">{r.name}</div>
                <div className="text-xs text-ink-3">@{r.username}</div>
              </Link>
              <div className="hidden sm:block text-right text-xs text-ink-3 w-28 font-mono tabular-nums">
                {r.unique_coffees} {tc('varieties', { count: r.unique_coffees })}
                <br />
                {r.entries} {tc('entries', { count: r.entries })}
              </div>
              <div className="text-right w-20">
                <div className="text-lg text-ink font-mono tabular-nums">{format.number(r.cups)}</div>
                <div className="text-[11px] text-ink-3 uppercase tracking-widest">{tc('cupsLabel')}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
