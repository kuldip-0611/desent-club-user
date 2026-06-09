import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProductDetailPageModule } from '@/modules/shop/product-detail-page'

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductDetailRouteProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug.replace(/-/g, ' ')} | Desent Club`,
    description: 'Product details, variants, reviews, and related styles.',
  }
}

export default async function ProductDetailRoute({ params }: ProductDetailRouteProps) {
  const { slug } = await params
  return (
    <StoreShell>
      <ProductDetailPageModule slug={slug} />
    </StoreShell>
  )
}
