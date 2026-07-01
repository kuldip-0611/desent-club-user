'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useProductsQuery } from '@/hooks/query/use-products-query'
import { useUiStore } from '@/store/ui-store'
import { useCartStore } from '@/store/cart-store'

export const QuickViewModal = () => {
  const modal = useUiStore((s) => s.modal)
  const payload = useUiStore((s) => s.modalPayload)
  const close = useUiStore((s) => s.closeModal)
  const addLine = useCartStore((s) => s.addLine)
  const { data } = useProductsQuery({ limit: 50 })
  const product = data?.items.find((row) => row.id === payload?.productId)
  // discountPercent is passed directly from the product card via modal payload — avoids re-deriving
  const discountPercent = payload?.discountPercent ? Number(payload.discountPercent) : null
  const salePrice = discountPercent && product
    ? Math.round(product.price * (1 - discountPercent / 100))
    : null

  const [activeIdx, setActiveIdx] = useState(0)

  const images: string[] = product?.images ?? []
  const total = images.length

  const prev = () => setActiveIdx((i) => (i - 1 + total) % total)
  const next = () => setActiveIdx((i) => (i + 1) % total)

  // Reset index when product changes
  const productId = product?.id
  if (productId && activeIdx >= total) setActiveIdx(0)

  return (
    <Modal open={modal === 'quickView'} onClose={close} className="max-w-2xl p-0">
      {product ? (
        <div className="grid md:grid-cols-2">
          {/* ── Image panel ── */}
          <div className="flex flex-col gap-2 p-3">
            {/* Main image */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100">
              {images[activeIdx] && (
                <Image
                  key={activeIdx}
                  src={images[activeIdx]}
                  alt={`${product.name} — image ${activeIdx + 1}`}
                  fill
                  className="object-cover transition-opacity duration-200"
                  sizes="(max-width: 768px) 100vw, 340px"
                />
              )}

              {/* Prev / Next arrows — only shown when there's more than one image */}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm transition hover:bg-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm transition hover:bg-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {/* Dot indicator */}
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIdx(i)}
                        aria-label={`Image ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {total > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      i === activeIdx
                        ? 'border-slate-900'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="48px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="space-y-3 p-5">
            <h3 className="text-xl font-bold">{product.name}</h3>
            <p className="text-sm text-slate-600">{product.description}</p>
            <div className="flex items-center gap-2">
              {discountPercent && (
                <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
                  ⚡ {discountPercent}% off
                </span>
              )}
              <p className="text-lg font-bold">&#8377;{salePrice ?? product.price}</p>
              {salePrice && (
                <p className="text-sm text-slate-400 line-through">&#8377;{product.price}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  const v = product.variants[0]
                  addLine({
                    productId: product.id,
                    variantId: v.id,
                    categoryId: product.category.id,
                    name: product.name,
                    slug: product.slug,
                    image: images[0] ?? '',
                    size: v.size,
                    color: v.colorName,
                    unitPrice: salePrice ?? product.price,
                    quantity: 1,
                  })
                  close()
                }}
              >
                Add to cart
              </Button>
              <Link href={`/products/${product.slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Full details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
