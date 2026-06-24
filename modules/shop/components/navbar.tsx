'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { MAIN_NAV } from '@/constants/navigation'
import { getCartCount, useCartStore } from '@/store/cart-store'
import { useFlashSaleStore } from '@/store/flash-sale-store'
import { useUiStore } from '@/store/ui-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { useShopCategoriesQuery } from '@/hooks/query/use-products-query'
import { searchProducts } from '@/services/product.service'
import { useDebounce } from '@/hooks/use-debounce'

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileSearch, setMobileSearch] = useState('')
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debouncedSearch = useDebounce(search, 300)
  const debouncedMobileSearch = useDebounce(mobileSearch, 300)
  const lines = useCartStore((s) => s.lines)
  const count = useMemo(() => getCartCount(lines), [lines])
  const wishlistCount = useWishlistStore((s) => s.productIds.length)
  const setCartDrawer = useUiStore((s) => s.setCartDrawer)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isDark = theme === 'dark'
  const { data: categories = [] } = useShopCategoriesQuery()
  const hasSale = useFlashSaleStore((s) => Object.keys(s.saleMap).length > 0)
  const navItems = MAIN_NAV.filter((item) => item.href !== '/sale' || hasSale)

  // Live search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: () => searchProducts(debouncedSearch),
    enabled: debouncedSearch.trim().length >= 2,
    staleTime: 30_000,
  })

  const { data: mobileSuggestions = [] } = useQuery({
    queryKey: ['search-suggestions', debouncedMobileSearch],
    queryFn: () => searchProducts(debouncedMobileSearch),
    enabled: debouncedMobileSearch.trim().length >= 2,
    staleTime: 30_000,
  })

  const showDropdown = searchFocused && search.trim().length >= 2
  const showMobileDropdown = mobileSearchFocused && mobileSearch.trim().length >= 2

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchSubmit = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setSearchFocused(false)
    setMobileSearchFocused(false)
    router.push(`/products?search=${encodeURIComponent(trimmed)}`)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  const mobileLinkClass = cn(
    'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100',
  )

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b backdrop-blur',
          isDark ? 'border-slate-800 bg-slate-950/95 text-slate-100' : 'border-slate-200/70 bg-white/95 text-slate-900',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            className={cn('lg:hidden', isDark ? 'text-slate-200' : 'text-slate-700')}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/home" className="flex items-center gap-2">
            <Image src="/icon.png" alt="Disent Club logo" width={44} height={44} className="h-11 w-11 shrink-0 rounded-md" />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium transition-colors',
                  isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
              className={cn(
                'rounded-md px-2 py-1 text-sm font-medium transition-colors',
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              Categories
            </button>
          </nav>

          {/* ── Desktop Search ─────────────────────────────────────── */}
          <div ref={searchRef} className="relative ml-auto hidden w-full max-w-md items-center lg:flex">
            <Search className={cn('pointer-events-none absolute left-3 h-4 w-4 z-10', isDark ? 'text-slate-400' : 'text-slate-400')} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(search)
                if (e.key === 'Escape') setSearchFocused(false)
              }}
              placeholder="Search tees, tracks, hoodies..."
              className={cn(
                'pl-9',
                isDark ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-400' : '',
              )}
            />
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border shadow-xl overflow-hidden',
                    isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
                  )}
                >
                  {suggestions.length > 0 ? (
                    <>
                      {suggestions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/products/${s.slug}`}
                          onClick={() => { setSearch(''); setSearchFocused(false) }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 transition-colors',
                            isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
                          )}
                        >
                          <div className={cn('h-10 w-10 shrink-0 overflow-hidden rounded-lg border', isDark ? 'border-slate-700' : 'border-slate-200')}>
                            {s.image ? (
                              <Image src={s.image} alt={s.name} width={40} height={40} className="h-full w-full object-cover" />
                            ) : (
                              <div className={cn('h-full w-full', isDark ? 'bg-slate-800' : 'bg-slate-100')} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-900')}>{s.name}</p>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                              ₹{s.price.toLocaleString('en-IN')}
                              {s.compareAtPrice && (
                                <span className="ml-1.5 line-through opacity-60">₹{s.compareAtPrice.toLocaleString('en-IN')}</span>
                              )}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <button
                        onClick={() => handleSearchSubmit(search)}
                        className={cn(
                          'flex w-full items-center gap-2 border-t px-4 py-2.5 text-sm font-medium transition-colors',
                          isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-100 text-slate-900 hover:bg-slate-50',
                        )}
                      >
                        <Search className="h-3.5 w-3.5" />
                        See all results for &quot;{search}&quot;
                      </button>
                    </>
                  ) : (
                    <p className={cn('px-4 py-3 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      No results for &quot;{search}&quot;
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/wishlist"
              className={cn('relative rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-slate-900 px-1.5 text-[10px] text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setCartDrawer(true)}
              className={cn('relative rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1.5 rounded-full bg-slate-900 px-1.5 text-[10px] text-white">
                  {count}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className={cn('rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <Link
                href="/profile"
                className={cn(
                  'inline-flex max-w-[7rem] items-center rounded-full border px-3 py-1 text-xs font-semibold sm:max-w-none',
                  isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-50',
                )}
              >
                <span className="truncate">{user.name}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal()}
                className={cn('rounded-full border px-3 py-1', isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800')}
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {megaMenuOpen ? (
            <motion.div
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn('hidden border-t lg:block', isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white')}
            >
              <div className="mx-auto grid max-w-7xl grid-cols-4 gap-4 p-6">
                {categories.map((cat) => (
                  <div key={cat.id} className={cn('rounded-xl border p-4', isDark ? 'border-slate-800' : 'border-slate-200')}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      onClick={() => setMegaMenuOpen(false)}
                      className={cn('text-sm font-semibold transition-colors', isDark ? 'text-slate-100 hover:text-white' : 'text-slate-900 hover:text-slate-600')}
                    >
                      {cat.name}
                    </Link>
                    {cat.subcategories.length > 0 ? (
                      <ul className="mt-3 space-y-1.5">
                        {cat.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                              onClick={() => setMegaMenuOpen(false)}
                              className={cn('text-xs transition-colors', isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900')}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={cn('mt-2 text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        View all {cat.name.toLowerCase()}
                      </p>
                    )}
                  </div>
                ))}
                <Link
                  href="/products?audience=MEN"
                  onClick={() => setMegaMenuOpen(false)}
                  className={cn('rounded-xl border p-4 transition-colors', isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')}
                >
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>Men</p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Shop men-specific fits and essentials.
                  </p>
                </Link>
                <Link
                  href="/products?audience=WOMEN"
                  onClick={() => setMegaMenuOpen(false)}
                  className={cn('rounded-xl border p-4 transition-colors', isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')}
                >
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>Women</p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Shop women-specific active and street styles.
                  </p>
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              onClick={closeMobile}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className={cn(
                'absolute left-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col border-r shadow-2xl',
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-900',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  'flex shrink-0 items-center justify-between border-b px-4 py-4',
                  isDark ? 'border-slate-800' : 'border-slate-200',
                )}
              >
                <p className="text-lg font-bold">Menu</p>
                <button
                  type="button"
                  onClick={closeMobile}
                  className={cn(
                    'rounded-full p-2 transition-colors',
                    isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
                  )}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-4">
                {/* Mobile search */}
                <div ref={mobileSearchRef} className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    onFocus={() => setMobileSearchFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { handleSearchSubmit(mobileSearch); closeMobile() }
                      if (e.key === 'Escape') setMobileSearchFocused(false)
                    }}
                    placeholder="Search products..."
                    className={cn(
                      'w-full rounded-lg border pl-9 pr-4 py-2.5 text-sm outline-none transition-colors',
                      isDark
                        ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-slate-900',
                    )}
                  />
                  {showMobileDropdown && mobileSuggestions.length > 0 && (
                    <div className={cn('absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border shadow-xl overflow-hidden', isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}>
                      {mobileSuggestions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/products/${s.slug}`}
                          onClick={() => { setMobileSearch(''); setMobileSearchFocused(false); closeMobile() }}
                          className={cn('flex items-center gap-3 px-3 py-2.5 transition-colors', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}
                        >
                          <div className={cn('h-9 w-9 shrink-0 overflow-hidden rounded-lg border', isDark ? 'border-slate-700' : 'border-slate-200')}>
                            {s.image
                              ? <Image src={s.image} alt={s.name} width={36} height={36} className="h-full w-full object-cover" />
                              : <div className={cn('h-full w-full', isDark ? 'bg-slate-800' : 'bg-slate-100')} />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('truncate text-sm font-medium', isDark ? 'text-slate-100' : 'text-slate-900')}>{s.name}</p>
                            <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>₹{s.price.toLocaleString('en-IN')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className={mobileLinkClass} onClick={closeMobile}>
                    {item.label}
                  </Link>
                ))}
                <div className={cn('mt-4 border-t pt-4', isDark ? 'border-slate-800' : 'border-slate-200')}>
                  <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Categories
                  </p>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className={cn(
                          'rounded-xl border p-3',
                          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50',
                        )}
                      >
                        <Link
                          href={`/products?category=${cat.slug}`}
                          className={cn(
                            'block text-sm font-semibold',
                            isDark ? 'text-slate-100 hover:text-slate-300' : 'text-slate-900 hover:text-slate-600',
                          )}
                          onClick={closeMobile}
                        >
                          {cat.name}
                        </Link>
                        {cat.subcategories.length > 0 ? (
                          <div className="mt-2 space-y-0.5 border-l-2 border-slate-300 pl-3">
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${cat.slug}&subcategory=${sub.slug}`}
                                className={cn(
                                  'block rounded-md py-1.5 text-xs',
                                  isDark
                                    ? 'text-slate-400 hover:text-slate-300'
                                    : 'text-slate-600 hover:text-slate-600',
                                )}
                                onClick={closeMobile}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <Link href="/products?audience=MEN" className={mobileLinkClass} onClick={closeMobile}>
                      Men
                    </Link>
                    <Link href="/products?audience=WOMEN" className={mobileLinkClass} onClick={closeMobile}>
                      Women
                    </Link>
                  </div>
                </div>
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
