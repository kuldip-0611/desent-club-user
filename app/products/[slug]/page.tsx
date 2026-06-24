import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProductDetailPageModule } from '@/modules/shop/product-detail-page'
import { SITE_URL } from '@/constants/site'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string; saleId?: string }>
}

export async function generateMetadata({ params }: ProductDetailRouteProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const res = await fetch(`${API_URL}/shop/products/${slug}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const product = await res.json() as {
        name: string
        description: string
        price: number
        images: string[]
        category?: { name: string }
      }

      const title = `${product.name} | Disent Club`
      const description = product.description?.slice(0, 160) || `Buy ${product.name} at Disent Club — premium clothing delivered to your door.`
      const productImage = product.images[0]
      // Use dynamic OG route to produce a landscape 1200×630 image (WhatsApp/social requires landscape)
      const ogImageUrl = productImage
        ? `${SITE_URL}/api/og?title=${encodeURIComponent(product.name)}&subtitle=${encodeURIComponent((product.category?.name) ?? 'Disent Club')}&image=${encodeURIComponent(productImage)}`
        : `${SITE_URL}/og-image.jpg`

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/products/${slug}`,
          images: [{ url: ogImageUrl, width: 1200, height: 630, alt: product.name }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImageUrl],
        },
        keywords: [product.name, product.category?.name ?? '', 'clothing', 'fashion', 'Disent Club'].filter(Boolean),
      }
    }
  } catch {
    // fallback below
  }

  const humanName = slug.split('--')[0]?.replace(/-/g, ' ') ?? slug
  return {
    title: `${humanName} | Disent Club`,
    description: `Buy ${humanName} at Disent Club — premium clothing delivered to your door.`,
  }
}

export default async function ProductDetailRoute({ params, searchParams }: ProductDetailRouteProps) {
  const { slug } = await params
  const { from, saleId } = await searchParams

  // Fetch product for JSON-LD structured data
  let jsonLd: Record<string, unknown> | null = null
  let breadcrumbLd: Record<string, unknown> | null = null
  try {
    const res = await fetch(`${API_URL}/shop/products/${slug}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const product = await res.json() as {
        id: string
        name: string
        description: string
        price: number
        images: string[]
        isAvailable?: boolean
        reviews?: { rating: number }[]
      }

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images?.[0],
        sku: product.id,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'INR',
          availability:
            product.isAvailable !== false
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: `${SITE_URL}/products/${slug}`,
        },
        ...(product.reviews && product.reviews.length > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: (
                  product.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                  product.reviews.length
                ).toFixed(1),
                reviewCount: product.reviews.length,
              },
            }
          : {}),
      }

      breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `${SITE_URL}/products/${slug}`,
          },
        ],
      }
    }
  } catch {
    // JSON-LD is best-effort; don't block rendering
  }

  return (
    <StoreShell>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ProductDetailPageModule slug={slug} fromSale={from === 'sale'} saleId={saleId} />
    </StoreShell>
  )
}
