'use client'

import Image from 'next/image'
import Link from 'next/link'
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

  return (
    <Modal open={modal === 'quickView'} onClose={close} className="max-w-2xl p-0">
      {product ? (
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5]">
            <Image src={product.images[0]} alt={product.name} fill className="rounded-l-2xl object-cover" />
          </div>
          <div className="space-y-3 p-5">
            <h3 className="text-xl font-bold">{product.name}</h3>
            <p className="text-sm text-slate-600">{product.description}</p>
            <p className="text-lg font-semibold">Rs. {product.price}</p>
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
                    image: product.images[0],
                    size: v.size,
                    color: v.colorName,
                    unitPrice: product.price,
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
