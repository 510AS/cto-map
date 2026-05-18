import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "./Navigation";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "CTO Learning Helper",
  description:
    "Track progress through the 52-week Technical CTO Mastery curriculum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                var dark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Providers>
          {/* Desktop: sidebar left + content right */}
          <div className="flex min-h-screen">
            {/* Sidebar — hidden on mobile, visible on md+ */}
            <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚀</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                    CTO Helper
                  </span>
                </div>
              </div>
              <Navigation variant="sidebar" />
            </aside>

            {/* Main content area */}
            <main className="flex-1 md:ml-60 pb-20 md:pb-0">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</div>
            </main>
          </div>

          {/* Bottom nav — visible on mobile, hidden on md+ */}
          <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 md:hidden z-50 shadow-lg">
            <Navigation variant="bottom" />
          </nav>
        </Providers>
      </body>
    </html>
  );
}
