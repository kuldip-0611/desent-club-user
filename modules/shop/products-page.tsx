'use client'

import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { QuickViewModal } from '@/modules/shop/components/quick-view-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { useInfiniteProductsQuery, useShopCategoriesQuery } from '@/hooks/query/use-products-query'
import { useUiStore } from '@/store/ui-store'

type ProductsPageModuleProps = {
  initialCategory?: string
  initialAudience?: string
}

export const ProductsPageModule = ({ initialCategory = 'all', initialAudience = 'all' }: ProductsPageModuleProps) => {
  const openModal = useUiStore((s) => s.openModal)
  const [category, setCategory] = useState(initialCategory)
  const [audience, setAudience] = useState(initialAudience)
  const [sort, setSort] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { data: categories = [] } = useShopCategoriesQuery()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteProductsQuery({
    category: category as 'all',
    audience: audience as 'all',
    sort,
    search: debouncedSearch,
  })

  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-500">Discover premium fits with filtering and quick add.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm">
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm">
            <option value="all">All shoppers</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name..." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
            <button
              onClick={() => openModal('quickView', { productId: product.id })}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Loading products...</p> : null}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      ) : null}

      <QuickViewModal />
    </main>
  )
}
