'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, PackageSearch, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { ProductCardSkeleton } from '@/modules/shop/components/product-card-skeleton'
import { QuickViewModal } from '@/modules/shop/components/quick-view-modal'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { useInfiniteProductsQuery, useShopCategoriesQuery } from '@/hooks/query/use-products-query'
import { useProductsQuery } from '@/hooks/query/use-products-query'
import { apiClient } from '@/services/api/client'
import { getActiveBundles, type ActiveBundle } from '@/services/bundle.service'

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
  initialSearch?: string
  initialBundleId?: string
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

const FilterSection = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 py-4 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export const ProductsPageModule = ({
  initialCategory = 'all',
  initialAudience = 'all',
  initialSubcategory = '',
  initialSearch = '',
  initialBundleId = '',
}: ProductsPageModuleProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const bundleId = searchParams.get('bundleId') ?? initialBundleId
  const [activeBundle, setActiveBundle] = useState<ActiveBundle | null>(null)
  const [bundleIds, setBundleIds] = useState<string | null>(null)

  useEffect(() => {
    if (!bundleId) { setActiveBundle(null); setBundleIds(null); return }
    getActiveBundles().then((bundles) => {
      const found = bundles.find((b) => b.id === bundleId) ?? null
      setActiveBundle(found)
      setBundleIds(found ? found.productIds.join(',') : null)
    }).catch(() => { setActiveBundle(null); setBundleIds(null) })
  }, [bundleId])

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
  const [search, setSearch] = useState(() => searchParams.get('search') ?? initialSearch)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? ''
    setSearch(urlSearch)
  }, [searchParams])

  const { data: categories = [] } = useShopCategoriesQuery()

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSortOpen, setMobileSortOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [minRating, setMinRating] = useState<number | undefined>(undefined)

  useEffect(() => {
    apiClient.get<FilterOptions>('/shop/filter-options')
      .then(({ data }) => setFilterOptions(data))
      .catch(() => {/* ignore */})
  }, [])

  const bundleQuery = useProductsQuery({ ids: bundleIds ?? '' })
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: infiniteLoading } = useInfiniteProductsQuery({
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

  const isBundleMode = !!bundleId
  const isLoading = isBundleMode ? (bundleIds === null || bundleQuery.isLoading) : infiniteLoading
  const products = useMemo(
    () => isBundleMode ? (bundleQuery.data?.items ?? []) : (data?.pages.flatMap((page) => page.items) ?? []),
    [isBundleMode, bundleQuery.data, data],
  )
  const activeCategory = useMemo(() => categories.find((c) => c.slug === category), [categories, category])
  const subcategoryOptions = useMemo(() => activeCategory?.subcategories ?? [], [activeCategory])

  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetchNextRef = useRef<() => void>(() => undefined)
  fetchNextRef.current = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (isLoading) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchNextRef.current() },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedFabrics.length > 0 ||
    priceMin !== undefined ||
    priceMax !== undefined ||
    minRating !== undefined

  const activeFilterCount = [
    selectedColors.length,
    selectedSizes.length,
    selectedFabrics.length,
    priceMin !== undefined || priceMax !== undefined ? 1 : 0,
    minRating !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

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

  const FilterPanelContent = () => (
    <div className="space-y-0">
      {/* Search */}
      <div className="pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const trimmed = search.trim()
                const current = searchParams.get('search') ?? ''
                if (trimmed === current) return
                const next = new URLSearchParams(searchParams.toString())
                if (trimmed) { next.set('search', trimmed) } else { next.delete('search') }
                router.replace(`/products${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false })
              }
            }}
            placeholder="Search products…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Sort */}
      <FilterSection title="Sort By">
        <div className="space-y-1">
          {([
            ['featured', 'Featured'],
            ['price-low', 'Price: Low → High'],
            ['price-high', 'Price: High → Low'],
            ['rating', 'Top Rated'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setSort(val)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${sort === val ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {label}
              {sort === val && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateProductFilters({ category: 'all', subcategory: '' })}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${category === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateProductFilters({ category: cat.slug, subcategory: '' })}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${category === cat.slug ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Subcategory — only when category selected */}
      {category !== 'all' && subcategoryOptions.length > 0 && (
        <FilterSection title="Subcategory">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => updateProductFilters({ subcategory: '' })}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${!subcategory.trim() ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              All
            </button>
            {subcategoryOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => updateProductFilters({ subcategory: s.slug })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${subcategory.trim().toLowerCase() === s.slug.toLowerCase() ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
              >
                <span>{s.name}</span>
                {typeof s.productCount === 'number' && (
                  <span className="text-xs opacity-50">({s.productCount})</span>
                )}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Audience */}
      <FilterSection title="For" defaultOpen={false}>
        <div className="space-y-1">
          {([['all', 'Everyone'], ['MEN', 'Men'], ['WOMEN', 'Women']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => updateProductFilters({ audience: val })}
              className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition ${audience === val ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {filterOptions && (
        <>
          {/* Price */}
          <FilterSection title="Price (₹)" defaultOpen={false}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`Min`}
                value={priceMin ?? ''}
                onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                placeholder={`Max`}
                value={priceMax ?? ''}
                onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </FilterSection>

          {/* Size */}
          {filterOptions.sizes.length > 0 && (
            <FilterSection title="Size" defaultOpen={false}>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleItem(selectedSizes, setSelectedSizes, size)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selectedSizes.includes(size)
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-300 text-slate-700 hover:border-slate-900 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Color */}
          {filterOptions.colors.length > 0 && (
            <FilterSection title="Color" defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {filterOptions.colors.slice(0, 16).map((color) => {
                  const hex = COLOR_SWATCHES[color.toLowerCase()] ?? '#94a3b8'
                  const selected = selectedColors.includes(color)
                  return (
                    <button
                      key={color}
                      onClick={() => toggleItem(selectedColors, setSelectedColors, color)}
                      title={color}
                      className={`h-7 w-7 rounded-full border-2 transition ${selected ? 'border-slate-900 ring-2 ring-offset-1 ring-slate-400 dark:border-white dark:ring-white' : 'border-slate-300 shadow dark:border-slate-600'}`}
                      style={{ backgroundColor: hex }}
                    />
                  )
                })}
              </div>
              {selectedColors.length > 0 && (
                <p className="mt-2 text-[11px] capitalize text-slate-500 dark:text-slate-400">{selectedColors.join(', ')}</p>
              )}
            </FilterSection>
          )}

          {/* Rating */}
          <FilterSection title="Min. Rating" defaultOpen={false}>
            <div className="flex gap-1.5">
              {[4, 3, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? undefined : r)}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    minRating === r
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-amber-400 dark:border-slate-600 dark:text-slate-300'
                  }`}
                >
                  {r}★+
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Fabric */}
          {filterOptions.fabrics.length > 0 && (
            <FilterSection title="Fabric" defaultOpen={false}>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.fabrics.map((fabric) => (
                  <button
                    key={fabric.id}
                    onClick={() => toggleItem(selectedFabrics, setSelectedFabrics, fabric.name)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      selectedFabrics.includes(fabric.name)
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-300 text-slate-700 hover:border-slate-900 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {fabric.name}
                  </button>
                ))}
              </div>
            </FilterSection>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-3 pb-20 sm:px-8 sm:py-8 lg:pb-8">
      {/* ── Bundle banner ── */}
      {isBundleMode && activeBundle && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-800/40 dark:bg-violet-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
              <Tag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">Bundle Deal</p>
              <p className="font-bold text-slate-900 dark:text-slate-100">{activeBundle.name}</p>
              {activeBundle.description && <p className="text-xs text-slate-500">{activeBundle.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-violet-600 px-3 py-1 text-sm font-bold text-white">
              {activeBundle.discountType === 'PERCENT'
                ? `Buy any ${activeBundle.minItems} — ${activeBundle.discountValue}% off`
                : `Buy any ${activeBundle.minItems} — ₹${activeBundle.discountValue} off`}
            </span>
            <button
              onClick={() => router.replace('/products', { scroll: false })}
              className="rounded-full p-1 text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
              aria-label="Clear bundle filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="mb-0 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold sm:text-2xl dark:text-slate-100">
            {isBundleMode && activeBundle ? `${activeBundle.name} Products` : activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {isBundleMode && activeBundle
              ? `${products.length} products in this bundle`
              : activeCategory
                ? `Browse ${activeCategory.name.toLowerCase()}${subcategory.trim() ? ` · ${subcategoryOptions.find((s) => s.slug === subcategory.trim().toLowerCase())?.name ?? subcategory}` : ''}`
                : 'Discover premium fits'}
          </p>
        </div>

      </div>

      {/* Active filter chips */}
      {!isBundleMode && hasActiveFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {selectedSizes.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {s}
              <button onClick={() => setSelectedSizes((prev) => prev.filter((x) => x !== s))} className="ml-0.5 text-slate-400 hover:text-slate-900"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {selectedColors.map((c) => (
            <span key={c} className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium capitalize dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              <span className="h-3 w-3 rounded-full" style={{ background: COLOR_SWATCHES[c.toLowerCase()] ?? '#94a3b8' }} />
              {c}
              <button onClick={() => setSelectedColors((prev) => prev.filter((x) => x !== c))} className="ml-0.5 text-slate-400 hover:text-slate-900"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {(priceMin !== undefined || priceMax !== undefined) && (
            <span className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              ₹{priceMin ?? 0}–{priceMax ?? '∞'}
              <button onClick={() => { setPriceMin(undefined); setPriceMax(undefined) }} className="ml-0.5 text-slate-400 hover:text-slate-900"><X className="h-3 w-3" /></button>
            </span>
          )}
          {minRating !== undefined && (
            <span className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {minRating}★+
              <button onClick={() => setMinRating(undefined)} className="ml-0.5 text-slate-400 hover:text-slate-900"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-red-500 hover:underline dark:text-red-400">Clear all</button>
        </div>
      )}

      {/* ── Main layout: sidebar + grid ── */}
      <div className="flex gap-8">
        {/* ── Desktop sidebar ── */}
        {!isBundleMode && (
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear</button>
                )}
              </div>
              <FilterPanelContent />
            </div>
          </aside>
        )}

        {/* ── Product grid ── */}
        <div className="min-w-0 flex-1">

          <div className={`grid gap-3 sm:gap-4 ${isBundleMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((product) => (
                  <ProductCard key={product.id} product={product} showQuickView />
                ))}

            {!isBundleMode && isFetchingNextPage
              ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={`next-${i}`} />)
              : null}
          </div>

          {!isLoading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <PackageSearch className="h-9 w-9 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No products found</h3>
                {search ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No results for <span className="font-medium text-slate-700 dark:text-slate-300">&ldquo;{search}&rdquo;</span>. Try a different keyword.
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nothing matches these filters. Try adjusting or clearing them.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <X className="h-3 w-3" /> Clear search
                  </button>
                )}
                {(hasActiveFilters || category !== 'all' || subcategory || (audience && audience !== 'all')) && (
                  <button
                    onClick={() => { clearFilters(); updateProductFilters({ category: 'all', subcategory: '', audience: 'all' }) }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {!isBundleMode && <div ref={sentinelRef} className="h-1" aria-hidden />}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {mobileFilterOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileFilterOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[90vw] flex-col bg-white shadow-2xl dark:bg-slate-900 lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-slate-100">Filters</p>
              <button onClick={() => setMobileFilterOpen(false)} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <FilterPanelContent />
            </div>
            <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Show results
                {products.length > 0 ? ` (${products.length})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      <QuickViewModal />

      {/* ── Mobile sticky bottom bar ── */}
      {!isBundleMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:hidden">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 transition active:bg-slate-50 dark:text-slate-200 dark:active:bg-slate-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-4.5 w-4.5 min-w-[1.1rem] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="w-px self-stretch bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => setMobileSortOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 transition active:bg-slate-50 dark:text-slate-200 dark:active:bg-slate-800"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Sort
            {sort !== 'featured' && <span className="h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white" />}
          </button>
        </div>
      )}

      {/* ── Mobile sort sheet ── */}
      {mobileSortOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileSortOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white pb-safe dark:bg-slate-900 lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <p className="font-bold text-slate-900 dark:text-slate-100">Sort By</p>
              <button onClick={() => setMobileSortOpen(false)} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <div className="px-4 py-2 pb-6">
              {([
                ['featured', 'Featured'],
                ['price-low', 'Price: Low to High'],
                ['price-high', 'Price: High to Low'],
                ['rating', 'Top Rated'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setSort(val); setMobileSortOpen(false) }}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                    sort === val
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                  {sort === val && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
