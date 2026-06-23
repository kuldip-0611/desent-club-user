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
  onClose,
  onAdd,
}: {
  product: Product
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
              <p className="mt-0.5 text-sm font-bold text-slate-700">₹{product.price}</p>
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
      unitPrice: product.price,
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
        <Link href={`/products/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {isOutOfStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Out of stock
            </span>
          ) : isLowStock ? (
            <span className="absolute left-2 top-2 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Only {totalStock} left
            </span>
          ) : null}
        </Link>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-1">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200"
            >
              {product.category.name}
            </Link>
            {product.subcategory ? (
              <Link
                href={`/products?category=${product.category.slug}&subcategory=${product.subcategory.slug}`}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-200"
              >
                {product.subcategory.name}
              </Link>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{product.name}</h3>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Toggle wishlist"
            >
              <Heart className={`h-4 w-4 ${has ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
          <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">₹{product.price}</span>
            {product.compareAtPrice ? <span className="text-xs text-slate-400 line-through">₹{product.compareAtPrice}</span> : null}
            {product.isNewArrival ? <Badge>New</Badge> : null}
            {inCartQty > 0 ? <Badge className="bg-emerald-100 text-emerald-700">In cart: {inCartQty}</Badge> : null}
          </div>
          <div className="space-y-2 pt-1">
            <button
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && setShowQuickPick(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-black text-white hover:bg-slate-800 active:scale-95'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock ? 'Sold out' : 'Add to cart'}
            </button>

            <div className="flex gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View details
              </Link>
              <button
                onClick={toggleCompare}
                className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                  inCompare
                    ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50'
                }`}
                aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
                title={inCompare ? 'Remove from compare' : 'Add to compare'}
              >
                <GitCompareArrows className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showQuickPick && (
          <QuickPickModal
            product={product}
            onClose={() => setShowQuickPick(false)}
            onAdd={handleAdd}
          />
        )}
      </AnimatePresence>
    </>
  )
}
