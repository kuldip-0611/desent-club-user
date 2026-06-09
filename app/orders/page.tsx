import { Suspense } from 'react'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { OrdersPageModule } from '@/modules/shop/orders-page'

export default function OrdersRoute() {
  return (
    <StoreShell>
      <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-500">Loading orders…</div>}>
        <OrdersPageModule />
      </Suspense>
    </StoreShell>
  )
}
