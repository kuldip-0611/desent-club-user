'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react'
import { MAIN_NAV } from '@/constants/navigation'
import { getCartCount, useCartStore } from '@/store/cart-store'
import { useUiStore } from '@/store/ui-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useAuthStore } from '@/store/auth-store'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { useShopCategoriesQuery } from '@/hooks/query/use-products-query'

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const lines = useCartStore((s) => s.lines)
  const count = useMemo(() => getCartCount(lines), [lines])
  const wishlistCount = useWishlistStore((s) => s.productIds.length)
  const setCartDrawer = useUiStore((s) => s.setCartDrawer)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const openModal = useUiStore((s) => s.openModal)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isDark = theme === 'dark'
  const { data: categories = [] } = useShopCategoriesQuery()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur',
        isDark ? 'border-slate-800 bg-slate-950/95 text-slate-100' : 'border-slate-200/70 bg-white/95 text-slate-900',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button className={cn('lg:hidden', isDark ? 'text-slate-200' : 'text-slate-700')} onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/home" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Desent Club logo" width={26} height={26} className="rounded-md" />
          <span className={cn('text-lg font-black tracking-tight', isDark ? 'text-slate-100' : 'text-slate-900')}>
            DESENT<span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>CLUB</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors',
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900',
              )}
            >
              {item.label}
            </Link>
          ))}
          <button
            onMouseEnter={() => setMegaMenuOpen(true)}
            onMouseLeave={() => setMegaMenuOpen(false)}
            className={cn('text-sm font-medium transition-colors', isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900')}
          >
            Categories
          </button>
        </nav>

        <div className="relative ml-auto hidden w-full max-w-md items-center lg:flex">
          <Search className={cn('pointer-events-none absolute left-3 h-4 w-4', isDark ? 'text-slate-400' : 'text-slate-400')} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tees, tracks, hoodies..."
            className={cn(
              'pl-9',
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400 focus:border-indigo-400'
                : '',
            )}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/wishlist" className={cn('relative rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}>
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 ? <span className="absolute -right-0.5 -top-0.5 rounded-full bg-slate-900 px-1.5 text-[10px] text-white">{wishlistCount}</span> : null}
          </Link>
          <button onClick={() => setCartDrawer(true)} className={cn('relative rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 ? <span className="absolute -right-1 -top-1.5 rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{count}</span> : null}
          </button>
          <button onClick={toggleTheme} className={cn('rounded-full p-2', isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100')}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {user ? (
            <button onClick={logout} className={cn('rounded-full border px-3 py-1 text-xs font-semibold', isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800')}>
              {user.name}
            </button>
          ) : (
            <button onClick={() => openModal('auth')} className={cn('rounded-full border px-3 py-1', isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800')}>
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
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className={cn('rounded-xl border p-4', isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-50')}>
                  <p className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>{cat.name}</p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Explore trending {cat.name.toLowerCase()}</p>
                </Link>
              ))}
              <Link href="/products?audience=MEN" className={cn('rounded-xl border p-4', isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-50')}>
                <p className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>Men</p>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Shop men-specific fits and essentials.</p>
              </Link>
              <Link href="/products?audience=WOMEN" className={cn('rounded-xl border p-4', isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-200 hover:bg-slate-50')}>
                <p className={cn('text-sm font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>Women</p>
                <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>Shop women-specific active and street styles.</p>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-80 border-r p-4 lg:hidden',
              isDark ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900',
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Menu</p>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {MAIN_NAV.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg p-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Categories</p>
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/products?category=${cat.slug}`} className="block rounded-lg p-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                    {cat.name}
                  </Link>
                ))}
                <Link href="/products?audience=MEN" className="block rounded-lg p-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Men
                </Link>
                <Link href="/products?audience=WOMEN" className="block rounded-lg p-2 text-sm hover:bg-slate-100" onClick={() => setMobileOpen(false)}>
                  Women
                </Link>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
