'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, GitCompareArrows, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useFlashSaleStore } from '@/store/flash-sale-store'
import type { Product, ProductVariant } from '@/types/product'

function getCompareIds(): string[] {
  if (typeof window === 'undefined') return []
  return (sessionStorage.getItem('compare_ids') ?? '').split(',').filter(Boolean)
}

function setCompareIds(ids: string[]) {
  sessionStorage.setItem('compare_ids', ids.join(','))
  window.dispatchEvent(new Event('compare-updated'))
}

type ProductCardProps = {
  product: Product
}

// Quick-pick modal — choose size & color before adding to cart
function QuickPickModal({
  product,
  salePrice,
  onClose,
  onAdd,
}: {
  product: Product
  salePrice: number | null
  onClose: () => void
  onAdd: (variant: ProductVariant) => void
}) {
  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))]
  const colors = [...new Set(product.variants.map((v) => v.colorName).filter(Boolean))]

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)

  const matchedVariant = product.variants.find(
    (v) =>
      (sizes.length === 0 || v.size === selectedSize) &&
      (colors.length === 0 || (v.colorName) === selectedColor),
  ) ?? null

  const isOutOfStock = matchedVariant ? (matchedVariant.stock ?? 0) <= 0 : false

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100">
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">{product.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900">₹{salePrice ?? product.price}</p>
              {salePrice && <p className="text-xs text-slate-400 line-through">₹{product.price}</p>}
            </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Size picker */}
        {sizes.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Size <span className="normal-case font-medium text-slate-700 tracking-normal">— {selectedSize ?? 'Select'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const available = product.variants.some(
                  (v) => v.size === size && (colors.length === 0 || (v.colorName) === selectedColor) && (v.stock ?? 0) > 0
                )
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={!available}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      selectedSize === size
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : available
                          ? 'border-slate-200 text-slate-700 hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-100 text-slate-300 line-through'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Color picker */}
        {colors.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Color <span className="normal-case font-medium text-slate-700 tracking-normal">— {selectedColor ?? 'Select'}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const available = product.variants.some(
                  (v) => (v.colorName) === color && (sizes.length === 0 || v.size === selectedSize) && (v.stock ?? 0) > 0
                )
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={!available}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition ${
                      selectedColor === color
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : available
                          ? 'border-slate-200 text-slate-700 hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-100 text-slate-300 line-through'
                    }`}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Add to cart button */}
        <button
          disabled={!matchedVariant || isOutOfStock}
          onClick={() => matchedVariant && onAdd(matchedVariant)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
            !matchedVariant || isOutOfStock
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-black text-white hover:bg-slate-800 active:scale-95'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          {isOutOfStock ? 'Out of stock' : 'Add to cart'}
        </button>

        <Link
          href={`/products/${product.slug}`}
          onClick={onClose}
          className="mt-2.5 block text-center text-xs font-medium text-slate-700 hover:underline"
        >
          View full details →
        </Link>
      </motion.div>
    </div>
  )
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter()
  const addLine = useCartStore((s) => s.addLine)
  const lines = useCartStore((s) => s.lines)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const has = useWishlistStore((s) => s.has(product.id))
  const saleInfo = useFlashSaleStore((s) => s.saleMap[product.id] ?? null)
  const salePrice = saleInfo ? Math.round(product.price * (100 - saleInfo.discountPercent)) / 100 : null
  const [showQuickPick, setShowQuickPick] = useState(false)

  const inCartQty = lines
    .filter((line) => line.productId === product.id)
    .reduce((sum, line) => sum + line.quantity, 0)

  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
  const isOutOfStock = totalStock === 0
  const isLowStock = !isOutOfStock && totalStock <= 5

  const [inCompare, setInCompare] = useState(false)
  useEffect(() => {
    const sync = () => setInCompare(getCompareIds().includes(product.id))
    sync()
    window.addEventListener('compare-updated', sync)
    return () => window.removeEventListener('compare-updated', sync)
  }, [product.id])

  const toggleCompare = () => {
    const ids = getCompareIds()
    if (ids.includes(product.id)) {
      setCompareIds(ids.filter((i) => i !== product.id))
      toast.success('Removed from compare')
    } else {
      if (ids.length >= 3) {
        toast.error('You can compare up to 3 products')
        return
      }
      const next = [...ids, product.id]
      setCompareIds(next)
      if (next.length >= 2) {
        toast((t) => (
          <span>
            ⚖️ Ready to compare!{' '}
            <button
              className="underline font-semibold"
              onClick={() => { toast.dismiss(t.id); router.push(`/compare?ids=${next.join(',')}`) }}
            >
              View now
            </button>
          </span>
        ))
      } else {
        toast.success('Added to compare. Pick one more.')
      }
    }
  }

  const handleAdd = (variant: ProductVariant) => {
    addLine({
      productId: product.id,
      variantId: variant.id,
      categoryId: product.category.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      size: variant.size,
      color: variant.colorName,
      unitPrice: salePrice ?? product.price,
      quantity: 1,
    })
    toast.success(`${product.name} added to cart`)
    setShowQuickPick(false)
  }

  return (
    <>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <Link
          href={saleInfo ? `/products/${product.slug}?from=sale&saleId=${saleInfo.saleId}` : `/products/${product.slug}`}
          className="relative block aspect-[4/5] overflow-hidden"
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Sale badge — top-left */}
          {saleInfo && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black shadow">
              ⚡ {saleInfo.discountPercent}% off
            </span>
          )}
          {/* Stock badge — bottom-left when no sale badge occupying top */}
          {!saleInfo && isOutOfStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Out of stock
            </span>
          ) : !saleInfo && isLowStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Only {totalStock} left
            </span>
          ) : saleInfo && isOutOfStock ? (
            <span className="absolute right-2 top-2 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Out of stock
            </span>
          ) : null}
        </Link>
        <div className="space-y-1.5 p-2.5 sm:space-y-2 sm:p-4">
          <div className="flex flex-wrap gap-1">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200 sm:px-2.5 sm:text-[10px]"
            >
              {product.category.name}
            </Link>
            {product.subcategory ? (
              <Link
                href={`/products?category=${product.category.slug}&subcategory=${product.subcategory.slug}`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-200 sm:px-2.5 sm:text-[10px]"
              >
                {product.subcategory.name}
              </Link>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-2 text-xs font-semibold text-slate-900 sm:line-clamp-1 sm:text-sm">{product.name}</h3>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 sm:p-1.5"
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${has ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
          <p className="hidden text-xs text-slate-500 sm:line-clamp-2">{product.description}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 sm:text-sm">₹{salePrice ?? product.price}</span>
            {salePrice ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">₹{product.price}</span>
            ) : product.compareAtPrice ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">₹{product.compareAtPrice}</span>
            ) : null}
            {product.isNewArrival ? <Badge className="hidden sm:inline-flex">New</Badge> : null}
            {inCartQty > 0 ? <Badge className="hidden bg-emerald-100 text-emerald-700 sm:inline-flex">In cart: {inCartQty}</Badge> : null}
          </div>
          <div className="space-y-1.5 pt-0.5 sm:space-y-2 sm:pt-1">
            <button
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && setShowQuickPick(true)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition sm:gap-2 sm:py-2.5 sm:text-sm ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-black text-white hover:bg-slate-800 active:scale-95'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock ? 'Sold out' : 'Add to cart'}
            </button>

            <div className="flex gap-1.5 sm:gap-2">
              <Link
                href={saleInfo ? `/products/${product.slug}?from=sale&saleId=${saleInfo.saleId}` : `/products/${product.slug}`}
                className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:py-2 sm:text-xs"
              >
                View
              </Link>
              <button
                onClick={toggleCompare}
                className={`flex items-center justify-center rounded-xl border px-2.5 py-1.5 transition sm:px-3 sm:py-2 ${
                  inCompare
                    ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                }`}
                aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                title={inCompare ? 'Remove from compare' : 'Add to compare'}
              >
                <GitCompareArrows className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showQuickPick && (
          <QuickPickModal
            product={product}
            salePrice={salePrice}
            onClose={() => setShowQuickPick(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </>
  )
}
