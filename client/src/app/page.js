'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StarRating from '@/components/StarRating';
import CoffeeCard from '@/components/CoffeeCard';
import Hero from '@/components/layout/Hero';
import { StatCard, InsightCard, Sparkline, deriveInsights } from '@/components/Stats';
import { SYNC_DONE_EVENT, syncNow } from '@/lib/api';

function HomeContent() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Log coffee form
  const [selectedCoffee, setSelectedCoffee] = useState('');
  const [cups, setCups] = useState(1);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Recent activity — server-side pagination + sorting
  const PAGE_SIZE = 10;
  const [recentDays, setRecentDays] = useState([]);
  const [daysPage, setDaysPage] = useState(1);
  const [daysPages, setDaysPages] = useState(1);
  const [daysTotal, setDaysTotal] = useState(0);
  const [daysSort, setDaysSort] = useState('date'); // date | rating | cups
  const [daysLoading, setDaysLoading] = useState(false);
  const [staleData, setStaleData] = useState(false); // serving cached data during outage

  const fetchDays = useCallback(async (page, sort) => {
    setDaysLoading(true);
    try {
      const res = await api.getDaysByUsername(user.username, {
        page,
        limit: PAGE_SIZE,
        sort,
        order: 'desc',
      });
      setRecentDays(res.data);
      setDaysPage(res.page);
      setDaysPages(res.pages);
      setDaysTotal(res.total);
      setStaleData(Boolean(res.__stale));
    } catch (err) {
      setError(err.message);
    } finally {
      setDaysLoading(false);
    }
  }, [user]);

  // When queued offline writes sync successfully, refresh the dashboard
  useEffect(() => {
    const onSynced = () => refreshDataRef.current?.();
    window.addEventListener(SYNC_DONE_EVENT, onSynced);
    return () => window.removeEventListener(SYNC_DONE_EVENT, onSynced);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [sum, coffeeList] = await Promise.all([
          api.getUserSummary(user.username),
          api.getAllCoffees(),
        ]);
        setSummary(sum.data);
        setCoffees(coffeeList.data);
        await fetchDays(1, 'date');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, fetchDays]);

  const refreshDataRef = useRef(null);
  const refreshData = async () => {
    try {
      const sum = await api.getUserSummary(user.username);
      setSummary(sum.data);
      setStaleData(false);
    } catch {
      // offline mid-refresh — keep whatever is on screen
    }
    await fetchDays(1, daysSort); // newest entry lands on page 1
  };
  refreshDataRef.current = refreshData;

  const handleLogCoffee = async (e) => {
    e.preventDefault();
    if (!selectedCoffee) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.createDay({
        username: user.username,
        coffee_name: selectedCoffee,
        count_of_cups: parseInt(cups),
        rating,
      });
      await refreshData();
      setSuccessMsg(
        res.queued
          ? `Saved locally — ${cups} cup(s) of ${selectedCoffee} will sync when you're back online ☕`
          : `Logged ${cups} cup(s) of ${selectedCoffee}! ☕`
      );
      setSelectedCoffee('');
      setCups(1);
      setRating(0);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <GuestHome />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-stone-600 text-lg animate-pulse">Loading your coffee stats…</div>
      </div>
    );
  }

  const insights = deriveInsights(summary);

  return (
    <div className="space-y-8">
      {/* ─── Hero ─── */}
      <Hero
        compact
        title={`Welcome back, ${(user.name || user.username).split(' ')[0]}!`}
        subtitle={
          summary?.total_cups > 0
            ? `You've logged ${summary.total_cups} cups across ${summary.unique_coffees.length} varieties`
            : 'Start logging your coffee journey today!'
        }
        primary={{ label: 'Browse coffees', href: '/coffees' }}
      />

      {/* Error */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stale-data banner */}
      {staleData && (
        <div className="bg-stone-100 border border-stone-300 text-stone-600 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between gap-3">
          <span>📡 Showing cached data — the server is unreachable. Anything you log is saved locally and will sync.</span>
          <button onClick={() => syncNow()} className="text-xs underline shrink-0 hover:text-neutral-900">
            Retry now
          </button>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="bg-stone-100 border border-stone-300 text-neutral-800 px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* ─── Stats Cards ─── */}
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
      {/* ─── Activity Insights ─── */}
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
          sub={
            insights.mostActiveWeekday
              ? `${insights.mostActiveWeekday.cups} ${insights.mostActiveWeekday.cups === 1 ? 'cup' : 'cups'} logged`
              : 'No data yet'
          }
        />
        <InsightCard
          icon="⚡"
          title="Caffeine · 7 Days"
          value={insights.trend7.total}
          sub="units (cups × energy)"
        >
          <Sparkline data={insights.trend7.daily} />
        </InsightCard>
        <InsightCard
          icon="⚡"
          title="Caffeine · 30 Days"
          value={insights.trend30.total}
          sub="units (cups × energy)"
        >
          <Sparkline data={insights.trend30.daily} thin />
        </InsightCard>
      </div>

      {/* ─── Log Coffee Form ─── */}
      <div className="bg-white rounded-xl p-6 border border-stone-200">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">📝 Log a Coffee</h2>
        <form onSubmit={handleLogCoffee} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCoffee}
              onChange={(e) => setSelectedCoffee(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Select a coffee…</option>
              {coffees.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name} — {c.taste} · ⚡{c.energy_boost} {c.milk ? '🥛' : ''}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="50"
              value={cups}
              onChange={(e) => setCups(e.target.value)}
              className="w-full sm:w-24 px-4 py-2.5 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500 text-center"
              placeholder="Cups"
            />
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-neutral-800">Rating:</span>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-neutral-900 text-white font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Logging…' : 'Log It!'}
          </button>
        </form>
        {coffees.length === 0 && (
          <p className="text-sm text-stone-500 mt-2">
            No coffees in the database yet. Run <code className="bg-stone-100 px-1 rounded">npm run seed</code> on the backend.
          </p>
        )}
      </div>

      {/* ─── Favorites + Rating Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites */}
        {summary?.by_coffee?.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-stone-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">🏆 Your Favorites</h2>
            <div className="space-y-2">
              {summary.by_coffee.slice(0, 5).map((c, i) => (
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
                      <div className="text-xs text-stone-500">{c.total_cups} cups · {c.entries} entries</div>
                    </div>
                  </div>
                  <StarRating value={c.avg_rating || 0} readOnly size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Breakdown */}
        {summary?.rating_breakdown?.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-stone-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">⭐ Rating Breakdown</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1, 0].map((star) => {
                const entry = summary.rating_breakdown.find((r) => r.rating === star);
                const count = entry?.count || 0;
                const total = summary.rating_breakdown.reduce((s, r) => s + r.count, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-16 text-coffee-700">
                      {star > 0 ? `${'★'.repeat(star)}${'☆'.repeat(5 - star)}` : 'No rating'}
                    </span>
                    <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-coffee-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Activity ─── */}
      <div className="bg-white rounded-xl p-6 border border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-neutral-900">📅 Recent Activity</h2>
          <label className="flex items-center gap-2 text-sm text-stone-500">
            Sort by
            <select
              value={daysSort}
              onChange={(e) => {
                const sort = e.target.value;
                setDaysSort(sort);
                fetchDays(1, sort);
              }}
              className="px-2 py-1.5 rounded-lg border border-stone-300 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="date">Date</option>
              <option value="rating">Rating</option>
              <option value="cups">Cups</option>
            </select>
          </label>
        </div>

        {recentDays.length === 0 && daysLoading ? (
          <div className="text-stone-500 text-sm animate-pulse py-4">Loading entries…</div>
        ) : recentDays.length === 0 ? (
          <p className="text-stone-500">No entries yet. Log your first cup above!</p>
        ) : (
          <>
            <div className={`space-y-2 transition-opacity ${daysLoading ? 'opacity-50' : ''}`}>
              {recentDays.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between px-4 py-2.5 border border-stone-100 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-neutral-900">{d.coffee_name}</span>
                      <span className="text-sm text-stone-500 ml-2">
                        {new Date(d.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating value={d.rating || 0} readOnly size="sm" />
                    <span className="text-sm font-medium text-coffee-700">
                      {d.count_of_cups} {d.count_of_cups === 1 ? 'cup' : 'cups'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pager */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
              <button
                onClick={() => fetchDays(daysPage - 1, daysSort)}
                disabled={daysPage <= 1 || daysLoading}
                className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-sm text-stone-500">
                Page {daysPage} of {daysPages} · {daysTotal} {daysTotal === 1 ? 'entry' : 'entries'}
              </span>
              <button
                onClick={() => fetchDays(daysPage + 1, daysSort)}
                disabled={daysPage >= daysPages || daysLoading}
                className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute mode="guest">
      <HomeContent />
    </ProtectedRoute>
  );
}

/* ─────────────────────────── Guest Home ─────────────────────────── */

/**
 * Read-only landing view for signed-out visitors:
 * hero + community stats + featured coffees + leaderboard preview.
 * Any logging attempt is intercepted by CoffeeCard's requireAuth gate.
 */
function GuestHome() {
  const { requireAuth } = useAuth();
  const [coffees, setCoffees] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [coffeeRes, boardRes] = await Promise.all([
          api.getAllCoffees(),
          api.getLeaderboard('week'),
        ]);
        setCoffees(coffeeRes.data);
        setLeaders(boardRes.data.slice(0, 3));
      } catch {
        // read-only page — degrade silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = coffees
    .filter((c) => c.avg_rating != null)
    .sort((a, b) => b.avg_rating - a.avg_rating || b.total_cups - a.total_cups)
    .slice(0, 6);

  const community = coffees.reduce(
    (acc, c) => ({
      varieties: acc.varieties + 1,
      cups: acc.cups + (c.total_cups || 0),
      entries: acc.entries + (c.total_entries || 0),
    }),
    { varieties: 0, cups: 0, entries: 0 }
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Hero
        title="Your coffee journey starts here"
        subtitle="Track every cup, rate your favourites, and see how your caffeine stacks up — free, and it takes about thirty seconds."
        primary={{ label: 'Create free account', href: '/register' }}
        secondary={{ label: 'Browse coffees', href: '/coffees' }}
      />

      {/* Community stats */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[20vh]">
          <div className="text-stone-600 text-lg animate-pulse">Brewing the community stats…</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="☕" value={community.cups} label="Cups logged" />
            <StatCard icon="🎯" value={community.varieties} label="Coffee varieties" />
            <StatCard icon="📋" value={community.entries} label="Tasting entries" />
            <StatCard
              icon="🏆"
              value={leaders[0] ? leaders[0].name.split(' ')[0] : '—'}
              label="Top drinker this week"
            />
          </div>

          {/* Featured coffees */}
          {featured.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900">⭐ Community favourites</h2>
                <Link href="/coffees" className="text-sm text-coffee-700 underline hover:text-coffee-900">
                  Browse all coffees →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {featured.map((c) => (
                  <CoffeeCard
                    key={c._id}
                    coffee={c}
                    user={null}
                    requireAuth={requireAuth}
                    onLogged={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard preview */}
          {leaders.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900">🏆 This week&apos;s top drinkers</h2>
                <Link href="/leaderboard" className="text-sm text-coffee-700 underline hover:text-coffee-900">
                  Full leaderboard →
                </Link>
              </div>
              <div className="space-y-2">
                {leaders.map((r, i) => (
                  <Link
                    key={r.username}
                    href={`/users/${r.username}`}
                    className="flex items-center justify-between px-4 py-2.5 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <div className="font-medium text-neutral-900">{r.name}</div>
                        <div className="text-xs text-stone-500">@{r.username}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-coffee-700">
                      {r.cups} {r.cups === 1 ? 'cup' : 'cups'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
