'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCard } from '@/modules/shop/components/product-card'
import { Button } from '@/components/ui/button'
import { useProductQuery, useRelatedProductsQuery } from '@/hooks/query/use-products-query'
import { getProductReviews, type ProductReview } from '@/services/product.service'
import { useCartStore } from '@/store/cart-store'
import type { ProductVariant } from '@/types/product'

type ProductDetailPageProps = {
  slug: string
}

const formatReviewDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const StarRow = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
  <p className={`text-amber-500 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
    {'★'.repeat(rating)}
    {'☆'.repeat(5 - rating)}
  </p>
)

export const ProductDetailPageModule = ({ slug }: ProductDetailPageProps) => {
  const addLine = useCartStore((s) => s.addLine)
  const { data: product, isLoading } = useProductQuery(slug)
  const { data: related } = useRelatedProductsQuery(product?.slug)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewsCount: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const variant = useMemo(() => selectedVariant ?? product?.variants[0] ?? null, [selectedVariant, product?.variants])
  const displayImages = useMemo(() => {
    if (!product) return []
    if (!variant) return product.images
    const key = variant.colorName.toLowerCase()
    return product.imagesByColor?.[key] ?? product.images
  }, [product, variant])

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0]
    for (const review of reviews) {
      counts[review.rating] = (counts[review.rating] ?? 0) + 1
    }
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] ?? 0,
      pct: reviews.length ? Math.round(((counts[star] ?? 0) / reviews.length) * 100) : 0,
    }))
  }, [reviews])

  useEffect(() => {
    setActiveImage(0)
  }, [variant?.id])

  useEffect(() => {
    if (!slug) return
    setReviewsLoading(true)
    getProductReviews(slug)
      .then((res) => {
        setReviews(res.items)
        setReviewStats({ averageRating: res.averageRating, reviewsCount: res.reviewsCount })
      })
      .catch(() => {
        setReviews([])
        setReviewStats({ averageRating: 0, reviewsCount: 0 })
      })
      .finally(() => setReviewsLoading(false))
  }, [slug])

  if (isLoading || !product) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">Loading product...</div>
  }

  const hasReviews = reviewStats.reviewsCount > 0

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <Image src={displayImages[activeImage] ?? displayImages[0]} alt={product.name} fill className="object-cover transition duration-300 hover:scale-105" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {displayImages.map((img, idx) => (
              <button
                key={img}
                className={`relative aspect-square overflow-hidden rounded-xl border ${idx === activeImage ? 'border-indigo-600' : 'border-slate-200'}`}
                onClick={() => setActiveImage(idx)}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/products" className="hover:text-indigo-600">
              Products
            </Link>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-indigo-600">
              {product.category.name}
            </Link>
            {product.subcategory ? (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}&subcategory=${product.subcategory.slug}`}
                  className="hover:text-indigo-600"
                >
                  {product.subcategory.name}
                </Link>
              </>
            ) : null}
          </nav>
          <h1 className="text-3xl font-black">{product.name}</h1>
          {hasReviews ? (
            <p className="text-sm text-amber-600">
              ★ {reviewStats.averageRating} · {reviewStats.reviewsCount} review{reviewStats.reviewsCount === 1 ? '' : 's'}
            </p>
          ) : (
            <p className="text-sm text-slate-500">No reviews yet</p>
          )}
          <p className="text-sm text-slate-600">{product.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">Rs. {product.price}</span>
            {product.compareAtPrice ? <span className="text-sm text-slate-400 line-through">Rs. {product.compareAtPrice}</span> : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Select variant</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedVariant(item)}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    variant?.id === item.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'
                  }`}
                >
                  {item.size} · {item.colorName}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">Stock: {variant?.stock ?? 0} units</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => {
                if (!variant) return
                addLine({
                  productId: product.id,
                  variantId: variant.id,
                  categoryId: product.category.id,
                  name: product.name,
                  slug: product.slug,
                  image: displayImages[0] ?? product.images[0],
                  size: variant.size,
                  color: variant.colorName,
                  unitPrice: product.price,
                  quantity: 1,
                })
              }}
            >
              Add to cart
            </Button>
            <Button variant="outline">Buy now</Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold">Customer reviews</h2>

        {reviewsLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading reviews...</p>
        ) : hasReviews ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="rounded-xl bg-slate-50 p-4 text-center lg:text-left">
              <p className="text-4xl font-black text-slate-900">{reviewStats.averageRating}</p>
              <StarRow rating={Math.round(reviewStats.averageRating)} size="lg" />
              <p className="mt-2 text-sm text-slate-600">
                Based on {reviewStats.reviewsCount} verified purchase{reviewStats.reviewsCount === 1 ? '' : 's'}
              </p>
              <div className="mt-4 space-y-1.5">
                {ratingBreakdown.map((row) => (
                  <div key={row.star} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-8">{row.star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="w-6 text-right">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <ul className="space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.user.name}</p>
                      <p className="text-xs text-slate-500">{formatReviewDate(review.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Verified purchase
                    </span>
                  </div>
                  <div className="mt-2">
                    <StarRow rating={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{review.comment}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400">No written review</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="font-medium text-slate-700">No reviews yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Purchase this product and share your experience after delivery.
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Related products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(related ?? []).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
