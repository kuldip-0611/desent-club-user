'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, GitCompareArrows, X, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useFlashSaleStore } from '@/store/flash-sale-store'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'
import { getCompareIds, setCompareIds, useCompareIds, MAX_COMPARE } from '@/hooks/use-compare'
import type { Product, ProductVariant } from '@/types/product'

type ProductCardProps = {
  product: Product
  wishlistMode?: boolean
  showQuickView?: boolean
}

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
  const [added, setAdded] = useState(false)

  const matchedVariant =
    product.variants.find(
      (v) =>
        (sizes.length === 0 || v.size === selectedSize) &&
        (colors.length === 0 || v.colorName === selectedColor),
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
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700">
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            </div>
            <div>
              <p className="font-semibold leading-tight text-slate-900 dark:text-slate-100">{product.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  &#8377;{salePrice ?? product.price}
                </p>
                {salePrice && (
                  <p className="text-xs text-slate-400 line-through">&#8377;{product.price}</p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sizes.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Size{' '}
              <span className="normal-case font-medium tracking-normal text-slate-700 dark:text-slate-300">
                — {selectedSize ?? 'Select'}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const available = product.variants.some(
                  (v) =>
                    v.size === size &&
                    (colors.length === 0 || v.colorName === selectedColor) &&
                    (v.stock ?? 0) > 0,
                )
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={!available}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      selectedSize === size
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : available
                          ? 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-100 text-slate-300 line-through dark:border-slate-800 dark:text-slate-600'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Color{' '}
              <span className="normal-case font-medium tracking-normal text-slate-700 dark:text-slate-300">
                — {selectedColor ?? 'Select'}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => {
                const available = product.variants.some(
                  (v) =>
                    v.colorName === color &&
                    (sizes.length === 0 || v.size === selectedSize) &&
                    (v.stock ?? 0) > 0,
                )
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    disabled={!available}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition ${
                      selectedColor === color
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : available
                          ? 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400'
                          : 'cursor-not-allowed border-slate-100 text-slate-300 line-through dark:border-slate-800 dark:text-slate-600'
                    }`}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <motion.button
          disabled={!matchedVariant || isOutOfStock || added}
          onClick={() => {
            if (!matchedVariant || added) return
            setAdded(true)
            setTimeout(() => { onAdd(matchedVariant); setAdded(false) }, 700)
          }}
          animate={added ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.3 }}
          className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
            !matchedVariant || isOutOfStock
              ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
              : added
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Added to cart!
              </motion.span>
            ) : (
              <motion.span
                key="bag"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {isOutOfStock ? 'Out of stock' : 'Add to cart'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <Link
          href={`/products/${product.slug}`}
          onClick={onClose}
          className="mt-2.5 block text-center text-xs font-medium text-slate-700 hover:underline dark:text-slate-300"
        >
          View full details →
        </Link>
      </motion.div>
    </div>
  )
}

export const ProductCard = ({ product, wishlistMode = false, showQuickView = false }: ProductCardProps) => {
  const router = useRouter()
  const addLine = useCartStore((s) => s.addLine)
  const lines = useCartStore((s) => s.lines)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const removeWishlist = useWishlistStore((s) => s.remove)
  const has = useWishlistStore((s) => s.has(product.id))
  const user = useAuthStore((s) => s.user)
  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const openModal = useUiStore((s) => s.openModal)
  const saleInfo = useFlashSaleStore((s) => s.saleMap[product.id] ?? null)
  const salePrice = saleInfo
    ? Math.round(product.price * (1 - saleInfo.discountPercent / 100))
    : null
  const [showQuickPick, setShowQuickPick] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const images = product.images?.length ? product.images : [product.images[0] ?? '']
  const hasMultiple = images.length > 1
  const touchStartX = useRef<number | null>(null)

  const prevImg = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setImgIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const nextImg = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setImgIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      setImgIndex((i) => diff > 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length)
    }
    touchStartX.current = null
  }

  const inCartQty = lines
    .filter((l) => l.productId === product.id)
    .reduce((s, l) => s + l.quantity, 0)

  const totalStock = product.variants.reduce((s, v) => s + (v.stock ?? 0), 0)
  const isOutOfStock = totalStock === 0
  const isLowStock = !isOutOfStock && totalStock <= 5

  const compareIds = useCompareIds()
  const inCompare = compareIds.includes(product.id)

  const handleWishlistToggle = () => {
    if (!user) {
      toast('Please sign in to save items to your wishlist')
      openAuthModal()
      return
    }
    toggleWishlist(product.id)
  }

  const handleRemoveFromWishlist = () => {
    removeWishlist(product.id)
    toast.success('Removed from wishlist')
    setShowRemoveConfirm(false)
  }

  const toggleCompare = () => {
    const ids = getCompareIds()
    if (ids.includes(product.id)) {
      setCompareIds(ids.filter((i) => i !== product.id))
      toast.success('Removed from compare')
    } else {
      if (ids.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} products`)
        return
      }
      const next = [...ids, product.id]
      setCompareIds(next)
      if (next.length >= 2) {
        toast((t) => (
          <span>
            ⚖️ Ready to compare!{' '}
            <button
              className="font-semibold underline"
              onClick={() => {
                toast.dismiss(t.id)
                router.push(`/compare?ids=${next.join(',')}`)
              }}
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
    if (wishlistMode) removeWishlist(product.id)
  }

  return (
    <>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Top-right corner action button */}
        {wishlistMode ? (
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800/90 dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400"
            aria-label="Remove from wishlist"
            title="Remove from wishlist"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : showQuickView ? (
          <button
            type="button"
            onClick={() => openModal('quickView', {
              productId: product.id,
              ...(saleInfo ? { discountPercent: String(saleInfo.discountPercent) } : {}),
            })}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75"
            aria-label="Quick view"
          >
            <Eye className="h-4 w-4" strokeWidth={2.25} />
          </button>
        ) : null}

        {/* Product image slider */}
        <div
          className="relative block aspect-[4/5] shrink-0 overflow-hidden"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onTouchStart={hasMultiple ? onTouchStart : undefined}
          onTouchEnd={hasMultiple ? onTouchEnd : undefined}
        >
          <Link
            href={saleInfo ? `/products/${product.slug}?from=sale&saleId=${saleInfo.saleId}` : `/products/${product.slug}`}
            className="absolute inset-0"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={imgIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[imgIndex]}
                  alt={`${product.name} – image ${imgIndex + 1}`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className={`object-cover transition duration-500 ${hovered ? 'scale-105' : 'scale-100'}`}
                />
              </motion.div>
            </AnimatePresence>
          </Link>

          {/* Prev / Next buttons — desktop hover only */}
          {hasMultiple && (
            <>
              <AnimatePresence>
                {hovered && (
                  <>
                    <motion.button
                      key="prev"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={prevImg}
                      aria-label="Previous image"
                      className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow backdrop-blur-sm transition hover:bg-white active:scale-90 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      key="next"
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={nextImg}
                      aria-label="Next image"
                      className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow backdrop-blur-sm transition hover:bg-white active:scale-90 dark:bg-slate-800/90 dark:text-white dark:hover:bg-slate-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </>
                )}
              </AnimatePresence>

              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i) }}
                    aria-label={`Image ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-200 ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          {saleInfo && (
            <span className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black shadow">
              ⚡ {saleInfo.discountPercent}% off
            </span>
          )}
          {!saleInfo && isOutOfStock ? (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Out of stock
            </span>
          ) : !saleInfo && isLowStock ? (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Only {totalStock} left
            </span>
          ) : saleInfo && isOutOfStock ? (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              Out of stock
            </span>
          ) : null}
        </div>

        {/* Card body — flex-col fills height; buttons pin to bottom via mt-auto */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          {/* Category badges — single row, truncate if too long */}
          <div className="flex items-center gap-1 overflow-hidden">
            <Link
              href={`/products?category=${product.category.slug}`}
              className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 sm:px-2.5 sm:text-[10px]"
            >
              {product.category.name}
            </Link>
            {product.subcategory && (
              <Link
                href={`/products?category=${product.category.slug}&subcategory=${product.subcategory.slug}`}
                className="min-w-0 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 sm:px-2.5 sm:text-[10px]"
              >
                {product.subcategory.name}
              </Link>
            )}
          </div>

          {/* Name + optional wishlist toggle */}
          <div className="mt-2 flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 text-xs font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
              {product.name}
            </h3>
            {!wishlistMode && (
              <button
                onClick={handleWishlistToggle}
                className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 sm:p-1.5"
                aria-label="Toggle wishlist"
              >
                <Heart
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${has ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Description — fixed 2-line min-height so all cards share same content zone */}
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs">
            {product.description || ' '}
          </p>

          {/* Price */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              &#8377;{salePrice ?? product.price}
            </span>
            {salePrice ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                &#8377;{product.price}
              </span>
            ) : product.compareAtPrice ? (
              <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                &#8377;{product.compareAtPrice}
              </span>
            ) : null}
            {product.isNewArrival && <Badge className="hidden sm:inline-flex">New</Badge>}
            {inCartQty > 0 && (
              <Badge className="hidden bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:inline-flex">
                In cart: {inCartQty}
              </Badge>
            )}
          </div>

          {/* Buttons — mt-auto pins them to the card bottom regardless of content height */}
          <div className="mt-auto space-y-2 pt-3">
            <button
              disabled={isOutOfStock}
              onClick={() => !isOutOfStock && setShowQuickPick(true)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition sm:text-sm ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock ? 'Sold out' : 'Add to cart'}
            </button>

            <div className="flex gap-2">
              <Link
                href={
                  saleInfo
                    ? `/products/${product.slug}?from=sale&saleId=${saleInfo.saleId}`
                    : `/products/${product.slug}`
                }
                className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800 sm:text-xs"
              >
                View
              </Link>
              <button
                onClick={toggleCompare}
                className={`flex items-center justify-center rounded-xl border px-3 py-2 transition ${
                  inCompare
                    ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700 dark:border-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800'
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

      {/* Wishlist remove confirmation */}
      <AnimatePresence>
        {showRemoveConfirm && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowRemoveConfirm(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
                <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remove from wishlist?
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {product.name}
                </span>{' '}
                will be removed from your wishlist.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFromWishlist}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-95"
                >
                  Yes, remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick-pick modal */}
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
