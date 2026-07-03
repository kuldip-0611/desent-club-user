import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import CombosPage from '@/modules/shop/combos-page'

export const metadata: Metadata = {
  title: 'Combo Deals | Disent Club',
  description: 'Shop exclusive combo deals — get more products at a special bundled price.',
}

export default function Combos() {
  return (
    <StoreShell>
      <CombosPage />
    </StoreShell>
  )
}
