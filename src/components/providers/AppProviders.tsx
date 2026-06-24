'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { createQueryClient } from '@/lib/query-client';
import { useUiStore } from '@/store/ui-store';
import { PushNotificationInitializer } from '@/components/push-notification-initializer';
import { getGstRate, getPublicSettings } from '@/services/settings.service';
import { setLiveGstRate, setShippingConfig } from '@/store/cart-store';
import { useGstStore } from '@/store/gst-store';
import { useFlashSaleStore } from '@/store/flash-sale-store';
import { apiClient } from '@/services/api/client';

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(createQueryClient);
  const initTheme = useUiStore((s) => s.initTheme);

  const setSaleMap = useFlashSaleStore((s) => s.setSaleMap)
  const setGstRate = useGstStore((s) => s.setRate)

  useEffect(() => {
    initTheme();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('auth_user');
    }
    getGstRate().then((rate) => { setLiveGstRate(rate); setGstRate(rate) }).catch(() => undefined)
    getPublicSettings().then((s) => {
      setShippingConfig(parseFloat(s.freeShippingThreshold) || 999, parseFloat(s.shippingFee) || 99)
    }).catch(() => undefined)

    // Load active flash sales and build product→sale map for badges
    type SaleGroup = { sale: { id: string; title: string; discountPercent: number }; items: { id: string }[] }
    apiClient.get<SaleGroup[]>('/flash-sales/all-with-products').then((r) => {
      const map: Record<string, { saleId: string; saleTitle: string; discountPercent: number }> = {}
      for (const group of r.data ?? []) {
        for (const item of group.items ?? []) {
          // keep highest discount if product is in multiple sales
          if (!map[item.id] || group.sale.discountPercent > map[item.id].discountPercent) {
            map[item.id] = { saleId: group.sale.id, saleTitle: group.sale.title, discountPercent: group.sale.discountPercent }
          }
        }
      }
      setSaleMap(map)
    }).catch(() => undefined)
  }, [initTheme, setSaleMap]);

  return (
    <QueryClientProvider client={queryClient}>
      <PushNotificationInitializer />
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
};
