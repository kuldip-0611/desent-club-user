import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { SalePageModule } from '@/modules/shop/sale-page'

export const metadata: Metadata = {
  title: 'Flash Sale | Disent Club',
  description: 'Limited-time flash deals. Huge discounts on selected products — shop before they\'re gone!',
}

export default function SalePage() {
  return (
    <StoreShell>
      <SalePageModule />
    </StoreShell>
  )
}
