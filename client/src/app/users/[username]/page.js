'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import StarRating from '@/components/StarRating';
import { StatCard, InsightCard, Sparkline, deriveInsights } from '@/components/Stats';

/**
 * Read-only public profile: aggregate coffee stats only.
 * The API deliberately exposes no email, age, gender or password data here.
 */
export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username;

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const prof = await api.getPublicUser(username);
        setProfile(prof.data);
        try {
          const sum = await api.getUserSummary(username);
          setSummary(sum.data);
        } catch {
          setSummary(null); // aggregate stats are optional decoration
        }
      } catch (err) {
        if (err.message?.includes('not found')) setNotFound(true);
        else setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-600 text-lg animate-pulse">Loading profile…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl border border-stone-200 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">🔍</div>
        <h1 className="text-xl font-bold text-neutral-900">User not found</h1>
        <p className="text-stone-500 mt-2 text-sm">
          No one goes by <span className="font-medium">@{username}</span> here.
        </p>
        <Link
          href="/leaderboard"
          className="inline-block mt-5 px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors"
        >
          ← Back to Leaderboard
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const insights = deriveInsights(summary);
  const topCoffees = summary?.by_coffee?.slice(0, 3) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-200 to-coffee-100 rounded-2xl p-6 shadow-sm border border-stone-300 text-center">
        <div className="text-5xl mb-2">☕</div>
        <h1 className="text-2xl font-bold text-neutral-900">{profile.name}</h1>
        <p className="text-stone-500">@{profile.username}</p>
        {profile.member_since && (
          <p className="text-xs text-stone-400 mt-2">
            Coffee drinker since{' '}
            {new Date(profile.member_since).toLocaleDateString('en-US', {
              month: 'long', year: 'numeric',
            })}
          </p>
        )}
        <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/70 text-stone-500 border border-stone-300">
          👁 Public profile · read-only
        </span>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="☕" value={summary?.total_cups || 0} label="Total Cups" />
        <StatCard icon="🎯" value={summary?.unique_coffees?.length || 0} label="Unique Coffees" />
        <StatCard icon="📋" value={summary?.total_entries || 0} label="Log Entries" />
        <StatCard
          icon="⭐"
          value={summary?.avg_rating ? `${summary.avg_rating}/5` : '—'}
          label="Avg Rating"
        />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          icon="🔥"
          title="Current Streak"
          value={`${insights.streaks.current} ${insights.streaks.current === 1 ? 'day' : 'days'}`}
          sub={`Best: ${insights.streaks.longest} ${insights.streaks.longest === 1 ? 'day' : 'days'}`}
        />
        <InsightCard
          icon="📅"
          title="Most Active Day"
          value={insights.mostActiveWeekday ? insights.mostActiveWeekday.day : '—'}
          sub={insights.mostActiveWeekday ? `${insights.mostActiveWeekday.cups} cups logged` : 'No data yet'}
        />
        <InsightCard icon="⚡" title="Caffeine · 7 Days" value={insights.trend7.total} sub="units (cups × energy)">
          <Sparkline data={insights.trend7.daily} />
        </InsightCard>
        <InsightCard icon="⚡" title="Caffeine · 30 Days" value={insights.trend30.total} sub="units (cups × energy)">
          <Sparkline data={insights.trend30.daily} thin />
        </InsightCard>
      </div>

      {/* Top coffees */}
      {topCoffees.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">🏆 Favourites</h2>
          <div className="space-y-2">
            {topCoffees.map((c, i) => (
              <div
                key={c.coffee_name}
                className="flex items-center justify-between px-4 py-2.5 bg-stone-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <div>
                    <div className="font-medium text-neutral-900">{c.coffee_name}</div>
                    <div className="text-xs text-stone-500">
                      {c.total_cups} {c.total_cups === 1 ? 'cup' : 'cups'} · {c.entries} {c.entries === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </div>
                {c.avg_rating > 0 && <StarRating value={Math.round(c.avg_rating)} readOnly size="sm" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/leaderboard" className="text-sm text-stone-500 underline hover:text-coffee-700">
          ← Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}
