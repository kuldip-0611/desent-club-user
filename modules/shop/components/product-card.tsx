'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, GitCompareArrows } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import type { Product } from '@/types/product'

function addToCompare(productId: string, router: ReturnType<typeof useRouter>) {
  const stored = sessionStorage.getItem('compare_ids') ?? ''
  const ids = stored.split(',').filter(Boolean)
  if (ids.includes(productId)) {
    router.push(`/compare?ids=${ids.join(',')}`)
    return
  }
  if (ids.length >= 3) {
    toast.error('You can compare up to 3 products')
    return
  }
  ids.push(productId)
  sessionStorage.setItem('compare_ids', ids.join(','))
  if (ids.length >= 2) {
    toast((t) => (
      <span>
        ⚖️ Ready to compare!{' '}
        <button
          className="underline font-semibold"
          onClick={() => { toast.dismiss(t.id); router.push(`/compare?ids=${ids.join(',')}`) }}
        >
          View now
        </button>
      </span>
    ))
  } else {
    toast.success('⚖️ Added to compare. Pick one more product.')
  }
}

type ProductCardProps = {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter()
  const addLine = useCartStore((s) => s.addLine)
  const lines = useCartStore((s) => s.lines)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const has = useWishlistStore((s) => s.has(product.id))
  const firstVariant = product.variants[0]
  const inCartQty = lines
    .filter((line) => line.productId === product.id)
    .reduce((sum, line) => sum + line.quantity, 0)

  // Stock status
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
  const isOutOfStock = totalStock === 0
  const isLowStock = !isOutOfStock && totalStock <= 5

  return (
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
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100"
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
          <span className="text-sm font-bold text-slate-900">Rs. {product.price}</span>
          {product.compareAtPrice ? <span className="text-xs text-slate-400 line-through">Rs. {product.compareAtPrice}</span> : null}
          {product.isNewArrival ? <Badge>New</Badge> : null}
          {inCartQty > 0 ? <Badge className="bg-emerald-100 text-emerald-700">In cart: {inCartQty}</Badge> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={isOutOfStock}
            onClick={() => {
              if (isOutOfStock) return
              addLine({
                productId: product.id,
                variantId: firstVariant.id,
                categoryId: product.category.id,
                name: product.name,
                slug: product.slug,
                image: product.images[0],
                size: firstVariant.size,
                color: firstVariant.colorName,
                unitPrice: product.price,
                quantity: 1,
              })
              toast.success(`${product.name} added to cart`)
            }}
          >
            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
            {isOutOfStock ? 'Sold out' : 'Add +1'}
          </Button>
          <Link href={`/products/${product.slug}`} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium">
            View
          </Link>
          <button
            onClick={() => addToCompare(product.id, router)}
            className="rounded-full border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Compare"
            title="Add to compare"
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
