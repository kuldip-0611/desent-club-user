'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react'

function useIsMobile() {
  return useSyncExternalStore(
    (cb) => { const mq = window.matchMedia('(max-width: 767px)'); mq.addEventListener('change', cb); return () => mq.removeEventListener('change', cb) },
    () => window.matchMedia('(max-width: 767px)').matches,
    () => false,
  )
}
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { ProductCardSkeleton } from '@/modules/shop/components/product-card-skeleton'
import { RecentlyViewedSection } from '@/modules/shop/components/recently-viewed'
import { useShopHomeQuery } from '@/hooks/query/use-products-query'
import type { HomeBanner } from '@/services/product.service'

type BannerVariant = 'hero' | 'mid' | 'footer'

const variantStyles: Record<
  BannerVariant,
  {
    wrapper: string
    overlay: string
    title: string
    sub: string
    kicker?: string
    cta: string
  }
> = {
  hero: {
    wrapper: 'relative overflow-hidden rounded-2xl shadow-md',
    overlay:
      'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 sm:p-7 text-white',
    title: 'max-w-xs text-xl font-black leading-tight sm:text-2xl',
    sub: 'mt-1.5 max-w-xs text-xs text-slate-100/90 sm:text-sm',
    kicker: 'mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60',
    cta: 'mt-4 inline-block w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:px-5 sm:py-2.5 sm:text-sm',
  },
  mid: {
    wrapper: 'relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md dark:border-slate-700',
    overlay:
      'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 sm:p-6 text-white',
    title: 'max-w-sm text-xl font-bold leading-tight sm:text-2xl',
    sub: 'mt-1.5 max-w-sm text-sm text-slate-100/90',
    cta: 'mt-4 inline-block w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:text-sm',
  },
  footer: {
    wrapper: 'relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md dark:border-slate-700',
    overlay:
      'absolute inset-0 flex flex-col justify-end items-start bg-gradient-to-t from-indigo-950/80 via-indigo-900/30 to-transparent p-5 sm:p-6 text-white sm:items-end sm:text-right',
    title: 'max-w-sm text-xl font-bold leading-tight sm:text-2xl',
    sub: 'mt-1.5 max-w-sm text-sm text-indigo-100/90',
    cta: 'mt-4 inline-block w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:text-sm',
  },
}

// Fixed heights per variant — same height regardless of 1 or 2 per slide
const variantHeight: Record<BannerVariant, string> = {
  hero: 'h-64 sm:h-80',
  mid: 'h-52 sm:h-64',
  footer: 'h-52 sm:h-64',
}

const BannerSlide = ({ banner, variant }: { banner: HomeBanner; variant: BannerVariant }) => {
  const s = variantStyles[variant]
  const hasImage = Boolean(banner.image)

  return (
    <div className={`${s.wrapper} ${variantHeight[variant]} w-full ${!hasImage ? 'bg-slate-900' : ''}`}>
      {hasImage && (
        <Image src={banner.image} alt={banner.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      )}
      <div className={`${s.overlay} ${!hasImage ? 'from-slate-800/90 via-slate-800/50 to-slate-700/30' : ''}`}>
        {s.kicker && variant === 'hero' ? <p className={s.kicker}>New season drop</p> : null}
        <h2 className={s.title}>{banner.title}</h2>
        {banner.subtitle ? <p className={s.sub}>{banner.subtitle}</p> : null}
        {banner.href ? (
          <Link href={banner.href} className={s.cta}>
            Shop now
          </Link>
        ) : null}
      </div>
    </div>
  )
}

const chunkBanners = (banners: HomeBanner[], size: number) => {
  const chunks: HomeBanner[][] = []
  for (let i = 0; i < banners.length; i += size) {
    chunks.push(banners.slice(i, i + size))
  }
  return chunks
}

const PairedBannerCarousel = ({
  banners,
  variant,
  perSlide = 2,
  autoPlayMs = 5000,
}: {
  banners: HomeBanner[]
  variant: BannerVariant
  perSlide?: number
  autoPlayMs?: number
}) => {
  const slides = useMemo(() => chunkBanners(banners, perSlide), [banners, perSlide])
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => setIdx((i) => (i - 1 + slides.length) % slides.length), [slides.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % slides.length), [slides.length])

  useEffect(() => {
    setIdx(0)
  }, [banners.length, perSlide])

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const id = setInterval(next, autoPlayMs)
    return () => clearInterval(id)
  }, [slides.length, next, autoPlayMs])

  if (banners.length === 0) return null

  const current = slides[idx] ?? []
  const isSingleInSlide = current.length === 1

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${idx}-${current.map((b) => b.title).join('-')}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`grid items-stretch gap-4 ${
              isSingleInSlide ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {current.map((banner) => (
              <BannerSlide key={`${banner.title}-${banner.image}`} banner={banner} variant={variant} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label="Previous banners"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition hover:bg-black/65"
            aria-label="Next banners"
          >
            <ChevronRight size={18} />
          </button>
          <div className="mt-4 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-slate-900 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-slate-600'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const HomePageModule = () => {
  const { data, isLoading } = useShopHomeQuery()
  const isMobile = useIsMobile()
  const perSlide = isMobile ? 1 : 2
  const banners = data?.banners ?? []
  const midBanners = data?.midBanners ?? []
  const footerBanners = data?.footerBanners ?? []
  const categories = data?.categories ?? []
  const bestSellers = data?.bestSellers ?? []
  const newArrivals = data?.newest ?? []

  return (
    <main className="mx-auto max-w-[1440px] space-y-8 px-4 py-8 sm:px-8">
      <section>
        {isLoading ? (
          <div className={`grid items-stretch gap-4 ${perSlide === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {Array.from({ length: perSlide }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 sm:h-80" />
            ))}
          </div>
        ) : banners.length > 0 ? (
          <PairedBannerCarousel banners={banners} variant="hero" perSlide={perSlide} />
        ) : null}
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <div className="aspect-[4/3] animate-pulse bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="flex gap-1.5 pt-1">
                      {[40,56,48].map((w, j) => (
                        <div key={j} style={{ width: w }} className="h-4 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            : categories.map((item) => (
            <Link
              key={item.id}
              href={`/products?category=${item.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500"
            >
              {item.image ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <Image src={item.image} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
              ) : null}
              <div className="space-y-2 p-5">
                <p className="text-lg font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {item.productCount} product{item.productCount === 1 ? '' : 's'}
                </p>
                {item.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.subcategories.slice(0, 4).map((sub) => (
                      <span key={sub.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {sub.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Best sellers</h2>
          <Link href="/products" className="text-sm font-semibold text-slate-900 underline dark:text-white">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : bestSellers.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>

      {midBanners.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Featured</p>
              <h2 className="text-2xl font-bold">Season highlights</h2>
            </div>
          </div>
          <PairedBannerCarousel banners={midBanners} variant="mid" perSlide={perSlide} />
        </section>
      )}

      <section>
        <h2 className="mb-5 text-2xl font-bold">New arrivals</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.slice(0, 8).map((product) => (
            <ProductCard key={`${product.id}-new`} product={product} />
          ))}
        </div>
      </section>

      <RecentlyViewedSection />

      {footerBanners.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Don&apos;t miss</p>
              <h2 className="text-2xl font-bold">More to explore</h2>
            </div>
          </div>
          <PairedBannerCarousel banners={footerBanners} variant="footer" perSlide={perSlide} />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {['Fast shipping', 'Easy returns', 'Premium quality'].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold">{item}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Built for conversion-focused ecommerce UX and trust.</p>
          </div>
        ))}
      </section>
    </main>
  )
}
