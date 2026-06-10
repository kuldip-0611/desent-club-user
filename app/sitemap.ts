import type { MetadataRoute } from 'next'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://desenclub.com').replace(/\/+$/, '')

type SitemapData = {
  products: { slug: string; updatedAt: string }[]
  categories: { slug: string }[]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/orders`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/profile`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  try {
    const res = await fetch(`${API_URL}/shop/sitemap-data`, { next: { revalidate: 3600 } })
    if (!res.ok) return staticRoutes
    const data: SitemapData = await res.json()

    const productRoutes: MetadataRoute.Sitemap = data.products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const categoryRoutes: MetadataRoute.Sitemap = data.categories.map((c) => ({
      url: `${SITE_URL}/products?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...productRoutes, ...categoryRoutes]
  } catch {
    return staticRoutes
  }
}
