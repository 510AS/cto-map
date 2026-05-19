'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ProgressProvider } from '@/lib/progress-context';
import { ToastProvider } from '@/lib/toast-context';
import { ThemeProvider } from '@/lib/theme-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import TodayButton from '@/components/TodayButton';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastProvider>
          <ProgressProvider>
            <ErrorBoundary>
              {children}
              <TodayButton />
              <KeyboardShortcuts />
            </ErrorBoundary>
            <ServiceWorkerRegistration />
          </ProgressProvider>
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
