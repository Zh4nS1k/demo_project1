import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: '☕ Coffee Drinker',
  description: 'Track your daily coffee consumption',
};

const themeBootstrap = `(function(){try{var t=localStorage.getItem('coffee:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {/* Applies the theme class before first paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
