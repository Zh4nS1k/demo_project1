'use client';

import { AuthProvider } from '@/context/AuthContext';
import { UIProvider } from '@/context/UIContext';
import { I18nProvider } from '@/context/I18nContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SidePanel from '@/components/layout/SidePanel';
import AuthPromptModal from '@/components/AuthPromptModal';

/**
 * App shell: persistent header, collapsible side panel + content row, footer.
 * The side panel hides itself on the auth pages.
 */
export default function Providers({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <UIProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 min-w-0">
              <SidePanel />
              <main className="flex-1 min-w-0">
                <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">{children}</div>
              </main>
            </div>
            <Footer />
          </div>
          <AuthPromptModal />
        </UIProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
