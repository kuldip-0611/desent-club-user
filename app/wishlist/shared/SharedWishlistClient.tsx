'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { listProducts } from '@/services/product.service'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
}

export function SharedWishlistClient() {
  const params = useSearchParams()
  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean), [params])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ids.length) { setLoading(false); return }
    listProducts({ ids: ids.join(','), limit: ids.length })
      .then((res) => setProducts((res.items ?? []) as Product[]))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ids])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Shared Wishlist</h1>
        <p className="mt-1 text-sm text-slate-500">Someone shared their Disent Club wishlist with you</p>

        {products.length === 0 ? (
          <div className="mt-10 text-center text-slate-400">No products found</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">₹{product.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
