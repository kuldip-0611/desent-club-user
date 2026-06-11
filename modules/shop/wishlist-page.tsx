'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ProductCard } from '@/modules/shop/components/product-card'
import { useProductsQuery } from '@/hooks/query/use-products-query'
import { useWishlistStore } from '@/store/wishlist-store'

export const WishlistPageModule = () => {
  const ids = useWishlistStore((s) => s.productIds)
  const { data } = useProductsQuery({ limit: 50 })
  const items = useMemo(() => (data?.items ?? []).filter((item) => ids.includes(item.id)), [data?.items, ids])
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (ids.length === 0) {
      toast.error('Your wishlist is empty')
      return
    }
    setSharing(true)
    const shareUrl = `${window.location.origin}/wishlist/shared?ids=${ids.join(',')}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Desent Club Wishlist',
          text: 'Check out my wishlist on Desent Club!',
          url: shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Wishlist link copied to clipboard!')
      }
    } catch {
      // user cancelled share
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        {items.length > 0 && (
          <button
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            🔗 Share Wishlist
          </button>
        )}
      </div>
      {items.length === 0 ? <p className="text-sm text-slate-500">No saved products yet.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </main>
  )
}
