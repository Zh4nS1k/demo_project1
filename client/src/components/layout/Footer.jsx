import Link from 'next/link';

/** Minimal footer: identity, a few links, copyright. */
export default function Footer() {
  return (
    <footer className="border-t border-stone-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone-400">
        <div className="flex items-center gap-2">
          <span>☕</span>
          <span className="font-medium text-stone-500">Coffee Drinker</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/" className="hover:text-stone-600 transition-colors">Home</Link>
          <Link href="/coffees" className="hover:text-stone-600 transition-colors">Coffees</Link>
          <Link href="/leaderboard" className="hover:text-stone-600 transition-colors">Leaderboard</Link>
        </nav>
        <p>© {new Date().getFullYear()} Coffee Drinker</p>
      </div>
    </footer>
  );
}
