'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Zap, Clock, ShoppingBag, ArrowRight, Tag, ShoppingCart, X, ChevronRight, Gift, Sparkles } from 'lucide-react'
import { apiClient } from '@/services/api/client'
import { useCartStore } from '@/store/cart-store'
import { useUiStore } from '@/store/ui-store'
import { useGstStore } from '@/store/gst-store'
import { getActiveBundles, type ActiveBundle } from '@/services/bundle.service'
import toast from 'react-hot-toast'

type SaleProduct = {
  id: string
  name: string
  slug: string
  mrp: number
  salePrice: number
  discountPercent: number
  category: { id: string; slug: string; name: string } | null
  subcategory: { id: string; slug: string; name: string } | null
  image: string | null
  gstRate: number
}

type SaleGroup = {
  sale: {
    id: string
    title: string
    discountPercent: number
    endsAt: string
  }
  items: SaleProduct[]
  total: number
  hasMore: boolean
}

// Color themes for each sale (cycles if more than 4)
const SALE_THEMES = [
  { accent: 'amber', badge: 'bg-amber-400 text-black', border: 'border-amber-400/30', banner: 'from-amber-50 to-orange-50 border-amber-200 dark:from-amber-500/10 dark:to-orange-500/5 dark:border-amber-500/20', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-400', countdown: 'text-amber-600 dark:text-amber-400', discount: 'text-amber-600 dark:text-amber-400', hover: 'hover:border-amber-400/50' },
  { accent: 'rose', badge: 'bg-rose-500 text-white', border: 'border-rose-400/30', banner: 'from-rose-50 to-pink-50 border-rose-200 dark:from-rose-500/10 dark:to-pink-500/5 dark:border-rose-500/20', pill: 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-400', countdown: 'text-rose-600 dark:text-rose-400', discount: 'text-rose-600 dark:text-rose-400', hover: 'hover:border-rose-400/50' },
  { accent: 'violet', badge: 'bg-violet-500 text-white', border: 'border-violet-400/30', banner: 'from-violet-50 to-purple-50 border-violet-200 dark:from-violet-500/10 dark:to-purple-500/5 dark:border-violet-500/20', pill: 'bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-400', countdown: 'text-violet-600 dark:text-violet-400', discount: 'text-violet-600 dark:text-violet-400', hover: 'hover:border-violet-400/50' },
  { accent: 'emerald', badge: 'bg-emerald-500 text-white', border: 'border-emerald-400/30', banner: 'from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-500/10 dark:to-teal-500/5 dark:border-emerald-500/20', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-400', countdown: 'text-emerald-600 dark:text-emerald-400', discount: 'text-emerald-600 dark:text-emerald-400', hover: 'hover:border-emerald-400/50' },
]

const getRemaining = (endsAt: string) => {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 }
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  }
}
const pad = (n: number) => String(n).padStart(2, '0')

const Countdown = ({ endsAt, className }: { endsAt: string; className: string }) => {
  const calc = useCallback(() => getRemaining(endsAt), [endsAt])
  const [time, setTime] = useState(calc)
  useEffect(() => { const t = setInterval(() => setTime(calc()), 1000); return () => clearInterval(t) }, [calc])

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Clock size={13} className="shrink-0" />
      <span className="font-mono text-sm font-semibold">
        Ends in{' '}
        {time.d > 0 ? `${time.d}d ${pad(time.h)}h ${pad(time.m)}m ${pad(time.s)}s` : `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`}
      </span>
    </div>
  )
}

type Variant = { id: string; size: string; colorName: string; stock: number }
type ProductDetail = { id: string; name: string; slug: string; price: number; category: { id: string }; images: string[]; variants: Variant[] }

