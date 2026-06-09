'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  initialSubcategory?: string
}

export const ProductsPageModule = ({
  initialCategory = 'all',
  initialAudience = 'all',
  initialSubcategory = '',
}: ProductsPageModuleProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openModal = useUiStore((s) => s.openModal)
  const [category, setCategory] = useState(initialCategory)
  const [subcategory, setSubcategory] = useState(initialSubcategory)
  const [audience, setAudience] = useState(initialAudience)
  const [sort, setSort] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { data: categories = [] } = useShopCategoriesQuery()

  useEffect(() => {
    setCategory(initialCategory)
    setSubcategory(initialSubcategory)
    setAudience(initialAudience)
  }, [initialCategory, initialSubcategory, initialAudience])

  useEffect(() => {
    const params = new URLSearchParams()
    if (category && category !== 'all') params.set('category', category)
    if (subcategory.trim()) params.set('subcategory', subcategory.trim())
    if (audience && audience !== 'all') params.set('audience', audience)
    const qs = params.toString()
    const next = qs ? `/products?${qs}` : '/products'
    const current = searchParams.toString() ? `/products?${searchParams.toString()}` : '/products'
    if (next !== current) {
      router.replace(next, { scroll: false })
    }
  }, [category, subcategory, audience, router, searchParams])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteProductsQuery({
    category: category as 'all',
    subcategory: subcategory?.trim() ? subcategory.trim().toLowerCase() : undefined,
    audience: audience as 'all',
    sort,
    search: debouncedSearch,
  })

  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const activeCategory = useMemo(() => categories.find((c) => c.slug === category), [categories, category])

  const subcategoryOptions = useMemo(() => activeCategory?.subcategories ?? [], [activeCategory])

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {activeCategory ? activeCategory.name : 'Products'}
          </h1>
          <p className="text-sm text-slate-500">
            {activeCategory
              ? `Browse ${activeCategory.name.toLowerCase()}${subcategory.trim() ? ` · ${subcategoryOptions.find((s) => s.slug === subcategory.trim().toLowerCase())?.name ?? subcategory}` : ''}`
              : 'Discover premium fits with filtering and quick add.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setSubcategory('')
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
          >
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

      {category !== 'all' && subcategoryOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
          <button
            type="button"
            onClick={() => setSubcategory('')}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              !subcategory.trim() ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {subcategoryOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubcategory(s.slug)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                subcategory.trim().toLowerCase() === s.slug.toLowerCase()
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.name}
              {typeof s.productCount === 'number' ? <span className="ml-1 text-slate-400">({s.productCount})</span> : null}
            </button>
          ))}
        </div>
      ) : null}

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
      {!isLoading && products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
          No products match these filters. Try another category or subcategory.
        </p>
      ) : null}

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
