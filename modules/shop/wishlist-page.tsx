'use client'

import { useMemo } from 'react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { useProductsQuery } from '@/hooks/query/use-products-query'
import { useWishlistStore } from '@/store/wishlist-store'

export const WishlistPageModule = () => {
  const ids = useWishlistStore((s) => s.productIds)
  const { data } = useProductsQuery({ limit: 50 })
  const items = useMemo(() => (data?.items ?? []).filter((item) => ids.includes(item.id)), [data?.items, ids])

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      {items.length === 0 ? <p className="text-sm text-slate-500">No saved products yet.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </main>
  )
}
