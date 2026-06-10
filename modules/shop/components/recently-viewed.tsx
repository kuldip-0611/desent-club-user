'use client'

import { useEffect, useState } from 'react'
import { getProductBySlug } from '@/services/product.service'
import { ProductCard } from '@/modules/shop/components/product-card'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import type { Product } from '@/types/product'

export const RecentlyViewedSection = () => {
  const { getViewed } = useRecentlyViewed()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const slugs = getViewed().slice(0, 6)
    if (!slugs.length) return

    Promise.allSettled(slugs.map((slug) => getProductBySlug(slug))).then((results) => {
      setProducts(
        results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
          .map((r) => r.value),
      )
    })
  }, [getViewed])

  if (products.length === 0) return null

  return (
    <section>
      <h2 className="mb-5 text-2xl font-bold">Recently viewed</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
