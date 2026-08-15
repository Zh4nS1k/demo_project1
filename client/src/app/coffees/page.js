'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import CoffeeCard from '@/components/CoffeeCard';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

export default function CoffeesPage() {
  const { user, requireAuth } = useAuth();

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
            <> — <Link href="/register" className="underline text-coffee-700">create an account</Link> to track what you drink</>
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
