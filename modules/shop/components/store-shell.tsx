'use client'

import { Navbar } from '@/modules/shop/components/navbar'
import { Footer } from '@/modules/shop/components/footer'
import { AuthModal } from '@/modules/shop/components/auth-modal'
import { CartDrawer } from '@/modules/shop/components/cart-drawer'

type StoreShellProps = {
  children: React.ReactNode
}

export const StoreShell = ({ children }: StoreShellProps) => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <Navbar />
    {children}
    <Footer />
    <AuthModal />
    <CartDrawer />
  </div>
)
