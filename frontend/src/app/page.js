'use client';

import { useState, useEffect } from 'react';
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
  const [recentDays, setRecentDays] = useState([]);
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [sum, days, coffeeList] = await Promise.all([
          api.getUserSummary(user.username),
          api.getDaysByUsername(user.username),
          api.getAllCoffees(),
        ]);
        setSummary(sum.data);
        setRecentDays(days.data.slice(0, 10));
        setCoffees(coffeeList.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const refreshData = async () => {
    const [sum, days] = await Promise.all([
      api.getUserSummary(user.username),
      api.getDaysByUsername(user.username),
    ]);
    setSummary(sum.data);
    setRecentDays(days.data.slice(0, 10));
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
        <div className="text-amber-700 text-lg animate-pulse">Loading your coffee stats…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── Hero Image ─── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-64 sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt="Coffee"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/80 via-amber-900/20 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl font-bold text-white mb-1">
            ☕ Welcome back, {user.name}!
          </h1>
          <p className="text-amber-100">
            {summary?.total_cups > 0
              ? `You've logged ${summary.total_cups} cups across ${summary.unique_coffees.length} varieties`
              : 'Start logging your coffee journey today!'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
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

      {/* ─── Log Coffee Form ─── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100">
        <h2 className="text-lg font-bold text-amber-900 mb-4">📝 Log a Coffee</h2>
        <form onSubmit={handleLogCoffee} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCoffee}
              onChange={(e) => setSelectedCoffee(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 rounded-lg border border-amber-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className="w-full sm:w-24 px-4 py-2.5 rounded-lg border border-amber-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 text-center"
              placeholder="Cups"
            />
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-amber-900">Rating:</span>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Logging…' : 'Log It!'}
          </button>
        </form>
        {coffees.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            No coffees in the database yet. Run <code className="bg-amber-50 px-1 rounded">npm run seed</code> on the backend.
          </p>
        )}
      </div>

      {/* ─── Favorites + Rating Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites */}
        {summary?.by_coffee?.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100">
            <h2 className="text-lg font-bold text-amber-900 mb-4">🏆 Your Favorites</h2>
            <div className="space-y-2">
              {summary.by_coffee.slice(0, 5).map((c, i) => (
                <div
                  key={c.coffee_name}
                  className="flex items-center justify-between px-4 py-2.5 bg-amber-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div>
                      <div className="font-medium text-amber-900">{c.coffee_name}</div>
                      <div className="text-xs text-amber-600">{c.total_cups} cups · {c.entries} entries</div>
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100">
            <h2 className="text-lg font-bold text-amber-900 mb-4">⭐ Rating Breakdown</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1, 0].map((star) => {
                const entry = summary.rating_breakdown.find((r) => r.rating === star);
                const count = entry?.count || 0;
                const total = summary.rating_breakdown.reduce((s, r) => s + r.count, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-16 text-amber-700">
                      {star > 0 ? `${'★'.repeat(star)}${'☆'.repeat(5 - star)}` : 'No rating'}
                    </span>
                    <div className="flex-1 bg-amber-50 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-amber-600 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Recent Activity ─── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-amber-100">
        <h2 className="text-lg font-bold text-amber-900 mb-4">📅 Recent Activity</h2>
        {recentDays.length === 0 ? (
          <p className="text-gray-500">No entries yet. Log your first cup above!</p>
        ) : (
          <div className="space-y-2">
            {recentDays.map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between px-4 py-2.5 border border-amber-50 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-medium text-amber-900">{d.coffee_name}</span>
                    <span className="text-sm text-amber-600 ml-2">
                      {new Date(d.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating value={d.rating || 0} readOnly size="sm" />
                  <span className="text-sm font-medium text-amber-700">
                    {d.count_of_cups} {d.count_of_cups === 1 ? 'cup' : 'cups'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 text-center">
      <div className="text-2xl sm:text-3xl">{icon}</div>
      <div className="text-xl font-bold text-amber-900 mt-1">{value}</div>
      <div className="text-xs sm:text-sm text-amber-600">{label}</div>
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
