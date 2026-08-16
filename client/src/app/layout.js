import './globals.css';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import Providers from '@/components/Providers';

export const metadata = {
  title: '☕ Coffee Drinker',
  description: 'Track your daily coffee consumption',
};

// Self-hosted via next/font — no runtime requests, no layout shift
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

const themeBootstrap = `(function(){try{var t=localStorage.getItem('coffee:theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the theme class may differ on first client paint
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen antialiased font-sans">
        {/* Applies the theme class before first paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
