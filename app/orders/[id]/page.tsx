export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { OrderDetailPageModule } from '@/modules/shop/order-detail-page'

type OrderDetailRouteProps = {
  params: Promise<{ id: string }>
}

export default async function OrderDetailRoute({ params }: OrderDetailRouteProps) {
  const { id } = await params

  return (
    <StoreShell>
      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">Loading order…</div>}>
        <OrderDetailPageModule orderId={id} />
      </Suspense>
    </StoreShell>
  )
}
