import { StoreShell } from '@/modules/shop/components/store-shell'
import { WishlistPageModule } from '@/modules/shop/wishlist-page'

export default function WishlistRoute() {
  return (
    <StoreShell>
      <WishlistPageModule />
    </StoreShell>
  )
}
