'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useUI } from '@/context/UIContext';

const TASTES = [
  'sweet', 'bitter', 'sour', 'salty', 'umami',
  'nutty', 'chocolate', 'fruity', 'floral', 'caramel', 'spicy', 'earthy',
];

// Module-level cache: coffees rarely change — don't refetch on every navigation
let coffeeCache = null;

const Chevron = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

/**
 * Collapsible left panel: searchable coffee list + taste filter chips.
 * - Desktop (lg+): expanded list ↔ icon-only rail; preference persisted.
 * - Mobile: fully hidden; hamburger in Header opens it as a drawer.
 */
export default function SidePanel() {
  const { panelOpen, togglePanel, mobilePanelOpen, closeMobilePanel } = useUI();
  const tp = useTranslations('sidePanel');
  const tn = useTranslations('nav');
  const tt = useTranslations('tastes');
  const pathname = usePathname();
  const [coffees, setCoffees] = useState(coffeeCache || []);
  const [q, setQ] = useState('');
  const [taste, setTaste] = useState('');

  const hiddenOnRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (hiddenOnRoute || coffeeCache) return;
    api
      .getAllCoffees()
      .then((res) => {
        coffeeCache = res.data;
        setCoffees(res.data);
      })
      .catch(() => {});
  }, [hiddenOnRoute]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => closeMobilePanel(), [pathname, closeMobilePanel]);

  const filtered = useMemo(
    () =>
      coffees.filter(
        (c) =>
          (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
          (!taste || c.taste === taste)
      ),
    [coffees, q, taste]
  );

  if (hiddenOnRoute) return null;

  const content = (
    <div className="flex flex-col h-full min-h-0">
      {/* Search + taste chips */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tp('search')}
          className="w-full px-3 py-1.5 text-sm rounded-md border border-line bg-surface-2 text-ink placeholder-ink-3 focus:outline-none focus:ring-1 focus:ring-coffee-500 focus:bg-surface"
        />
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          <Chip active={taste === ''} onClick={() => setTaste('')}>{tp('all')}</Chip>
          {TASTES.map((tst) => (
            <Chip key={tst} active={taste === tst} onClick={() => setTaste(tst === taste ? '' : tst)}>
              {tt(tst)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Coffee list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {filtered.map((c) => (
          <Link
            key={c._id}
            href="/coffees"
            onClick={closeMobilePanel}
            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-sm text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
          >
            <span className="truncate">{c.name}</span>
            {c.avg_rating != null && (
              <span className="text-xs text-ink-3 shrink-0">★ {c.avg_rating.toFixed(1)}</span>
            )}
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-ink-3">{tp('noMatches')}</p>
        )}
      </nav>

      {/* Mobile-only nav (drawer bottom) */}
      <div className="md:hidden border-t border-line px-2 py-2 space-y-0.5">
        {[
          ['/', tn('home')],
          ['/coffees', tn('coffees')],
          ['/leaderboard', tn('leaderboard')],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            onClick={closeMobilePanel}
            className={`block px-3 py-2 rounded-md text-sm ${
              pathname === href ? 'text-ink font-medium' : 'text-ink-2'
            } hover:bg-surface-3`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop rail ── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-line bg-surface transition-[width] duration-200 ${
          panelOpen ? 'w-60' : 'w-14'
        }`}
      >
        <div className="h-12 flex items-center justify-between px-2 shrink-0">
          {panelOpen && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-3 pl-2">
              {tp('label')}
            </span>
          )}
          <button
            onClick={togglePanel}
            className="p-2 rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink transition-colors"
            aria-label={panelOpen ? 'Collapse panel' : 'Expand panel'}
          >
            <Chevron dir={panelOpen ? 'left' : 'right'} />
          </button>
        </div>

        {panelOpen ? (
          content
        ) : (
          <div className="flex flex-col items-center pt-2">
            <Link
              href="/coffees"
              className="p-2.5 rounded-md text-xl hover:bg-surface-3 transition-colors"
              title={tp('browse')}
            >
              ☕
            </Link>
          </div>
        )}
      </aside>

      {/* ── Mobile drawer ── */}
      {mobilePanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeMobilePanel} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface border-r border-line flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-line shrink-0">
              <span className="flex items-center gap-2 font-semibold text-ink">
                <span>☕</span> Coffee Drinker
              </span>
              <button
                onClick={closeMobilePanel}
                className="p-2 rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink"
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
        active ? 'bg-ink text-surface' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
      }`}
    >
      {children}
    </button>
  );
}
