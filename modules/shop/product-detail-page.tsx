'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ProductCard } from '@/modules/shop/components/product-card'
import { Button } from '@/components/ui/button'
import { useProductQuery, useRelatedProductsQuery } from '@/hooks/query/use-products-query'
import { useCartStore } from '@/store/cart-store'
import type { ProductVariant } from '@/types/product'

type ProductDetailPageProps = {
  slug: string
}

export const ProductDetailPageModule = ({ slug }: ProductDetailPageProps) => {
  const addLine = useCartStore((s) => s.addLine)
  const { data: product, isLoading } = useProductQuery(slug)
  const { data: related } = useRelatedProductsQuery(product?.slug)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const variant = useMemo(() => selectedVariant ?? product?.variants[0] ?? null, [selectedVariant, product?.variants])
  const displayImages = useMemo(() => {
    if (!product) return []
    if (!variant) return product.images
    const key = variant.colorName.toLowerCase()
    return product.imagesByColor?.[key] ?? product.images
  }, [product, variant])

  useEffect(() => {
    setActiveImage(0)
  }, [variant?.id])

  if (isLoading || !product) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">Loading product...</div>
  }

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <Image src={displayImages[activeImage] ?? displayImages[0]} alt={product.name} fill className="object-cover transition duration-300 hover:scale-105" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {displayImages.map((img, idx) => (
              <button
                key={img}
                className={`relative aspect-square overflow-hidden rounded-xl border ${idx === activeImage ? 'border-indigo-600' : 'border-slate-200'}`}
                onClick={() => setActiveImage(idx)}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black">{product.name}</h1>
          <p className="text-sm text-slate-600">{product.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">Rs. {product.price}</span>
            {product.compareAtPrice ? <span className="text-sm text-slate-400 line-through">Rs. {product.compareAtPrice}</span> : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Select variant</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedVariant(item)}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    variant?.id === item.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'
                  }`}
                >
                  {item.size} · {item.colorName}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-500">Stock: {variant?.stock ?? 0} units</p>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => {
                if (!variant) return
                addLine({
                  productId: product.id,
                  variantId: variant.id,
                  name: product.name,
                  slug: product.slug,
                  image: displayImages[0] ?? product.images[0],
                  size: variant.size,
                  color: variant.colorName,
                  unitPrice: product.price,
                  quantity: 1,
                })
              }}
            >
              Add to cart
            </Button>
            <Button variant="outline">Buy now</Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Related products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(related ?? []).map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
