import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE_URL } from '@/constants/site'
import { SharedWishlistClient } from './SharedWishlistClient'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')

type Props = { searchParams: Promise<{ ids?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ids: rawIds } = await searchParams
  const ids = (rawIds ?? '').split(',').filter(Boolean)

  const title = 'Shared Wishlist | Disent Club'
  const description = 'Check out these picks from a Disent Club wishlist — premium streetwear & essentials.'
  let image = `${SITE_URL}/og-image.jpg`

  if (ids.length > 0) {
    try {
      const res = await fetch(`${API_URL}/shop/products?ids=${ids.join(',')}&limit=1`, {
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const data = await res.json() as { items?: { images?: string[] }[] }
        const firstImage = data.items?.[0]?.images?.[0]
        if (firstImage) {
          const ogParams = new URLSearchParams({ title: 'Shared Wishlist', subtitle: 'Disent Club picks', image: firstImage })
          image = `${SITE_URL}/api/og?${ogParams.toString()}`
        }
      }
    } catch {
      // fallback to default OG image
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/wishlist/shared`,
      images: [{ url: image, width: 800, height: 1000, alt: 'Disent Club Wishlist' }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function SharedWishlistPage() {
  return (
    <Suspense>
      <SharedWishlistClient />
    </Suspense>
  )
}
