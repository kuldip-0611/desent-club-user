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
          title: 'My Disent Club Wishlist',
          text: 'Check out my wishlist on Disent Club!',
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
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            🔗 Share Wishlist
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <h3 className="mb-1.5 text-lg font-semibold text-slate-700 dark:text-slate-300">Your wishlist is empty</h3>
          <p className="mb-6 max-w-xs text-sm text-slate-500">Save the pieces you love by tapping the heart icon on any product.</p>
          <a href="/shop" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            Discover Products
          </a>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </main>
  )
}
