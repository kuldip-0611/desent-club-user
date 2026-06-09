import { StoreShell } from '@/modules/shop/components/store-shell'
import { CartPageModule } from '@/modules/shop/cart-page'

export default function CartRoute() {
  return (
    <StoreShell>
      <CartPageModule />
    </StoreShell>
  )
}
