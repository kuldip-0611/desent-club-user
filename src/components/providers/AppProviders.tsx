'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { createQueryClient } from '@/lib/query-client';
import { useUiStore } from '@/store/ui-store';
import { PushNotificationInitializer } from '@/components/push-notification-initializer';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(createQueryClient);
  const initTheme = useUiStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('auth_user');
    }
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <PushNotificationInitializer />
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
};
