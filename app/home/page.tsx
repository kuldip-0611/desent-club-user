import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { HomePageModule } from '@/modules/shop/home-page'

export const metadata: Metadata = {
  title: 'Disent Clung | Premium Street & Sports Fashion',
  description: 'Modern ecommerce fashion store with premium fits and performance apparel.',
}

export default function HomeRoute() {
  return (
    <StoreShell>
      <HomePageModule />
    </StoreShell>
  )
}
