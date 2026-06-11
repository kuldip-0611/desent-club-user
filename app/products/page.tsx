import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProductsPageModule } from '@/modules/shop/products-page'

type ProductsRouteProps = {
  searchParams: Promise<{ category?: string; audience?: string; subcategory?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: ProductsRouteProps): Promise<Metadata> {
  const params = await searchParams
  const page = params.page ?? '1'
  const isFirstPage = page === '1'
  const canonical = isFirstPage
    ? 'https://desentclub.com/products'
    : `https://desentclub.com/products?page=${page}`

  return {
    title: 'Products | Desent Club',
    description: 'Browse premium tshirts, tracks, and everyday fashion essentials.',
    alternates: { canonical },
    robots: isFirstPage
      ? { index: true, follow: true }
      : { index: false, follow: true },
  }
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
