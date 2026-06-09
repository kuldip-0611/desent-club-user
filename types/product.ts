export type ProductCategory = string
export type ProductAudience = 'MEN' | 'WOMEN' | 'UNISEX'

export type ProductVariant = {
  id: string
  size: 'S' | 'M' | 'L' | 'XL'
  colorName: string
  colorHex: string
  stock: number
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  category: ProductCategory
  audience: ProductAudience
  price: number
  compareAtPrice?: number
  rating: number
  reviewsCount: number
  tags: string[]
  images: string[]
  imagesByColor?: Record<string, string[]>
  variants: ProductVariant[]
  isNewArrival?: boolean
  isBestSeller?: boolean
}

export type ProductFilters = {
  search?: string
  category?: ProductCategory | 'all'
  audience?: ProductAudience | 'all'
  minPrice?: number
  maxPrice?: number
  sizes?: string[]
  colors?: string[]
  minRating?: number
  sort?: 'featured' | 'price-low' | 'price-high' | 'newest' | 'rating'
  page?: number
  limit?: number
}
