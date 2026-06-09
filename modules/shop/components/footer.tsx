'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useShopCategoriesQuery } from '@/hooks/query/use-products-query'

export const Footer = () => {
  const { data: categories = [] } = useShopCategoriesQuery()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Desent Club logo" width={28} height={28} className="rounded-md" />
            <p className="text-lg font-black">DESENTCLUB</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">Premium fashion essentials inspired by global street and sport culture.</p>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Shop</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {categories.slice(0, 4).map((category) => (
              <li key={category.id}>
                <Link href={`/products?category=${category.slug}`}>{category.name}</Link>
              </li>
            ))}
            <li><Link href="/products">All products</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Account</p>
          <ul className="space-y-1 text-sm text-slate-600">
            <li><Link href="/profile">Profile</Link></li>
            <li><Link href="/orders">Orders</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Newsletter</p>
          <p className="text-sm text-slate-600">Get first access to drops and offers.</p>
        </div>
      </div>
    </footer>
  )
}
