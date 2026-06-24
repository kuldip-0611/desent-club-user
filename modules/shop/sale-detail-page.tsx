'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Zap, Clock, ShoppingBag, ArrowLeft, ShoppingCart, X, ChevronRight } from 'lucide-react'
import { apiClient } from '@/services/api/client'
import { useCartStore } from '@/store/cart-store'
import { useUiStore } from '@/store/ui-store'
import { useGstStore } from '@/store/gst-store'
import toast from 'react-hot-toast'

type SaleProduct = {
  id: string
  name: string
  slug: string
  mrp: number
  salePrice: number
  discountPercent: number
  category: { id: string; slug: string; name: string } | null
  image: string | null
  gstRate: number
}

type SaleDetailData = {
  sale: { id: string; title: string; discountPercent: number; endsAt: string; isActive: boolean }
  items: SaleProduct[]
  total: number
  page: number
  hasNextPage: boolean
}

type Variant = { id: string; size: string; colorName: string; stock: number }
type ProductDetail = { id: string; name: string; slug: string; price: number; category: { id: string }; images: string[]; variants: Variant[] }

const pad = (n: number) => String(n).padStart(2, '0')

const Countdown = ({ endsAt }: { endsAt: string }) => {
  const get = useCallback(() => {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 }
    return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) }
  }, [endsAt])
  const [t, setT] = useState(get)
  useEffect(() => { const id = setInterval(() => setT(get()), 1000); return () => clearInterval(id) }, [get])
  return (
    <span className="font-mono font-bold">
      {t.d > 0 ? `${t.d}d ${pad(t.h)}h ${pad(t.m)}m ${pad(t.s)}s` : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}
    </span>
  )
}

