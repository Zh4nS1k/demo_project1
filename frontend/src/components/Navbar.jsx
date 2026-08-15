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
            ? 'bg-amber-700 text-white'
            : 'text-amber-900 hover:bg-amber-100'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-amber-50 border-b border-amber-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-900">
          <span className="text-2xl">☕</span>
          <span>Coffee Drinker</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {navLink('/', 'Home')}
              {navLink('/profile', 'Profile')}
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
