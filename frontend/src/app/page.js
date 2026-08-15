'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StarRating from '@/components/StarRating';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
  'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=1200&q=80',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80',
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80',
];

function HomeContent() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hero image — random each load
  const [heroImg] = useState(() => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setDaysLoading(false);
    }
  }, [user]);

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

  const refreshData = async () => {
    const sum = await api.getUserSummary(user.username);
    setSummary(sum.data);
    await fetchDays(1, daysSort); // newest entry lands on page 1
  };

  const handleLogCoffee = async (e) => {
    e.preventDefault();
    if (!selectedCoffee) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.createDay({
        username: user.username,
        coffee_name: selectedCoffee,
        count_of_cups: parseInt(cups),
        rating,
      });
      await refreshData();
      setSuccessMsg(`Logged ${cups} cup(s) of ${selectedCoffee}! ☕`);
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
      {/* ─── Hero Image ─── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-64 sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt="Coffee"
          className="w-full h-full object-cover grayscale-[35%]"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl font-bold text-white mb-1">
            ☕ Welcome back, {user.name}!
          </h1>
          <p className="text-stone-200">
            {summary?.total_cups > 0
              ? `You've logged ${summary.total_cups} cups across ${summary.unique_coffees.length} varieties`
              : 'Start logging your coffee journey today!'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
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

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 text-center">
      <div className="text-2xl sm:text-3xl">{icon}</div>
      <div className="text-xl font-bold text-neutral-900 mt-1">{value}</div>
      <div className="text-xs sm:text-sm text-stone-500">{label}</div>
    </div>
  );
}

/** Derive insight data from the summary payload with safe fallbacks. */
function deriveInsights(summary) {
  if (!summary) {
    return {
      streaks: { current: 0, longest: 0 },
      mostActiveWeekday: null,
      trend7: { total: 0, daily: [] },
      trend30: { total: 0, daily: [] },
    };
  }
  return {
    streaks: summary.streaks || { current: 0, longest: 0 },
    mostActiveWeekday: summary.most_active_weekday || null,
    trend7: summary.caffeine_trend?.last7 || { total: 0, daily: [] },
    trend30: summary.caffeine_trend?.last30 || { total: 0, daily: [] },
  };
}

function InsightCard({ icon, title, value, sub, children }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 flex flex-col">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-400 font-semibold">
        <span className="text-base">{icon}</span> {title}
      </div>
      <div className="text-xl font-bold text-neutral-900 mt-2 leading-tight">{value}</div>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <div className="text-xs text-stone-500 mt-1">{sub}</div>
      )}
      {children && <div className="text-xs text-stone-500 mt-1.5">{sub}</div>}
    </div>
  );
}

/** Tiny bar sparkline — black/gray/brown only, zero-state safe. */
function Sparkline({ data, thin = false }) {
  if (!data?.length) {
    return <div className="h-8 rounded bg-stone-100" />;
  }
  const max = Math.max(...data.map((d) => d.caffeine), 1);
  return (
    <div className="flex items-end gap-[2px] h-8" aria-hidden>
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.caffeine}`}
          className={`flex-1 rounded-sm ${thin ? 'min-w-[1px]' : ''} ${
            d.caffeine > 0 ? 'bg-coffee-600' : 'bg-stone-200'
          }`}
          style={{ height: `${Math.max((d.caffeine / max) * 100, 6)}%` }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
