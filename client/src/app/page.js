'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
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
  const t = useTranslations('home');
  const th = useTranslations('hero');
  const tc = useTranslations('common');
  const tw = useTranslations('weekdays');
  const format = useFormatter();
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
          ? t('queuedMsg', { cups, coffee: selectedCoffee })
          : t('loggedMsg', { cups, coffee: selectedCoffee })
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
        <div className="text-ink-2 text-lg animate-pulse">{t('loadingStats')}</div>
      </div>
    );
  }

  const insights = deriveInsights(summary);

  return (
    <div className="space-y-8">
      {/* ─── Hero ─── */}
      <Hero
        compact
        title={th('welcomeBack', { name: (user.name || user.username).split(' ')[0] })}
        subtitle={
          summary?.total_cups > 0
            ? th('loggedLine', {
                cups: summary.total_cups,
                varieties: summary.unique_coffees.length,
              })
            : th('startLine')
        }
        primary={{ label: th('browseCoffees'), href: '/coffees' }}
      />

      {/* Error */}
      {error && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stale-data banner */}
      {staleData && (
        <div className="bg-surface-2 border border-line text-ink-2 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between gap-3">
          <span>📡 {tc('staleBanner')}</span>
          <button onClick={() => syncNow()} className="text-xs underline shrink-0 hover:text-ink">
            {tc('retryNow')}
          </button>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="bg-surface-2 border border-line text-ink px-4 py-3 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="☕" value={summary?.total_cups || 0} label={t('totalCups')} />
        <StatCard icon="🎯" value={summary?.unique_coffees?.length || 0} label={t('uniqueCoffees')} />
        <StatCard icon="📋" value={summary?.total_entries || 0} label={t('logEntries')} />
        <StatCard
          icon="⭐"
          value={summary?.avg_rating ? t('ratingValue', { value: summary.avg_rating }) : '—'}
          label={t('avgRating')}
        />
      </div>
      {/* ─── Activity Insights ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          icon="🔥"
          title={t('currentStreak')}
          value={tc('days', { count: insights.streaks.current })}
          sub={t('best', { days: tc('days', { count: insights.streaks.longest }) })}
        />
        <InsightCard
          icon="📅"
          title={t('mostActiveDay')}
          value={
            insights.mostActiveWeekday
              ? tw.has(insights.mostActiveWeekday.day)
                ? tw(insights.mostActiveWeekday.day)
                : insights.mostActiveWeekday.day
              : '—'
          }
          sub={
            insights.mostActiveWeekday
              ? t('cupsLogged', { cups: insights.mostActiveWeekday.cups })
              : t('noDataYet')
          }
        />
        <InsightCard
          icon="⚡"
          title={t('caffeine7')}
          value={insights.trend7.total}
          sub={t('caffeineUnits')}
        >
          <Sparkline data={insights.trend7.daily} />
        </InsightCard>
        <InsightCard
          icon="⚡"
          title={t('caffeine30')}
          value={insights.trend30.total}
          sub={t('caffeineUnits')}
        >
          <Sparkline data={insights.trend30.daily} thin />
        </InsightCard>
      </div>

      {/* ─── Log Coffee Form ─── */}
      <div className="bg-surface rounded-xl p-6 border border-line">
        <h2 className="text-lg font-bold text-ink mb-4">📝 {t('logCoffee')}</h2>
        <form onSubmit={handleLogCoffee} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCoffee}
              onChange={(e) => setSelectedCoffee(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">{t('selectCoffee')}</option>
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
              className="w-full sm:w-24 px-4 py-2.5 rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-coffee-500 text-center"
              placeholder={t('cupsLabel')}
            />
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-ink">{t('rating')}</span>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-ink text-surface font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
          >
            {submitting ? t('logging') : t('logIt')}
          </button>
        </form>
        {coffees.length === 0 && (
          <p className="text-sm text-ink-2 mt-2">
            {t.rich('seedHint', {
              code: (chunks) => <code className="bg-surface-2 px-1 rounded">{chunks}</code>,
            })}
          </p>
        )}
      </div>

      {/* ─── Favorites + Rating Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites */}
        {summary?.by_coffee?.length > 0 && (
          <div className="bg-surface rounded-xl p-6 border border-line">
            <h2 className="text-lg font-bold text-ink mb-4">🏆 {t('favorites')}</h2>
            <div className="space-y-2">
              {summary.by_coffee.slice(0, 5).map((c, i) => (
                <div
                  key={c.coffee_name}
                  className="flex items-center justify-between px-4 py-2.5 bg-surface-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div>
                      <div className="font-medium text-ink">{c.coffee_name}</div>
                      <div className="text-xs text-ink-2">{tc('cups', { count: c.total_cups })} · {tc('entries', { count: c.entries })}</div>
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
          <div className="bg-surface rounded-xl p-6 border border-line">
            <h2 className="text-lg font-bold text-ink mb-4">⭐ {t('ratingBreakdown')}</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1, 0].map((star) => {
                const entry = summary.rating_breakdown.find((r) => r.rating === star);
                const count = entry?.count || 0;
                const total = summary.rating_breakdown.reduce((s, r) => s + r.count, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-16 text-coffee-700">
                      {star > 0 ? `${'★'.repeat(star)}${'☆'.repeat(5 - star)}` : t('noRating')}
                    </span>
                    <div className="flex-1 bg-surface-2 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-coffee-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-ink-2 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Activity ─── */}
      <div className="bg-surface rounded-xl p-6 border border-line">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-ink">📅 {t('recentActivity')}</h2>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            {t('sortBy')}
            <select
              value={daysSort}
              onChange={(e) => {
                const sort = e.target.value;
                setDaysSort(sort);
                fetchDays(1, sort);
              }}
              className="px-2 py-1.5 rounded-lg border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="date">{t('sortDate')}</option>
              <option value="rating">{t('sortRating')}</option>
              <option value="cups">{t('sortCups')}</option>
            </select>
          </label>
        </div>

        {recentDays.length === 0 && daysLoading ? (
          <div className="text-ink-2 text-sm animate-pulse py-4">{t('loadingEntries')}</div>
        ) : recentDays.length === 0 ? (
          <p className="text-ink-2">{t('noEntries')}</p>
        ) : (
          <>
            <div className={`space-y-2 transition-opacity ${daysLoading ? 'opacity-50' : ''}`}>
              {recentDays.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between px-4 py-2.5 border border-line rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-medium text-ink">{d.coffee_name}</span>
                      <span className="text-sm text-ink-2 ml-2">
                        {format.dateTime(new Date(d.date), {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating value={d.rating || 0} readOnly size="sm" />
                    <span className="text-sm font-medium text-coffee-700">
                      {tc('cups', { count: d.count_of_cups })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pager */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
              <button
                onClick={() => fetchDays(daysPage - 1, daysSort)}
                disabled={daysPage <= 1 || daysLoading}
                className="px-4 py-1.5 rounded-lg border border-line text-sm font-medium text-ink-2 hover:bg-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('prev')}
              </button>
              <span className="text-sm text-ink-2">
                {t('pageOf', { page: daysPage, pages: daysPages, total: daysTotal })}
              </span>
              <button
                onClick={() => fetchDays(daysPage + 1, daysSort)}
                disabled={daysPage >= daysPages || daysLoading}
                className="px-4 py-1.5 rounded-lg border border-line text-sm font-medium text-ink-2 hover:bg-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('next')}
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
  const t = useTranslations('home');
  const th = useTranslations('hero');
  const tc = useTranslations('common');
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
        title={th('guestTitle')}
        subtitle={th('guestSubtitle')}
        primary={{ label: th('createAccount'), href: '/register' }}
        secondary={{ label: th('browseCoffees'), href: '/coffees' }}
      />

      {/* Community stats */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[20vh]">
          <div className="text-ink-2 text-lg animate-pulse">{t('brewingStats')}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="☕" value={community.cups} label={t('cupsLoggedTotal')} />
            <StatCard icon="🎯" value={community.varieties} label={t('coffeeVarieties')} />
            <StatCard icon="📋" value={community.entries} label={t('tastingEntries')} />
            <StatCard
              icon="🏆"
              value={leaders[0] ? leaders[0].name.split(' ')[0] : '—'}
              label={t('topDrinkerWeek')}
            />
          </div>

          {/* Featured coffees */}
          {featured.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">⭐ {t('communityFavourites')}</h2>
                <Link href="/coffees" className="text-sm text-coffee-700 underline hover:text-coffee-900">
                  {t('browseAll')}
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
            <div className="bg-surface rounded-xl p-6 border border-line">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">🏆 {t('topDrinkers')}</h2>
                <Link href="/leaderboard" className="text-sm text-coffee-700 underline hover:text-coffee-900">
                  {t('fullLeaderboard')}
                </Link>
              </div>
              <div className="space-y-2">
                {leaders.map((r, i) => (
                  <Link
                    key={r.username}
                    href={`/users/${r.username}`}
                    className="flex items-center justify-between px-4 py-2.5 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </span>
                      <div>
                        <div className="font-medium text-ink">{r.name}</div>
                        <div className="text-xs text-ink-2">@{r.username}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-coffee-700">
                      {tc('cups', { count: r.cups })}
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