// Quick-add modal — fetches variants for the selected product
const QuickAddModal = ({ product, salePrice, onClose }: { product: SaleProduct; salePrice: number; onClose: () => void }) => {
  const addLine = useCartStore((s) => s.addLine)
  const setCartOpen = useUiStore((s) => s.setCartDrawer)
  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<ProductDetail>(`/shop/products/${product.slug}`).then((r) => {
      setDetail(r.data)
      const first = r.data.variants.find((v) => v.stock > 0) ?? r.data.variants[0]
      if (first) { setSelectedSize(first.size); setSelectedColor(first.colorName) }
    }).catch(() => setDetail(null)).finally(() => setLoading(false))
  }, [product.slug])

  const sizes = detail ? [...new Map(detail.variants.map((v) => [v.size, v])).keys()] : []
  const colorsForSize = detail && selectedSize
    ? [...new Map(detail.variants.filter((v) => v.size === selectedSize).map((v) => [v.colorName, v])).values()]
    : []
  const variant = detail?.variants.find((v) => v.size === selectedSize && v.colorName === selectedColor) ?? null
  const inStock = variant ? variant.stock > 0 : false

  const handleAdd = () => {
    if (!detail || !variant || !inStock) return
    addLine({
      productId: detail.id,
      variantId: variant.id,
      categoryId: detail.category.id,
      name: detail.name,
      slug: detail.slug,
      image: detail.images[0] ?? null,
      size: variant.size,
      color: variant.colorName,
      unitPrice: salePrice,
      quantity: 1,
    })
    toast.success('Added to cart!')
    setCartOpen(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {product.image && <Image src={product.image} alt={product.name} width={56} height={56} className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 dark:text-white">₹{salePrice.toLocaleString('en-IN')}</span>
              {product.mrp !== salePrice && <span className="text-sm text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>}
              <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-black">{product.discountPercent}% off</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 w-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>
            </div>
          ) : !detail ? (
            <p className="text-center text-sm text-slate-500">Could not load product details.</p>
          ) : (
            <>
              {/* Size */}
              {sizes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const allOos = detail.variants.filter((v) => v.size === size).every((v) => v.stock === 0)
                      return (
                        <button
                          key={size}
                          onClick={() => { setSelectedSize(size); const first = detail.variants.find((v) => v.size === size && v.stock > 0) ?? detail.variants.find((v) => v.size === size); if (first) setSelectedColor(first.colorName) }}
                          disabled={allOos}
                          className={`min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedSize === size ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : allOos ? 'border-slate-200 text-slate-300 line-through dark:border-slate-700 dark:text-slate-600' : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200'}`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Color */}
              {colorsForSize.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Color — {selectedColor}</p>
                  <div className="flex flex-wrap gap-2">
                    {colorsForSize.map((v) => (
                      <button
                        key={v.colorName}
                        onClick={() => setSelectedColor(v.colorName)}
                        disabled={v.stock === 0}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedColor === v.colorName ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : v.stock === 0 ? 'border-slate-200 text-slate-300 line-through dark:border-slate-700 dark:text-slate-600' : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200'}`}
                      >
                        {v.colorName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {variant && !inStock && (
                <p className="text-sm font-medium text-rose-500">Out of stock in this size/color</p>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!inStock || !variant || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <ShoppingCart size={16} />
              {!variant ? 'Select options' : !inStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, salePrice, saleId }: { product: SaleProduct; salePrice: number; saleId: string }) => {
  const gstRate = useGstStore((s) => s.rate)
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* Badge */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-black shadow">
          <Zap size={10} fill="currentColor" />{product.discountPercent}% off
        </div>

        {/* Image */}
        <Link href={`/products/${product.slug}?from=sale&saleId=${saleId}`} className="relative block aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-700"><ShoppingBag size={48} /></div>
          )}
          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 py-3 text-center text-xs font-semibold text-white transition-transform duration-200 group-hover:translate-y-0">
            Quick Add
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3">
          {product.category && <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{product.category.name}</span>}
          <div className="flex-1">
            <Link href={`/products/${product.slug}?from=sale&saleId=${saleId}`}>
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 hover:text-slate-600 dark:text-slate-100">{product.name}</p>
            </Link>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white">₹{salePrice.toLocaleString('en-IN')}</span>
            {product.mrp !== salePrice && <span className="text-xs text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>}
          </div>

          {/* Add to cart button */}
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <ShoppingCart size={13} /> Add to Cart
          </button>
        </div>
      </div>

      {showModal && <QuickAddModal product={product} salePrice={salePrice} onClose={() => setShowModal(false)} />}
    </>
  )
}

export const SaleDetailPageModule = ({ saleId }: { saleId: string }) => {
  const [data, setData] = useState<SaleDetailData | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)
  const hasNextRef = useRef(false)
  const pageRef = useRef(1)

  const fetchPage = useCallback(async (p: number) => {
    const res = await apiClient.get<SaleDetailData | null>(`/flash-sales/${saleId}/products?page=${p}&limit=24`)
    return res.data
  }, [saleId])

  useEffect(() => {
    fetchPage(1)
      .then((d) => {
        if (!d) { setNotFound(true); return }
        setData(d)
        hasNextRef.current = d.hasNextPage
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [fetchPage])

  // Sync hasNextPage into ref so the observer closure stays fresh
  useEffect(() => { hasNextRef.current = data?.hasNextPage ?? false }, [data?.hasNextPage])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (loadingMoreRef.current || !hasNextRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
        const next = pageRef.current + 1
        fetchPage(next)
          .then((d) => {
            if (!d) return
            setData((prev) => prev ? { ...d, items: [...prev.items, ...d.items] } : d)
            pageRef.current = next
            setPage(next)
            hasNextRef.current = d.hasNextPage
          })
          .catch(() => undefined)
          .finally(() => { loadingMoreRef.current = false; setLoadingMore(false) })
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, loading])

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Back link skeleton */}
      <div className="mb-5 h-4 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />

      {/* Hero banner skeleton */}
      <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-800 dark:to-slate-700 p-7 sm:p-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="h-5 w-20 animate-pulse rounded-full bg-amber-200 dark:bg-slate-600" />
            <div className="h-10 w-64 animate-pulse rounded-xl bg-amber-200 dark:bg-slate-600 sm:w-80" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-amber-200 dark:bg-slate-600" />
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="h-28 w-32 animate-pulse rounded-2xl bg-amber-200 dark:bg-slate-600" />
            <div className="h-8 w-48 animate-pulse rounded-full bg-amber-200 dark:bg-slate-600" />
          </div>
        </div>
      </div>

      {/* Count line */}
      <div className="mb-4 h-4 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />

      {/* Product card skeletons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="aspect-[3/4] animate-pulse bg-slate-100 dark:bg-slate-800" />
            <div className="flex flex-col gap-2 p-3">
              <div className="h-3 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="mt-2 h-5 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (notFound || !data?.sale) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Zap size={28} className="text-slate-400" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Sale not found</h1>
      <p className="text-sm text-slate-500">This sale may have ended or doesn&apos;t exist.</p>
      <Link href="/sale" className="mt-2 flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
        <ArrowLeft size={14} /> View all sales
      </Link>
    </div>
  )

  const { sale, items, total } = data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link href="/sale" className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
        <ArrowLeft size={14} /> All Sales
      </Link>

      {/* Hero banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-200 via-orange-200 to-amber-300 p-7 shadow-xl sm:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-15">
          {Array.from({ length: 5 }).map((_, i) => (
            <Zap key={i} size={100} className="absolute text-amber-400" style={{ top: `${(i * 37) % 80}%`, left: `${(i * 53) % 90}%`, transform: 'rotate(15deg)' }} />
          ))}
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-800">
              <Zap size={11} fill="currentColor" /> Flash Sale
            </span>
            <h1 className="text-3xl font-black text-amber-900 sm:text-5xl">{sale.title}</h1>
            <p className="mt-1.5 text-amber-700">{total} product{total !== 1 ? 's' : ''} on sale</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-2xl bg-white/40 px-6 py-4 text-center backdrop-blur-sm">
              <p className="text-6xl font-black text-amber-900 sm:text-7xl">{sale.discountPercent}%</p>
              <p className="text-lg font-bold text-amber-700">OFF</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-semibold text-amber-800 backdrop-blur-sm">
              <Clock size={14} /> Ends in <Countdown endsAt={sale.endsAt} />
            </div>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-24 text-center text-slate-500">No products in this sale yet.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-500">{total} product{total !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} salePrice={p.salePrice} saleId={saleId} />
            ))}
          </div>
          <div ref={sentinelRef} className="mt-10 flex h-12 items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Loading more…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
