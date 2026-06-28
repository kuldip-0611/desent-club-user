'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, ZoomIn, Ruler, Share2, MessageCircle, Link2, Check } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { Button } from '@/components/ui/button'
import { useProductQuery, useRelatedProductsQuery } from '@/hooks/query/use-products-query'
import { getProductReviews, subscribeBackInStock, type ProductReview } from '@/services/product.service'
import { getActiveBundles, type ActiveBundle } from '@/services/bundle.service'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/services/api/client'
import type { ProductVariant } from '@/types/product'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { FlashSaleCountdown } from '@/components/ui/flash-sale-countdown'
import { useFlashSaleStore } from '@/store/flash-sale-store'
import { useGstStore } from '@/store/gst-store'
import { toast } from 'react-hot-toast'

type ProductDetailPageProps = {
  slug: string
  fromSale?: boolean
  saleId?: string
}

type SizeChartData = {
  attributes: { slug: string; label: string; unit?: string | null }[]
  rows: { size: string; values: Record<string, string> }[]
}

const formatReviewDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const StarRow = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => (
  <p className={`text-amber-500 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
    {'★'.repeat(rating)}
    {'☆'.repeat(5 - rating)}
  </p>
)

export const ProductDetailPageModule = ({ slug, fromSale, saleId }: ProductDetailPageProps) => {
  const addLine = useCartStore((s) => s.addLine)
  const user = useAuthStore((s) => s.user)
  const { data: product, isLoading } = useProductQuery(slug)
  const { data: related } = useRelatedProductsQuery(product?.slug)
  const { addViewed } = useRecentlyViewed()

  const gstRate = useGstStore((s) => s.rate)

  // Flash sale overlay from Zustand (populated at app boot)
  const storeSaleInfo = useFlashSaleStore((s) => product ? (s.saleMap[product.id] ?? null) : null)
  // Merge: API flashSale takes priority (most specific), then Zustand store sale, then nothing
  const activeSale = product?.flashSale ?? (storeSaleInfo ? {
    saleId: storeSaleInfo.saleId,
    saleTitle: storeSaleInfo.saleTitle,
    discountPercent: storeSaleInfo.discountPercent,
    salePrice: Math.round(product!.price * (100 - storeSaleInfo.discountPercent)) / 100,
    endsAt: null as string | null,
    label: storeSaleInfo.saleTitle,
  } : null)
  // Best discount %: max of flash sale, compare-at discount, product's own discountPercent
  const compareDiscount = product?.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0
  const flashDiscount = storeSaleInfo?.discountPercent
    ?? (product?.flashSale && product.price > 0
      ? Math.round(((product.price - product.flashSale.salePrice) / product.price) * 100)
      : 0)
  const bestDiscount = Math.max(flashDiscount, compareDiscount)
  // Effective display price
  const displayPrice = activeSale
    ? activeSale.salePrice
    : product?.price ?? 0
  const strikePrice = activeSale
    ? product?.price
    : product?.compareAtPrice ?? null

  const [activeImage, setActiveImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, reviewsCount: 0 })
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [sizeChart, setSizeChart] = useState<SizeChartData | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [activeBundle, setActiveBundle] = useState<ActiveBundle | null>(null)
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notifySize, setNotifySize] = useState('')
  const [notifySubmitting, setNotifySubmitting] = useState(false)
  const [notifySuccess, setNotifySuccess] = useState(false)

  // Review submit
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewOrderItemId, setReviewOrderItemId] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [deliveredItems, setDeliveredItems] = useState<{ id: string; name: string; orderId: string }[]>([])
  const [hasPendingOrder, setHasPendingOrder] = useState(false)

  const handleShare = async (platform: 'whatsapp' | 'copy') => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Check out ${product?.name ?? 'this product'} on Disent Club! ${url}`
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  // ── Two-step variant selection: Size → Color ──────────────────────────────
  // All unique sizes (preserving order from variants)
  const availableSizes = useMemo(() => {
    if (!product) return []
    return [...new Map(product.variants.map((v) => [v.size, v])).keys()]
  }, [product])

  // Colors available for the selected size (only in-stock or show all with OOS state)
  const colorsForSize = useMemo(() => {
    if (!product || !selectedSize) return []
    const seen = new Map<string, ProductVariant>()
    for (const v of product.variants) {
      if (v.size === selectedSize && !seen.has(v.colorName)) {
        seen.set(v.colorName, v)
      }
    }
    return [...seen.values()]
  }, [product, selectedSize])

  // Auto-select first size on product load
  useEffect(() => {
    if (product && availableSizes.length && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [product, availableSizes, selectedSize])

  // When size changes, reset color and pick first available color
  useEffect(() => {
    if (!selectedSize || !product) return
    const colors = product.variants.filter((v) => v.size === selectedSize)
    const firstInStock = colors.find((v) => v.stock > 0) ?? colors[0]
    if (firstInStock) {
      setSelectedColor(firstInStock.colorName)
      setSelectedVariant(firstInStock)
    } else {
      setSelectedColor(null)
      setSelectedVariant(null)
    }
  }, [selectedSize, product])

  // When color changes, find matching variant
  useEffect(() => {
    if (!selectedSize || !selectedColor || !product) return
    const match = product.variants.find((v) => v.size === selectedSize && v.colorName === selectedColor)
    setSelectedVariant(match ?? null)
  }, [selectedSize, selectedColor, product])

  const variant = useMemo(() => selectedVariant ?? product?.variants[0] ?? null, [selectedVariant, product?.variants])
  const displayImages = useMemo(() => {
    if (!product) return []
    if (!variant) return product.images
    const key = variant.colorName.toLowerCase()
    return product.imagesByColor?.[key] ?? product.images
  }, [product, variant])

  const totalStock = useMemo(() => {
    if (!product) return 0
    return product.variants.reduce((sum, v) => sum + v.stock, 0)
  }, [product])

  const variantStock = variant?.stock ?? 0
  const isOutOfStock = variant ? variantStock === 0 : totalStock === 0
  const isLowStock = !isOutOfStock && variantStock > 0 && variantStock <= 5

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

  // Track recently viewed
  useEffect(() => {
    if (product) addViewed(product.slug)
  }, [product, addViewed])

  // Pre-fill notify email from logged in user
  useEffect(() => {
    if (user?.email && !notifyEmail) {
      setNotifyEmail(user.email)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // Fetch order status for this product — gate review form on DELIVERED only
  useEffect(() => {
    if (!product || !user) return
    type OrderItem = { id: string; productId: string }
    type Order = { id: string; status: string; items: OrderItem[] }
    apiClient.get<{ items: Order[] }>(`/orders/my?limit=100`)
      .then((res) => {
        const orders: Order[] = (res.data as unknown as { items: Order[] }).items ?? []
        const deliveredMatched: { id: string; name: string; orderId: string }[] = []
        let pendingFound = false
        for (const order of orders) {
          for (const item of order.items ?? []) {
            if (item.productId !== product.id) continue
            if (order.status === 'DELIVERED') {
              deliveredMatched.push({ id: item.id, name: product.name, orderId: order.id })
            } else if (['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status)) {
              pendingFound = true
            }
          }
        }
        setDeliveredItems(deliveredMatched)
        setHasPendingOrder(pendingFound)
        if (deliveredMatched.length > 0) setReviewOrderItemId(deliveredMatched[0].id)
      })
      .catch(() => undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, user])

  const handleReviewSubmit = async () => {
    if (!product || !reviewOrderItemId) return
    setReviewSubmitting(true)
    try {
      await apiClient.post(`/shop/products/${product.slug}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        orderItemId: reviewOrderItemId,
      })
      setReviewSubmitted(true)
      toast.success('Review submitted! It will appear after moderation.')
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Could not submit review')
    } finally {
      setReviewSubmitting(false)
    }
  }

  // Fetch active bundle for this product
  useEffect(() => {
    if (!product) return
    getActiveBundles().then((bundles) => {
      const match = bundles.find((b) => b.productIds.includes(product.id))
      setActiveBundle(match ?? null)
    })
  }, [product])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % displayImages.length)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + displayImages.length) % displayImages.length)
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [lightboxOpen, displayImages.length])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const openSizeGuide = useCallback(async () => {
    setSizeGuideOpen(true)
    if (!sizeChart && product) {
      try {
        const { data } = await apiClient.get<SizeChartData>(`/shop/products/${product.slug}/size-chart`)
        setSizeChart(data)
      } catch {
        setSizeChart({ attributes: [], rows: [] })
      }
    }
  }, [sizeChart, product])

  const handleNotifyMe = async () => {
    if (!product) return
    if (!notifyEmail.trim()) { toast.error('Please enter your email'); return }
    setNotifySubmitting(true)
    try {
      await subscribeBackInStock(product.id, notifyEmail.trim(), notifySize || undefined)
      setNotifySuccess(true)
    } catch {
      toast.error('Could not subscribe. Please try again.')
    } finally {
      setNotifySubmitting(false)
    }
  }

  if (isLoading || !product) {
    return (
      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-2">
          {/* Image skeleton */}
          <div className="space-y-3">
            <div className="aspect-[4/5] animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="space-y-5">
            {/* Breadcrumb */}
            <div className="flex gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Title */}
            <div className="space-y-2">
              <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            {/* Rating */}
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
            {/* Price */}
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            {/* Stock badge */}
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
            {/* Size label */}
            <div className="h-4 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            {/* Size buttons */}
            <div className="flex gap-2">
              {['XS','S','M','L','XL'].map((s) => (
                <div key={s} className="h-10 w-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              ))}
            </div>
            {/* CTA buttons */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-11 animate-pulse rounded-lg bg-slate-300 dark:bg-slate-600" />
              <div className="h-11 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        </section>
      </main>
    )
  }

  const hasReviews = reviewStats.reviewsCount > 0

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <section className="grid gap-8 lg:grid-cols-2">
        {/* ── Image gallery ── */}
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => openLightbox(activeImage)}
              className="absolute inset-0 z-0 cursor-zoom-in"
              aria-label="Zoom image"
            >
              <Image
                src={displayImages[activeImage] ?? displayImages[0]}
                alt={product.name}
                fill
                className="object-cover transition duration-300"
              />
            </button>
            {/* Zoom icon */}
            <button
              onClick={() => openLightbox(activeImage)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 shadow backdrop-blur-sm hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-700"
              aria-label="Zoom image"
            >
              <ZoomIn className="h-4 w-4 text-slate-700 dark:!text-white" />
            </button>
            {/* Prev / Next arrows */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage((i) => (i - 1 + displayImages.length) % displayImages.length)}
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-slate-700/90 dark:hover:bg-slate-600"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-900 dark:text-white" />
                </button>
                <button
                  onClick={() => setActiveImage((i) => (i + 1) % displayImages.length)}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm hover:bg-white dark:bg-slate-700/90 dark:hover:bg-slate-600"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 text-slate-900 dark:text-white" />
                </button>
              </>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {displayImages.map((img, idx) => (
              <button
                key={img}
                className={`relative aspect-square overflow-hidden rounded-xl border ${idx === activeImage ? 'border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-600'}`}
                onClick={() => setActiveImage(idx)}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Product info ── */}
        <div className="space-y-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            {fromSale ? (
              <>
                <Link href={saleId ? `/sale/${saleId}` : '/sale'} className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20 dark:hover:bg-amber-400/20">
                  <ChevronLeft className="h-3 w-3" /> Back to Sale
                </Link>
                <span>/</span>
              </>
            ) : (
              <>
                <Link href="/products" className="hover:text-slate-600">Products</Link>
                <span>/</span>
              </>
            )}
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-slate-600">
              {product.category.name}
            </Link>
            {product.subcategory ? (
              <>
                <span>/</span>
                <Link
                  href={`/products?category=${product.category.slug}&subcategory=${product.subcategory.slug}`}
                  className="hover:text-slate-600"
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

          <div className="flex flex-wrap items-center gap-3">
            {activeSale && (
              <span className="flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-black">
                ⚡ {bestDiscount}% off
              </span>
            )}
            <span className="text-2xl font-bold">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {strikePrice ? (
              <span className="text-sm text-slate-400 line-through">
                ₹{strikePrice.toLocaleString('en-IN')}
              </span>
            ) : null}
            {!activeSale && bestDiscount > 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                {bestDiscount}% off
              </span>
            ) : null}
          </div>
          {/* Flash sale countdown — only if API provided an endsAt */}
          {activeSale?.endsAt && new Date(activeSale.endsAt) > new Date() && (
            <FlashSaleCountdown
              endsAt={activeSale.endsAt}
              salePrice={displayPrice}
              originalPrice={product.price}
              label={activeSale.label ?? 'Flash Sale'}
            />
          )}

          {/* Stock badge */}
          {isOutOfStock ? (
            <p className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Out of stock
            </p>
          ) : isLowStock ? (
            <p className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              🔥 Only {variantStock} left!
            </p>
          ) : (
            <p className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              ✓ In stock
            </p>
          )}

          {/* Variant selector — Step 1: Size, Step 2: Color */}
          <div className="space-y-4">
            {/* ── Step 1: Size ── */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Size
                  {selectedSize && <span className="ml-1.5 font-normal text-slate-500">— {selectedSize}</span>}
                </p>
                <button
                  onClick={() => void openSizeGuide()}
                  className="flex items-center gap-1 text-xs text-slate-900 hover:underline"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const allOos = product.variants.filter((v) => v.size === size).every((v) => v.stock === 0)
                  const isSelected = selectedSize === size
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      disabled={allOos}
                      className={`relative min-w-[3rem] rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900'
                          : allOos
                            ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 line-through dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                            : 'border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-600 dark:text-slate-200 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Step 2: Color (only shown after size is picked) ── */}
            {selectedSize && colorsForSize.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">
                  Color
                  {selectedColor && <span className="ml-1.5 font-normal text-slate-500">— {selectedColor}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colorsForSize.map((item) => {
                    const oos = item.stock === 0
                    const isSelected = selectedColor === item.colorName
                    return (
                      <button
                        key={item.id}
                        onClick={() => !oos && setSelectedColor(item.colorName)}
                        disabled={oos}
                        title={item.colorName}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-900'
                            : oos
                              ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400 line-through dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                              : 'border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-600 dark:text-slate-200 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900'
                        }`}
                      >
                        {/* Color swatch dot */}
                        <span
                          className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-slate-300 shadow-sm dark:border-white/40"
                          style={{ background: item.colorHex ?? '#ccc' }}
                        />
                        {item.colorName}
                        {oos && <span className="text-[9px] font-bold text-slate-400">OOS</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Bundle Banner ── */}
          {activeBundle && (
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              🎁{' '}
              <strong>
                Buy {activeBundle.minItems}+ items from this collection — get{' '}
                {activeBundle.discountType === 'PERCENT'
                  ? `${activeBundle.discountValue}% off`
                  : `₹${activeBundle.discountValue} off`}{' '}
                automatically at checkout
              </strong>
              {activeBundle.name ? ` · ${activeBundle.name}` : ''}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              disabled={isOutOfStock || !variant}
              onClick={() => {
                if (!variant || isOutOfStock) return
                addLine({
                  productId: product.id,
                  variantId: variant.id,
                  categoryId: product.category.id,
                  name: product.name,
                  slug: product.slug,
                  image: displayImages[0] ?? product.images[0],
                  size: variant.size,
                  color: variant.colorName,
                  unitPrice: displayPrice,
                  quantity: 1,
                })
              }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to cart'}
            </Button>
            <Button variant="outline" disabled={isOutOfStock}>
              {isOutOfStock ? 'Sold Out' : 'Buy now'}
            </Button>
          </div>

          {/* ── Notify Me When Available ── */}
          {isOutOfStock && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              {notifySuccess ? (
                <p className="text-sm font-medium text-emerald-700">
                  ✅ We&apos;ll notify you when it&apos;s back in stock!
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-800">Notify Me When Available</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Enter your email and we&apos;ll send you an alert when this item is restocked.
                  </p>
                  <div className="mt-3 space-y-2">
                    <input
                      type="email"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white"
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                    />
                    {product.variants.length > 0 && (
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white"
                        value={notifySize}
                        onChange={(e) => setNotifySize(e.target.value)}
                      >
                        <option value="">Any size (optional)</option>
                        {Array.from(new Set(product.variants.map((v) => v.size))).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    <Button
                      className="w-full"
                      disabled={notifySubmitting}
                      onClick={() => void handleNotifyMe()}
                    >
                      {notifySubmitting ? 'Subscribing…' : 'Notify Me'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Share buttons ── */}
          <div className="flex items-center gap-2 pt-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Share2 className="h-3.5 w-3.5" /> Share
            </span>
            <button
              type="button"
              onClick={() => void handleShare('whatsapp')}
              className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => void handleShare('copy')}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              {linkCopied ? (
                <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copied!</>
              ) : (
                <><Link2 className="h-3.5 w-3.5" /> Copy link</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Lightbox modal ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
              <Image src={displayImages[lightboxIndex]} alt={product.name} fill className="object-contain" />
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((i) => (i - 1 + displayImages.length) % displayImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setLightboxIndex((i) => (i + 1) % displayImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="mt-3 flex justify-center gap-1.5">
              {displayImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === lightboxIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Size Guide modal ── */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSizeGuideOpen(false)}>
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSizeGuideOpen(false)} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-xl font-bold">Size Guide</h2>
            <p className="mt-1 text-sm text-slate-500">All measurements in cm. For the best fit, compare your body measurements.</p>

            {!sizeChart ? (
              <p className="mt-6 text-sm text-slate-400">Loading size chart…</p>
            ) : sizeChart.rows.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">No size chart available for this product.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Size</th>
                      {sizeChart.attributes.map((attr) => (
                        <th key={attr.slug} className="px-4 py-3 text-left font-semibold text-slate-700">
                          {attr.label}{attr.unit ? ` (${attr.unit})` : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.rows.map((row, i) => (
                      <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.size}</td>
                        {sizeChart.attributes.map((attr) => (
                          <td key={attr.slug} className="px-4 py-3 text-slate-600">
                            {row.values[attr.slug] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-800">
              <strong>How to measure:</strong> Use a soft measuring tape. Keep it snug but not tight. Chest = fullest part of chest. Waist = narrowest point of torso.
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Verified purchase</span>
                  </div>
                  <div className="mt-2"><StarRow rating={review.rating} /></div>
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
            <p className="mt-1 text-sm text-slate-500">Purchase this product and share your experience after delivery.</p>
          </div>
        )}
      </section>

      {/* ── Review reminder for orders in transit ── */}
      {user && hasPendingOrder && deliveredItems.length === 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl">📦</span>
            <div>
              <p className="font-semibold text-amber-900">Your order is on its way!</p>
              <p className="mt-1 text-sm text-amber-700">
                Once your order is delivered, you can share your review and help others decide.
                We&apos;ll remind you by email when it arrives.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Write a review (only if user has delivered order with this product) ── */}
      {user && deliveredItems.length > 0 && !reviewSubmitted && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-bold">Write a Review</h2>
          <p className="mt-1 text-sm text-slate-500">Share your experience with this product.</p>
          <div className="mt-4 space-y-4">
            {deliveredItems.length > 1 && (
              <div>
                <label className="text-sm font-medium text-slate-700">Select order item</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  value={reviewOrderItemId}
                  onChange={(e) => setReviewOrderItemId(e.target.value)}
                >
                  {deliveredItems.map((item) => (
                    <option key={item.id} value={item.id}>Order #{item.orderId.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-700">Rating</p>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-slate-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Comment (optional)</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                placeholder="Tell others about your experience…"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>
            <Button
              disabled={reviewSubmitting || !reviewOrderItemId}
              onClick={() => void handleReviewSubmit()}
              className="w-full sm:w-auto"
            >
              {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
            </Button>
          </div>
        </section>
      )}

      {reviewSubmitted && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-medium text-emerald-800">Thank you! Your review has been submitted and will appear after moderation.</p>
        </section>
      )}

      {/* ── Related products ── */}
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
