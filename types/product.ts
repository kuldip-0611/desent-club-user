export type ProductCategoryRef = {
  id: string
  slug: string
  name: string
}
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
  category: ProductCategoryRef
  subcategory: { slug: string; name: string } | null
  audience: ProductAudience
  price: number
  mrp?: number
  compareAtPrice?: number
  gstRate?: number
  rating: number
  reviewsCount: number
  tags: string[]
  images: string[]
  imagesByColor?: Record<string, string[]>
  variants: ProductVariant[]
  isNewArrival?: boolean
  isBestSeller?: boolean
  flashSale?: {
    salePrice: number
    endsAt: string
    label?: string
  } | null
  /** Fabric compositions e.g. [{name:"Cotton",percent:80},{name:"Polyester",percent:20}] */
  materials?: { name: string; percent?: number }[]
  /** Raw field from backend before normalisation */
  productFabrics?: { fabric: { name: string }; percent: number }[]
}

export type ProductFilters = {
  search?: string
  category?: string | 'all'
  subcategory?: string
  audience?: ProductAudience | 'all'
  minPrice?: number
  maxPrice?: number
  sizes?: string[]
  colors?: string[]
  minRating?: number
  sort?: 'featured' | 'price-low' | 'price-high' | 'newest' | 'rating'
  page?: number
  limit?: number
  ids?: string
  fabrics?: string[]
}
