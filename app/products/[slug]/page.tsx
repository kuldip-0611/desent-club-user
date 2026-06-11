import type { Metadata } from 'next'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { ProductDetailPageModule } from '@/modules/shop/product-detail-page'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://desenclub.com'

type ProductDetailRouteProps = {
  params: Promise<{ slug: string }>
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
        category: { name: string }
      }

      const title = `${product.name} | Desent Club`
      const description = product.description?.slice(0, 160) || `Buy ${product.name} at Desent Club — premium clothing delivered to your door.`
      const image = product.images[0] ?? `${SITE_URL}/og-default.jpg`

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/products/${slug}`,
          images: [{ url: image, width: 800, height: 1000, alt: product.name }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [image],
        },
        keywords: [product.name, product.category.name, 'clothing', 'fashion', 'Desent Club'],
      }
    }
  } catch {
    // fallback below
  }

  const humanName = slug.split('--')[0]?.replace(/-/g, ' ') ?? slug
  return {
    title: `${humanName} | Desent Club`,
    description: `Buy ${humanName} at Desent Club — premium clothing delivered to your door.`,
  }
}

export default async function ProductDetailRoute({ params }: ProductDetailRouteProps) {
  const { slug } = await params

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
          url: `https://desentclub.com/products/${slug}`,
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://desentclub.com' },
          { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://desentclub.com/products' },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `https://desentclub.com/products/${slug}`,
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
      <ProductDetailPageModule slug={slug} />
    </StoreShell>
  )
}
