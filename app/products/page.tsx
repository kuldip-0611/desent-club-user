import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProductsPageModule } from '@/modules/shop/products-page'

export const metadata: Metadata = {
  title: 'Products | Desent Club',
  description: 'Browse premium tshirts, tracks, and everyday fashion essentials.',
}

type ProductsRouteProps = {
  searchParams: Promise<{ category?: string; audience?: string; subcategory?: string }>
}

export default async function ProductsRoute({ searchParams }: ProductsRouteProps) {
  const params = await searchParams
  return (
    <StoreShell>
      <ProductsPageModule
        initialCategory={params.category ?? 'all'}
        initialAudience={params.audience ?? 'all'}
        initialSubcategory={params.subcategory ?? ''}
      />
    </StoreShell>
  )
}
