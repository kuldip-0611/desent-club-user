'use client'

import { Navbar } from '@/modules/shop/components/navbar'
import { Footer } from '@/modules/shop/components/footer'
import { AuthModal } from '@/modules/shop/components/auth-modal'
import { CartDrawer } from '@/modules/shop/components/cart-drawer'
import { FlashSaleBanner } from '@/modules/shop/components/flash-sale-banner'
import { useCartSync } from '@/hooks/use-cart-sync'

type StoreShellProps = {
  children: React.ReactNode
}

const CartSyncWatcher = () => {
  useCartSync()
  return null
}

export const StoreShell = ({ children }: StoreShellProps) => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <CartSyncWatcher />
    <FlashSaleBanner />
    <Navbar />
    {children}
    <Footer />
    <AuthModal />
    <CartDrawer />
  </div>
)
