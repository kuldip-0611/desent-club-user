'use client'

import { Suspense, useEffect } from 'react'
import { Navbar } from '@/modules/shop/components/navbar'
import { Footer } from '@/modules/shop/components/footer'
import { AuthModal } from '@/modules/shop/components/auth-modal'
import { CartDrawer } from '@/modules/shop/components/cart-drawer'
import { CompareBar } from '@/modules/shop/components/compare-bar'
import { FlashSaleBanner } from '@/modules/shop/components/flash-sale-banner'
import { useCartStore, flushCartSync } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useAuthStore } from '@/store/auth-store'
import { useUtmTracking } from '@/hooks/use-utm'

type StoreShellProps = {
  children: React.ReactNode
}

// Track which user's data has already been loaded so we don't overwrite
// in-memory cart changes when StoreInitializer re-mounts on page navigation
// (every page wraps its own <StoreShell>, so this component mounts fresh
// on every route change — without this flag each navigation would call
// loadFromServer() and wipe any items added since the last server sync).
let _loadedForUserId: string | null = null
let _cartRehydrated = false

const StoreInitializer = () => {
  const user = useAuthStore((s) => s.user)
  const loadCart = useCartStore((s) => s.loadFromServer)
  const syncWishlist = useWishlistStore((s) => s.syncFromServer)

  // Rehydrate guest cart from localStorage exactly once per app load.
  // We use skipHydration:true in the cart store to avoid the SSR race
  // where Next.js mounts client components before persist reads localStorage.
  useEffect(() => {
    if (!_cartRehydrated) {
      _cartRehydrated = true
      useCartStore.persist.rehydrate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) {
      // User logged out — reset the flag so the next login re-fetches
      _loadedForUserId = null
      return
    }
    // Already loaded for this user in this session — skip to avoid
    // overwriting cart items that haven't been flushed to the server yet
    if (_loadedForUserId === user.id) return
    _loadedForUserId = user.id
    flushCartSync()  // ensure any pending local writes reach the server first
    loadCart().catch(() => undefined)
    syncWishlist().catch(() => undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return null
}

const AppWatchers = () => {
  useUtmTracking()
  return null
}

export const StoreShell = ({ children }: StoreShellProps) => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <StoreInitializer />
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
    <CompareBar />
  </div>
)
