import { StoreShell } from '@/modules/shop/components/store-shell'
import { OrdersPageModule } from '@/modules/shop/orders-page'

export default function OrdersRoute() {
  return (
    <StoreShell>
      <OrdersPageModule />
    </StoreShell>
  )
}
