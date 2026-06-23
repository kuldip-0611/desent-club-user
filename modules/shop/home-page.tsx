'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/modules/shop/components/product-card'
import { RecentlyViewedSection } from '@/modules/shop/components/recently-viewed'
import { Skeleton } from '@/components/ui/skeleton'
import { useShopHomeQuery } from '@/hooks/query/use-products-query'
import type { HomeBanner } from '@/services/product.service'

// ── Banner carousel ────────────────────────────────────────────────────────────

type BannerVariant = 'hero' | 'mid' | 'footer'

const variantStyles: Record<BannerVariant, { wrapper: string; aspect: string; overlay: string; title: string; sub: string }> = {
  hero: {
    wrapper: 'relative overflow-hidden rounded-3xl',
    aspect: 'aspect-[5/3]',
    overlay: 'absolute inset-0 bg-gradient-to-r from-black/60 to-black/15 p-8 text-white flex flex-col justify-end',
    title: 'max-w-sm text-3xl font-black leading-tight',
    sub: 'mt-2 max-w-sm text-sm text-slate-100',
  },
  mid: {
    wrapper: 'relative overflow-hidden rounded-2xl',
    aspect: 'aspect-[16/5] md:aspect-[21/6]',
    overlay: 'absolute inset-0 bg-gradient-to-r from-black/55 to-transparent p-8 text-white flex flex-col justify-center',
    title: 'max-w-lg text-2xl font-black leading-tight md:text-3xl',
    sub: 'mt-2 max-w-md text-sm text-slate-200',
  },
  footer: {
    wrapper: 'relative overflow-hidden rounded-2xl',
    aspect: 'aspect-[16/5] md:aspect-[21/6]',
    overlay: 'absolute inset-0 bg-gradient-to-l from-black/55 to-transparent p-8 text-white flex flex-col justify-center items-end text-right',
    title: 'max-w-lg text-2xl font-black leading-tight md:text-3xl',
    sub: 'mt-2 max-w-md text-sm text-slate-200',
  },
}

const BannerSlide = ({ banner, variant }: { banner: HomeBanner; variant: BannerVariant }) => {
  const s = variantStyles[variant]
  const hasImage = Boolean(banner.image)

  return (
    <div className={`${s.wrapper} ${s.aspect} w-full ${!hasImage ? 'bg-slate-900' : ''}`}>
      {hasImage && (
        <Image src={banner.image} alt={banner.title} fill className="object-cover" />
      )}
      <div className={`${s.overlay} ${!hasImage ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/60' : ''}`}>
        {variant === 'hero' && (
          <p className="text-xs uppercase tracking-[0.2em] mb-3">New season drop</p>
        )}
        <h2 className={s.title}>{banner.title}</h2>
        {banner.subtitle && <p className={s.sub}>{banner.subtitle}</p>}
        <Link
          href={banner.href}
          className="mt-5 inline-block w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
        >
          Shop now
        </Link>
      </div>
    </div>
  )
}

const BannerCarousel = ({ banners, variant }: { banners: HomeBanner[]; variant: BannerVariant }) => {
  const [idx, setIdx] = useState(0)

  const prev = useCallback(() => setIdx((i) => (i - 1 + banners.length) % banners.length), [banners.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [banners.length, next])

  if (banners.length === 0) return null

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
        >
          <BannerSlide banner={banners[idx]} variant={variant} />
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 transition"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60 transition"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Hero section: always carousel ─────────────────────────────────────────────

const HeroBanners = ({ banners }: { banners: HomeBanner[] }) => {
  if (banners.length === 0) return null
  return (
    <section>
      <BannerCarousel banners={banners} variant="hero" />
    </section>
  )
}

// ── Main home page ─────────────────────────────────────────────────────────────

export const HomePageModule = () => {
  const { data, isLoading } = useShopHomeQuery()
  const banners = data?.banners ?? []
  const midBanners = data?.midBanners ?? []
  const footerBanners = data?.footerBanners ?? []
  const categories = data?.categories ?? []
  const bestSellers = data?.bestSellers ?? []
  const newArrivals = data?.newest ?? []

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-8 sm:px-6">

      {/* Hero banners */}
      <HeroBanners banners={banners} />

      {/* Categories */}
      <section>
        <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((item) => (
            <Link
              key={item.id}
              href={`/products?category=${item.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md"
            >
              {item.image ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image src={item.image} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" />
                </div>
              ) : null}
              <div className="space-y-2 p-5">
                <p className="text-lg font-semibold">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.productCount} product{item.productCount === 1 ? '' : 's'}
                </p>
                {item.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.subcategories.slice(0, 4).map((sub) => (
                      <span key={sub.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
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

      {/* Best sellers */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Best sellers</h2>
          <Link href="/products" className="text-sm font-semibold text-slate-900 underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Mid banners */}
      {midBanners.length > 0 && (
        <section>
          <BannerCarousel banners={midBanners} variant="mid" />
        </section>
      )}

      {/* New arrivals */}
      <section>
        <h2 className="mb-5 text-2xl font-bold">New arrivals</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.slice(0, 8).map((product) => (
            <ProductCard key={`${product.id}-new`} product={product} />
          ))}
        </div>
      </section>

      <RecentlyViewedSection />

      {/* Footer banners */}
      {footerBanners.length > 0 && (
        <section>
          <BannerCarousel banners={footerBanners} variant="footer" />
        </section>
      )}

      {/* Trust signals */}
      <section className="grid gap-4 md:grid-cols-3">
        {['Fast shipping', 'Easy returns', 'Premium quality'].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold">{item}</p>
            <p className="mt-1 text-sm text-slate-500">Built for conversion-focused ecommerce UX and trust.</p>
          </div>
        ))}
      </section>
    </main>
  )
}
