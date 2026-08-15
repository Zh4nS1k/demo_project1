'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

/**
 * Persistent site header: logo, primary nav, auth state.
 * Minimalist: single hairline, no shadows, whitespace over boxes.
 */
export default function Header() {
  const { user, logout } = useAuth();
  const { toggleMobilePanel } = useUI();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the user menu on navigation
  useEffect(() => setMenuOpen(false), [pathname]);

  // Click-away for the user dropdown
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
          active ? 'text-neutral-900 font-medium' : 'text-stone-500 hover:text-neutral-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
        {/* Mobile: hamburger opens the side panel drawer */}
        <button
          onClick={toggleMobilePanel}
          className="lg:hidden p-2 -ml-2 rounded-md text-stone-500 hover:text-neutral-900 hover:bg-stone-100"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-900 tracking-tight">
          <span className="text-lg">☕</span>
          <span className="hidden sm:inline">Coffee Drinker</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navLink('/', 'Home')}
          {navLink('/coffees', 'Coffees')}
          {navLink('/leaderboard', 'Leaderboard')}
          {user && navLink('/profile', 'Profile')}
          {user?.role === 'admin' && navLink('/admin', 'Admin')}
        </nav>

        <div className="flex-1" />

        {/* Auth state */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 transition-colors"
              aria-label="Account menu"
            >
              <span className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-semibold flex items-center justify-center">
                {(user.name || user.username || '?')[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline text-sm text-stone-600">{user.username}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg py-1 shadow-xl">
                <div className="px-3 py-2 border-b border-stone-100">
                  <div className="text-sm font-medium text-neutral-900 truncate">{user.name}</div>
                  <div className="text-xs text-stone-400">@{user.username}</div>
                </div>
                <Link href="/profile" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-neutral-900">
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-neutral-900">
                    Admin panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-neutral-900"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Link href="/login" className="px-3 py-1.5 rounded-md text-sm text-stone-600 hover:text-neutral-900 hover:bg-stone-100 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 rounded-md text-sm font-medium bg-neutral-900 text-white hover:bg-coffee-800 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
