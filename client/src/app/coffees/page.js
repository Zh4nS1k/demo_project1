'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import StarRating from '@/components/StarRating';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

export default function CoffeesPage() {
  const { user } = useAuth();

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
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">☕ Coffee Catalogue</h1>
        <p className="text-stone-500 text-sm mt-1">
          {coffees.length} {coffees.length === 1 ? 'variety' : 'varieties'} with community stats
          {!user && (
            <> — <Link href="/login" className="underline text-coffee-700">log in</Link> to track what you drink</>
          )}
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-500 font-medium">Taste</span>
            <select
              value={taste}
              onChange={(e) => setTaste(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Any taste</option>
              {TASTES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-500 font-medium">Milk</span>
            <select
              value={milk}
              onChange={(e) => setMilk(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Any</option>
              <option value="1">With milk 🥛</option>
              <option value="0">No milk</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-stone-500 font-medium">Min energy</span>
            <select
              value={minEnergy}
              onChange={(e) => setMinEnergy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-stone-300 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>⚡ {n}+</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => { setTaste(''); setMilk(''); setMinEnergy(''); }}
              disabled={!hasFilters}
              className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✕ Clear filters
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
          <div className="text-stone-600 text-lg animate-pulse">Loading coffees…</div>
        </div>
      ) : coffees.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-neutral-800 font-medium">No coffees match those filters</p>
          <p className="text-stone-500 text-sm mt-1">Try loosening taste, milk or energy requirements.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {coffees.map((c) => (
            <CoffeeCard key={c._id} coffee={c} user={user} onLogged={() => fetchCoffees()} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Card ─────────────────────────── */

function CoffeeCard({ coffee, user, onLogged }) {
  // Quick-log state (per card)
  const [open, setOpen] = useState(false);
  const [cups, setCups] = useState(1);
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loggedMsg, setLoggedMsg] = useState('');
  const [cardError, setCardError] = useState('');

  const handleLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setCardError('');
    setLoggedMsg('');
    try {
      await api.createDay({
        username: user.username,
        coffee_name: coffee.name,
        count_of_cups: parseInt(cups, 10),
        rating,
      });
      setLoggedMsg(`Logged ${cups} ${cups === 1 ? 'cup' : 'cups'}! ☕`);
      setOpen(false);
      setCups(1);
      setRating(0);
      onLogged(); // refresh stats
      setTimeout(() => setLoggedMsg(''), 3000);
    } catch (err) {
      setCardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm flex flex-col gap-4 hover:border-stone-300 transition-colors">
      {/* Top: name + badges */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-neutral-900 text-lg leading-tight">{coffee.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-600">
              {coffee.taste}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-500">
              ⚡ {coffee.energy_boost}/10
            </span>
            {coffee.milk === 1 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-coffee-100 text-coffee-700">
                milk 🥛
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats: community average */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <div>
          <div className="text-xs text-stone-400 uppercase tracking-wide">Community</div>
          <div className="flex items-center gap-2 mt-0.5">
            {coffee.avg_rating != null ? (
              <>
                <StarRating value={Math.round(coffee.avg_rating)} readOnly size="sm" />
                <span className="text-sm font-bold text-neutral-900">{coffee.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-stone-400">No ratings yet</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400 uppercase tracking-wide">Logged</div>
          <div className="text-sm text-stone-600 mt-0.5">
            {coffee.total_cups} {coffee.total_cups === 1 ? 'cup' : 'cups'}
            <span className="text-stone-400"> · {coffee.total_entries} {coffee.total_entries === 1 ? 'entry' : 'entries'}</span>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {loggedMsg && (
        <div className="bg-stone-100 border border-stone-300 text-neutral-800 px-3 py-2 rounded-lg text-sm">
          {loggedMsg}
        </div>
      )}
      {cardError && (
        <div className="bg-rust-100 border border-rust-300 text-rust-700 px-3 py-2 rounded-lg text-sm">
          {cardError}
        </div>
      )}

      {/* Quick log */}
      {user ? (
        open ? (
          <form onSubmit={handleLog} className="space-y-3 border-t border-stone-100 pt-3">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                Cups
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={cups}
                  onChange={(e) => setCups(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-lg border border-stone-300 text-center focus:outline-none focus:ring-2 focus:ring-coffee-500"
                />
              </label>
              <StarRating value={rating} onChange={setRating} size="sm" />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-coffee-800 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Logging…' : 'Log it ☕'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            + Log this coffee
          </button>
        )
      ) : (
        <Link
          href="/login"
          className="block text-center w-full py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Log in to track
        </Link>
      )}
    </div>
  );
}
