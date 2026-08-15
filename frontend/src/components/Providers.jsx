'use client';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
    </AuthProvider>
  );
}
