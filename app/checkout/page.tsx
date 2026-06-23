export const dynamic = 'force-dynamic'

import { StoreShell } from '@/modules/shop/components/store-shell'
import { CheckoutPageModule } from '@/modules/shop/checkout-page'

export default function CheckoutRoute() {
  return (
    <StoreShell>
      <CheckoutPageModule />
    </StoreShell>
  )
}
