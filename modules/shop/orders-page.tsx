'use client'

import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'

export const OrdersPageModule = () => {
  const { user, requireAuth } = useAuthGuard()

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="mt-2 text-sm text-slate-500">Please login to access order history.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => {})}>
            Login
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-3 text-2xl font-bold">Orders</h1>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        No orders yet. Place your first order from checkout.
      </div>
    </main>
  )
}