const QuickAddModal = ({ product, onClose }: { product: SaleProduct; onClose: () => void }) => {
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
      productId: detail.id, variantId: variant.id, categoryId: detail.category.id,
      name: detail.name, slug: detail.slug, image: detail.images[0] ?? null,
      size: variant.size, color: variant.colorName, unitPrice: product.salePrice, quantity: 1,
    })
    toast.success('Added to cart!')
    setCartOpen(true)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            {product.image && <Image src={product.image} alt={product.name} width={56} height={56} className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 dark:text-white">₹{product.salePrice.toLocaleString('en-IN')}</span>
              {product.mrp !== product.salePrice && <span className="text-sm text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>}
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
              {sizes.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const allOos = detail.variants.filter((v) => v.size === size).every((v) => v.stock === 0)
                      return (
                        <button key={size} onClick={() => { setSelectedSize(size); const first = detail.variants.find((v) => v.size === size && v.stock > 0) ?? detail.variants.find((v) => v.size === size); if (first) setSelectedColor(first.colorName) }} disabled={allOos}
                          className={`min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedSize === size ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : allOos ? 'border-slate-200 text-slate-300 line-through dark:border-slate-700 dark:text-slate-600' : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200'}`}>
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {colorsForSize.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Color — {selectedColor}</p>
                  <div className="flex flex-wrap gap-2">
                    {colorsForSize.map((v) => (
                      <button key={v.colorName} onClick={() => setSelectedColor(v.colorName)} disabled={v.stock === 0}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${selectedColor === v.colorName ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : v.stock === 0 ? 'border-slate-200 text-slate-300 line-through dark:border-slate-700 dark:text-slate-600' : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200'}`}>
                        {v.colorName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {variant && !inStock && <p className="text-sm font-medium text-rose-500">Out of stock in this size/color</p>}
            </>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={!inStock || !variant || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              <ShoppingCart size={16} />
              {!variant ? 'Select options' : !inStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link href={`/products/${product.slug}`}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              View <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const SaleProductCard = ({ product, theme }: { product: SaleProduct; theme: typeof SALE_THEMES[0] }) => {
  const gstRate = useGstStore((s) => s.rate)
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <div className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 ${theme.hover}`}>
        {/* Discount badge */}
        <div className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${theme.badge}`}>
          <Zap size={10} />
          {product.discountPercent}% off
        </div>

        {/* Image */}
        <Link href={`/products/${product.slug}`} className="relative block aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-700"><ShoppingBag size={40} /></div>
          )}
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col p-3">
          {product.category && <span className="text-[10px] uppercase tracking-widest text-slate-400">{product.category.name}</span>}
          <div className="flex-1 mt-1">
            <Link href={`/products/${product.slug}`}>
              <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 hover:text-slate-600 dark:text-slate-200">{product.name}</p>
            </Link>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">₹{product.salePrice.toLocaleString('en-IN')}</span>
            {product.mrp !== product.salePrice && <span className="text-xs text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>}
          </div>
          <button onClick={() => setShowModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            <ShoppingCart size={13} /> Add to Cart
          </button>
        </div>
      </div>
      {showModal && <QuickAddModal product={product} onClose={() => setShowModal(false)} />}
    </>
  )
}

const SaleBanner = ({ group, theme, index }: { group: SaleGroup; theme: typeof SALE_THEMES[0]; index: number }) => (
  <div className={`overflow-hidden rounded-2xl border bg-gradient-to-r p-5 sm:p-6 ${theme.banner}`}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${theme.pill}`}>
          <Zap size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.pill}`}>
              Flash Sale {index > 0 ? `#${index + 1}` : ''}
            </span>
          </div>
          <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
            {group.sale.title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {group.total} product{group.total !== 1 ? 's' : ''} on sale
            {group.hasMore ? ' · scroll to see all' : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-4xl font-black sm:text-5xl ${theme.discount}`}>
          {group.sale.discountPercent}% OFF
        </span>
        <Countdown endsAt={group.sale.endsAt} className={theme.countdown} />
      </div>
    </div>
  </div>
)

const DEAL_THEMES = [
  { bg: 'from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20', border: 'border-violet-200 dark:border-violet-800/40', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300', discount: 'text-violet-700 dark:text-violet-300', btn: 'bg-violet-700 hover:bg-violet-800 dark:bg-violet-500 dark:hover:bg-violet-400' },
  { bg: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20', border: 'border-rose-200 dark:border-rose-800/40', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300', discount: 'text-rose-700 dark:text-rose-300', btn: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400' },
  { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20', border: 'border-emerald-200 dark:border-emerald-800/40', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300', discount: 'text-emerald-700 dark:text-emerald-300', btn: 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-400' },
  { bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20', border: 'border-amber-200 dark:border-amber-800/40', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300', discount: 'text-amber-700 dark:text-amber-300', btn: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400' },
]

const getDealLabel = (bundle: ActiveBundle) => {
  if (bundle.discountType === 'PERCENT') {
    if (bundle.discountValue >= 33 && bundle.minItems === 2) return `Buy ${bundle.minItems}, Get 1 Free`
    return `Buy Any ${bundle.minItems} — ${bundle.discountValue}% Off`
  }
  return `Pick Any ${bundle.minItems} for ₹${bundle.discountValue.toLocaleString('en-IN')} Off`
}

const getDealSubLabel = (bundle: ActiveBundle) => {
  if (bundle.discountType === 'PERCENT') return `Add ${bundle.minItems}+ items from this deal to your cart`
  return `Save ₹${bundle.discountValue.toLocaleString('en-IN')} when you add ${bundle.minItems}+ items`
}

const DealCard = ({ bundle, theme }: { bundle: ActiveBundle; theme: typeof DEAL_THEMES[0] }) => {
  const previewProducts = bundle.products.slice(0, 5)
  const remaining = bundle.products.length - previewProducts.length

  return (
    <div className={`overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${theme.bg} ${theme.border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${theme.badge}`}>
            <Gift size={18} />
          </div>
          <div>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
              Bundle Deal
            </span>
            <h3 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{bundle.name}</h3>
          </div>
        </div>
        <div className={`text-right text-2xl font-black sm:text-3xl ${theme.discount}`}>
          {getDealLabel(bundle)}
        </div>
      </div>

      {bundle.description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{bundle.description}</p>
      )}
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getDealSubLabel(bundle)}</p>

      {/* Product thumbnails */}
      {previewProducts.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          {previewProducts.map((p) => (
            <Link
              key={p.productId}
              href={p.slug ? `/products/${p.slug}` : '/products'}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              {p.image ? (
                <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-200 group-hover:scale-105" sizes="64px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                  <ShoppingBag size={20} />
                </div>
              )}
            </Link>
          ))}
          {remaining > 0 && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-400">
              +{remaining}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/products?bundleId=${bundle.id}`}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${theme.btn}`}
        >
          Shop This Deal <ArrowRight size={14} />
        </Link>
        <span className="text-xs text-slate-400">{bundle.products.length} product{bundle.products.length !== 1 ? 's' : ''} included</span>
      </div>
    </div>
  )
}

const DealsSection = ({ bundles }: { bundles: ActiveBundle[] }) => {
  if (!bundles.length) return null
  return (
    <section>
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={20} className="text-violet-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bundle Deals</h2>
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-400/20 dark:text-violet-300">
          {bundles.length} active
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {bundles.map((b, i) => (
          <DealCard key={b.id} bundle={b} theme={DEAL_THEMES[i % DEAL_THEMES.length]} />
        ))}
      </div>
    </section>
  )
}

export const SalePageModule = () => {
  const [groups, setGroups] = useState<SaleGroup[] | null>(null)
  const [bundles, setBundles] = useState<ActiveBundle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.get<SaleGroup[]>('/flash-sales/all-with-products').then((r) => r.data).catch(() => []),
      getActiveBundles(),
    ]).then(([g, b]) => {
      setGroups(g)
      setBundles(b)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-10 px-4 py-10 sm:px-8">
        {/* Banner skeleton */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-slate-600" />
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-600" />
                <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-600" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-12 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-600" />
              <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>
          </div>
        </div>

        {/* Product card skeletons */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="aspect-[3/4] animate-pulse bg-slate-100 dark:bg-slate-800" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-3 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-5 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasAnything = (groups && groups.length > 0) || bundles.length > 0

  if (!hasAnything) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Tag size={28} className="text-slate-400" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No Active Sales Right Now</h1>
        <p className="max-w-xs text-sm text-slate-500">Check back soon for flash deals and limited-time offers.</p>
        <Link
          href="/products"
          className="mt-2 flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"
        >
          Browse All Products <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-12 px-4 py-10 sm:px-8">
      {/* Bundle Deals section */}
      <DealsSection bundles={bundles} />

      {/* Flash Sale sections */}
      {(groups ?? []).map((group, index) => {
        const theme = SALE_THEMES[index % SALE_THEMES.length]
        return (
          <section key={group.sale.id}>
            <SaleBanner group={group} theme={theme} index={index} />

            {group.items.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-500">No products in this sale yet.</p>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((p) => (
                    <SaleProductCard key={p.id} product={p} theme={theme} />
                  ))}
                </div>
                {group.hasMore && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/sale/${group.sale.id}`}
                      className={`inline-flex items-center gap-2 rounded-full border px-6 py-2 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800 ${theme.border} text-slate-700 dark:text-slate-300`}
                    >
                      View all {group.total} products <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
