'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { ProductCardSkeleton } from '@/modules/shop/components/product-card-skeleton'
import { QuickViewModal } from '@/modules/shop/components/quick-view-modal'
import { Input } from '@/components/ui/input'
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

type ProductFilters = {
  category: string
  subcategory: string
  audience: string
}

const buildProductsFilterQuery = ({ category, subcategory, audience }: ProductFilters) => {
  const params = new URLSearchParams()
  const normalizedCategory = category.trim()
  const normalizedSubcategory = subcategory.trim().toLowerCase()
  const normalizedAudience = audience.trim()

  if (normalizedCategory && normalizedCategory !== 'all') {
    params.set('category', normalizedCategory)
  }
  if (normalizedSubcategory) {
    params.set('subcategory', normalizedSubcategory)
  }
  if (normalizedAudience && normalizedAudience !== 'all') {
    params.set('audience', normalizedAudience)
  }

  return params.toString()
}

const readProductFilters = (
  searchParams: URLSearchParams,
  fallback: ProductFilters,
): ProductFilters => ({
  category: searchParams.get('category') ?? fallback.category,
  subcategory: (searchParams.get('subcategory') ?? fallback.subcategory).trim().toLowerCase(),
  audience: searchParams.get('audience') ?? fallback.audience,
})

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
  const fallbackFilters = useMemo<ProductFilters>(
    () => ({
      category: initialCategory,
      subcategory: initialSubcategory.trim().toLowerCase(),
      audience: initialAudience,
    }),
    [initialCategory, initialAudience, initialSubcategory],
  )
  const { category, subcategory, audience } = useMemo(
    () => readProductFilters(searchParams, fallbackFilters),
    [searchParams, fallbackFilters],
  )
  const updateProductFilters = (updates: Partial<ProductFilters>) => {
    const next = {
      category: updates.category ?? category,
      subcategory: updates.subcategory ?? subcategory,
      audience: updates.audience ?? audience,
    }
    const qs = buildProductsFilterQuery(next)
    const current = buildProductsFilterQuery({ category, subcategory, audience })
    if (qs === current) return
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false })
  }
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

  // Infinite scroll via IntersectionObserver.
  // Use a stable ref for the callback so the observer never needs to be
  // recreated on every render. Only attach after the first page has loaded.
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetchNextRef = useRef<() => void>(() => undefined)
  fetchNextRef.current = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    // Don't attach until the initial fetch is done — sentinel would be
    // visible on an empty/skeleton page and fire for every page at once.
    if (isLoading) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextRef.current() },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  // Only re-run when loading transitions from true→false (not on every render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

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
    <main className="mx-auto max-w-7xl space-y-3 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{activeCategory ? activeCategory.name : 'Products'}</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          {activeCategory
            ? `Browse ${activeCategory.name.toLowerCase()}${subcategory.trim() ? ` · ${subcategoryOptions.find((s) => s.slug === subcategory.trim().toLowerCase())?.name ?? subcategory}` : ''}`
            : 'Discover premium fits.'}
        </p>
      </div>

      {/* ── Controls: single scrollable row on mobile ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible">
        {/* Filters button */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            showFilters || hasActiveFilters
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
              {[selectedColors.length, selectedSizes.length, selectedFabrics.length, priceMin !== undefined || priceMax !== undefined ? 1 : 0, minRating !== undefined ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>

        {/* Category */}
        <div className="relative shrink-0">
          <select
            value={category}
            onChange={(e) => updateProductFilters({ category: e.target.value, subcategory: '' })}
            className="h-9 appearance-none rounded-xl border border-slate-300 bg-white py-0 pl-2.5 pr-7 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:pl-3 sm:pr-9 sm:text-sm"
          >
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 sm:right-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
        </div>

        {/* Audience */}
        <div className="relative shrink-0">
          <select
            value={audience}
            onChange={(e) => updateProductFilters({ audience: e.target.value })}
            className="h-9 appearance-none rounded-xl border border-slate-300 bg-white py-0 pl-2.5 pr-7 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:pl-3 sm:pr-9 sm:text-sm"
          >
            <option value="all">All shoppers</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 sm:right-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 appearance-none rounded-xl border border-slate-300 bg-white py-0 pl-2.5 pr-7 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:pl-3 sm:pr-9 sm:text-sm"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low → high</option>
            <option value="price-high">Price: high → low</option>
            <option value="rating">Top rated</option>
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 sm:right-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
        </div>
      </div>

      {/* ── Subcategory pills — horizontally scrollable on mobile ── */}
      {category !== 'all' && subcategoryOptions.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible">
          <button
            type="button"
            onClick={() => updateProductFilters({ subcategory: '' })}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 ${!subcategory.trim() ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            All
          </button>
          {subcategoryOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => updateProductFilters({ subcategory: s.slug })}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 ${subcategory.trim().toLowerCase() === s.slug.toLowerCase() ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              {s.name}
              {typeof s.productCount === 'number' && <span className="ml-1 opacity-50">({s.productCount})</span>}
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

      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product name..." className="h-9 text-sm sm:h-10" />

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
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

        {/* Skeleton rows while fetching next page */}
        {isFetchingNextPage
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`next-${i}`} />)
          : null}
      </div>

      {!isLoading && products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No products match these filters. Try adjusting your selection.
        </p>
      ) : null}

      {/* Intersection observer sentinel */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      <QuickViewModal />
    </main>
  )
}
