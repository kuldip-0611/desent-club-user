'use client'

import { Suspense } from 'react'
import { Navbar } from '@/modules/shop/components/navbar'
import { Footer } from '@/modules/shop/components/footer'
import { AuthModal } from '@/modules/shop/components/auth-modal'
import { CartDrawer } from '@/modules/shop/components/cart-drawer'
import { FlashSaleBanner } from '@/modules/shop/components/flash-sale-banner'
import { useCartSync } from '@/hooks/use-cart-sync'
import { useUtmTracking } from '@/hooks/use-utm'

type StoreShellProps = {
  children: React.ReactNode
}

const CartSyncWatcher = () => {
  useCartSync()
  return null
}

const AppWatchers = () => {
  useUtmTracking()
  return null
}

export const StoreShell = ({ children }: StoreShellProps) => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <CartSyncWatcher />
    <Suspense fallback={null}>
      <AppWatchers />
    </Suspense>
    <div className="sticky top-0 z-50">
      <FlashSaleBanner />
      <Navbar />
    </div>
    {children}
    <Footer />
    <AuthModal />
    <CartDrawer />
  </div>
)
