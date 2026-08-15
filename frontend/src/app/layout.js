import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: '☕ Coffee Drinker',
  description: 'Track your daily coffee consumption',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
