'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navLink = (href, label) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-coffee-700 text-white'
            : 'text-stone-300 hover:bg-stone-800 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-neutral-950 border-b border-neutral-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <span className="text-2xl">☕</span>
          <span>Coffee Drinker</span>
        </Link>

        <div className="flex items-center gap-2">
          {navLink('/coffees', 'Coffees')}
          {user ? (
            <>
              {navLink('/', 'Home')}
              {navLink('/profile', 'Profile')}
              {user.role === 'admin' && navLink('/admin', 'Admin')}
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {navLink('/login', 'Login')}
              {navLink('/register', 'Register')}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
