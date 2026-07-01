import { apiClient } from '@/services/api/client'
import type { Product, ProductFilters } from '@/types/product'

type ProductListResponse = {
  items: Product[]
  total: number
  page: number
  limit: number
  hasNextPage: boolean
}

export type ShopCategory = {
  id: string
  name: string
  slug: string
  image: string | null
  productCount: number
  subcategories: { id: string; name: string; slug: string; productCount: number }[]
}

export type HomeBanner = { title: string; subtitle: string; image: string; href: string }

export type ShopHomeResponse = {
  banners: HomeBanner[]
  midBanners: HomeBanner[]
  footerBanners: HomeBanner[]
  categories: ShopCategory[]
  featured: Product[]
  newest: Product[]
  bestSellers: Product[]
}

const mediaUrl = (path: string): string => {
  if (!path) return path
  if (path.startsWith('http')) return path
  const root = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')
  return `${root}${path.startsWith('/') ? path : `/${path}`}`
}

const normalizeProduct = (product: Product): Product => ({
  ...product,
  images: (product.images ?? []).map(mediaUrl),
  imagesByColor: Object.fromEntries(
    Object.entries(product.imagesByColor ?? {}).map(([key, values]) => [key, values.map(mediaUrl)]),
  ),
  materials: (product.productFabrics ?? []).map((pf) => ({
    name: pf.fabric.name,
    percent: pf.percent,
  })),
})

export const listProducts = async (filters: ProductFilters = {}): Promise<ProductListResponse> => {
  const categoryParam = filters.category && filters.category !== 'all' ? filters.category : undefined
  const subParam =
    filters.subcategory?.trim() &&
    categoryParam &&
    filters.category &&
    filters.category !== 'all'
      ? filters.subcategory.trim().toLowerCase()
      : undefined
  const { data } = await apiClient.get<ProductListResponse>('/shop/products', {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      search: filters.search || undefined,
      category: categoryParam,
      subcategory: subParam,
      audience: filters.audience && filters.audience !== 'all' ? filters.audience : undefined,
      sort: filters.sort || 'featured',
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      colors: filters.colors?.join(',') || undefined,
      sizes: filters.sizes?.join(',') || undefined,
      minRating: filters.minRating,
      ids: filters.ids || undefined,
    },
  })
  return { ...data, items: data.items.map(normalizeProduct) }
}

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await apiClient.get<Product>(`/shop/products/${slug}`)
  return normalizeProduct(data)
}

export const listRelatedProducts = async (productSlug: string): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>(`/shop/products/${productSlug}/related`)
  return data.map(normalizeProduct)
}

export const listShopCategories = async (): Promise<ShopCategory[]> => {
  const { data } = await apiClient.get<ShopCategory[]>('/shop/categories')
  return data.map((item) => ({
    ...item,
    image: item.image ? mediaUrl(item.image) : null,
    subcategories: (item.subcategories ?? []).map((s) => ({
      ...s,
    })),
  }))
}

export type ProductReview = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  userId: string
  user: { name: string }
}

export type ProductReviewsResponse = {
  items: ProductReview[]
  total: number
  page: number
  totalPages: number
  averageRating: number
  reviewsCount: number
}

export const getProductReviews = async (
  productSlug: string,
  page = 1,
): Promise<ProductReviewsResponse> => {
  const { data } = await apiClient.get<ProductReviewsResponse>(`/shop/products/${productSlug}/reviews`, {
    params: { page, limit: 10 },
  })
  return data
}

export type SearchSuggestion = {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice?: number
  image: string | null
  category: { slug: string; name: string } | null
}

export const searchProducts = async (q: string, limit = 8): Promise<SearchSuggestion[]> => {
  if (!q || q.trim().length < 2) return []
  const { data } = await apiClient.get<SearchSuggestion[]>('/shop/search', { params: { q, limit } })
  return data.map((item) => ({
    ...item,
    image: item.image ? mediaUrl(item.image) : null,
  }))
}

export const subscribeBackInStock = async (
  productId: string,
  email: string,
  size?: string,
): Promise<void> => {
  await apiClient.post(`/products/${productId}/notify-me`, { email, size })
}

const mapBanners = (list: HomeBanner[] = []) =>
  list.map((b) => ({ ...b, image: mediaUrl(b.image) }))

export const getShopHome = async (): Promise<ShopHomeResponse> => {
  const { data } = await apiClient.get<ShopHomeResponse>('/shop/home')
  return {
    ...data,
    banners: mapBanners(data.banners),
    midBanners: mapBanners(data.midBanners),
    footerBanners: mapBanners(data.footerBanners),
    categories: data.categories.map((item) => ({
      ...item,
      image: item.image ? mediaUrl(item.image) : null,
      subcategories: item.subcategories ?? [],
    })),
    featured: data.featured.map(normalizeProduct),
    newest: data.newest.map(normalizeProduct),
    bestSellers: data.bestSellers.map(normalizeProduct),
  }
}
