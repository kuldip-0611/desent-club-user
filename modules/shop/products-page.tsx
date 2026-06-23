'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { QuickViewModal } from '@/modules/shop/components/quick-view-modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { useInfiniteProductsQuery, useShopCategoriesQuery } from '@/hooks/query/use-products-query'
import { useUiStore } from '@/store/ui-store'
import { apiClient } from '@/services/api/client'

type FilterOptions = {
  colors: string[]
  sizes: string[]
  fabrics: { id: string; name: string; slug: string }[]
  priceRange: { min: number; max: number }
}

type ProductsPageModuleProps = {
  initialCategory?: string
  initialAudience?: string
  initialSubcategory?: string
}

const COLOR_SWATCHES: Record<string, string> = {
  black: '#111827', white: '#f8fafc', navy: '#1e3a8a', charcoal: '#334155',
  olive: '#4d7c0f', maroon: '#7f1d1d', 'sky blue': '#0284c7', beige: '#d6d3d1',
  lavender: '#8b5cf6', mint: '#10b981', mustard: '#ca8a04', coral: '#f97316',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  pink: '#ec4899', purple: '#a855f7', orange: '#f97316', grey: '#6b7280',
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

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [minRating, setMinRating] = useState<number | undefined>(undefined)

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
    if (next !== current) router.replace(next, { scroll: false })
  }, [category, subcategory, audience, router, searchParams])

  // Fetch filter options once
  useEffect(() => {
    apiClient.get<FilterOptions>('/shop/filter-options')
      .then(({ data }) => setFilterOptions(data))
      .catch(() => {/* ignore */})
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteProductsQuery({
    category: category as 'all',
    subcategory: subcategory?.trim() ? subcategory.trim().toLowerCase() : undefined,
    audience: audience as 'all',
    sort,
    search: debouncedSearch,
    minPrice: priceMin,
    maxPrice: priceMax,
    sizes: selectedSizes.length ? selectedSizes : undefined,
    colors: selectedColors.length ? selectedColors : undefined,
    minRating,
  })

  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
  const activeCategory = useMemo(() => categories.find((c) => c.slug === category), [categories, category])
  const subcategoryOptions = useMemo(() => activeCategory?.subcategories ?? [], [activeCategory])

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedFabrics.length > 0 ||
    priceMin !== undefined ||
    priceMax !== undefined ||
    minRating !== undefined

  const clearFilters = () => {
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedFabrics([])
    setPriceMin(undefined)
    setPriceMax(undefined)
    setMinRating(undefined)
  }

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item])
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{activeCategory ? activeCategory.name : 'Products'}</h1>
          <p className="text-sm text-slate-500">
            {activeCategory
              ? `Browse ${activeCategory.name.toLowerCase()}${subcategory.trim() ? ` · ${subcategoryOptions.find((s) => s.slug === subcategory.trim().toLowerCase())?.name ?? subcategory}` : ''}`
              : 'Discover premium fits.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              showFilters || hasActiveFilters
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {[selectedColors.length, selectedSizes.length, selectedFabrics.length, priceMin !== undefined || priceMax !== undefined ? 1 : 0, minRating !== undefined ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubcategory('') }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <option value="all">All shoppers</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {/* ── Subcategory pills ── */}
      {category !== 'all' && subcategoryOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
          <button
            type="button"
            onClick={() => setSubcategory('')}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${!subcategory.trim() ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            All
          </button>
          {subcategoryOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubcategory(s.slug)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${subcategory.trim().toLowerCase() === s.slug.toLowerCase() ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              {s.name}
              {typeof s.productCount === 'number' && <span className="ml-1 text-slate-400">({s.productCount})</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Advanced filter panel ── */}
      {showFilters && filterOptions && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Filter products</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:underline dark:text-red-400">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Price range */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Price (₹)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={`Min ${filterOptions.priceRange.min}`}
                  value={priceMin ?? ''}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <span className="text-slate-400 dark:text-slate-500">–</span>
                <input
                  type="number"
                  placeholder={`Max ${filterOptions.priceRange.max}`}
                  value={priceMax ?? ''}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {/* Size filter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Size</p>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleItem(selectedSizes, setSelectedSizes, size)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selectedSizes.includes(size)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700 hover:border-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color filter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Color</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.colors.slice(0, 12).map((color) => {
                  const hex = COLOR_SWATCHES[color.toLowerCase()] ?? '#94a3b8'
                  const selected = selectedColors.includes(color)
                  return (
                    <button
                      key={color}
                      onClick={() => toggleItem(selectedColors, setSelectedColors, color)}
                      title={color}
                      className={`h-7 w-7 rounded-full border-2 transition ${selected ? 'border-slate-900 ring-2 ring-slate-400' : 'border-slate-400 shadow dark:border-slate-600'}`}
                      style={{ backgroundColor: hex }}
                    />
                  )
                })}
              </div>
              {selectedColors.length > 0 && (
                <p className="mt-1 text-[10px] text-slate-500 capitalize dark:text-slate-400">{selectedColors.join(', ')}</p>
              )}
            </div>

            {/* Rating filter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Min. rating</p>
              <div className="flex gap-1.5">
                {[4, 3, 2].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? undefined : r)}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      minRating === r
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300 text-slate-700 hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-amber-500 dark:hover:text-amber-400'
                    }`}
                  >
                    {r}★+
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fabric filter */}
          {filterOptions.fabrics.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fabric</p>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.fabrics.map((fabric) => (
                  <button
                    key={fabric.id}
                    onClick={() => toggleItem(selectedFabrics, setSelectedFabrics, fabric.name)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedFabrics.includes(fabric.name)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700 hover:border-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-white'
                    }`}
                  >
                    {fabric.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
          No products match these filters. Try adjusting your selection.
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
