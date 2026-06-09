'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ProductCard } from '@/modules/shop/components/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useShopHomeQuery } from '@/hooks/query/use-products-query'

export const HomePageModule = () => {
  const { data, isLoading } = useShopHomeQuery()
  const banners = data?.banners ?? []
  const categories = data?.categories ?? []
  const bestSellers = data?.bestSellers ?? []
  const newArrivals = data?.newest ?? []

  return (
    <main className="mx-auto max-w-7xl space-y-14 px-4 py-8 sm:px-6">
      <section className="grid gap-4 md:grid-cols-2">
        {(banners.length ? banners : []).slice(0, 2).map((banner, index) => (
          <motion.article
            key={banner.image}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="relative aspect-[5/3] overflow-hidden rounded-3xl"
          >
            <Image src={banner.image} alt={banner.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-black/10 p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em]">New season drop</p>
              <h1 className="mt-3 max-w-sm text-3xl font-black leading-tight">{banner.title}</h1>
              <p className="mt-2 max-w-sm text-sm text-slate-100">{banner.subtitle}</p>
              <Link href={banner.href} className="mt-6 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900">
                Shop now
              </Link>
            </div>
          </motion.article>
        ))}
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold">Trending categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((item) => (
            <Link key={item.id} href={`/products?category=${item.slug}`} className="rounded-2xl border border-slate-200 bg-white p-6 hover:bg-slate-50">
              <p className="text-lg font-semibold">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">Curated with premium silhouettes.</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Best sellers</h2>
          <Link href="/products" className="text-sm font-semibold text-indigo-600">View all</Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-80" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-slate-900 px-8 py-10 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Limited offer</p>
        <h3 className="mt-2 text-3xl font-black">Up to 40% off on selected performance styles</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Grab signature fits from our active and streetwear collections while stock lasts.</p>
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-bold">New arrivals</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.slice(0, 8).map((product) => <ProductCard key={`${product.id}-new`} product={product} />)}
        </div>
      </section>

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
