'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
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

  const label = period === 'week' ? 'last 7 days' : 'last 30 days';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">🏆 Leaderboard</h1>
            <p className="text-ink-2 text-sm mt-1">Top coffee drinkers by cups — {label}</p>
          </div>
          <div className="flex gap-2">
            <PeriodButton active={period === 'week'} onClick={() => setPeriod('week')}>
              7 Days
            </PeriodButton>
            <PeriodButton active={period === 'month'} onClick={() => setPeriod('month')}>
              30 Days
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
          <div className="text-ink-2 text-lg animate-pulse">Loading leaderboard…</div>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-10 text-center">
          <div className="text-4xl mb-3">☕</div>
          <p className="text-ink font-medium">No cups logged in this period</p>
          <p className="text-ink-2 text-sm mt-1">Be the first on the board — log a coffee!</p>
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
                {r.unique_coffees} {r.unique_coffees === 1 ? 'variety' : 'varieties'}
                <br />
                {r.entries} {r.entries === 1 ? 'entry' : 'entries'}
              </div>
              <div className="text-right w-20">
                <div className="text-lg font-bold text-coffee-700">{r.cups}</div>
                <div className="text-xs text-ink-3">cups</div>
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
