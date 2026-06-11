'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, MessageCircle } from 'lucide-react'
import { useShopCategoriesQuery } from '@/hooks/query/use-products-query'
import {
  SUPPORT_EMAIL,
  supportMailtoHref,
  supportWhatsAppHref,
} from '@/constants/support'

export const Footer = () => {
  const { data: categories = [] } = useShopCategoriesQuery()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand — spans 2 cols on lg */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Image src="/icon.png" alt="Desent Club logo" width={28} height={28} className="rounded-md" />
              <p className="text-lg font-black tracking-tight">DESENTCLUB</p>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
              Premium fashion essentials inspired by global street and sport culture.
            </p>

            {/* Contact info */}
            <div className="mt-5 space-y-2.5">
              <a
                href={supportMailtoHref}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Mail size={15} />
                {SUPPORT_EMAIL}
              </a>
              <a
                href={supportWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <MessageCircle size={15} />
                WhatsApp Support
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Shop</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link href={`/products?category=${category.slug}`} className="hover:text-indigo-600 transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="hover:text-indigo-600 transition-colors">All Products</Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Account</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/profile" className="hover:text-indigo-600 transition-colors">My Profile</Link></li>
              <li><Link href="/orders" className="hover:text-indigo-600 transition-colors">My Orders</Link></li>
              <li><Link href="/wishlist" className="hover:text-indigo-600 transition-colors">Wishlist</Link></li>
              <li><Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Help & Support</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/support" className="hover:text-indigo-600 transition-colors">Help Centre</Link></li>
              <li><Link href="/support#faq" className="hover:text-indigo-600 transition-colors">FAQs</Link></li>
              <li><Link href="/support#shipping" className="hover:text-indigo-600 transition-colors">Shipping Info</Link></li>
              <li>
                <a href={supportMailtoHref} className="hover:text-indigo-600 transition-colors">
                  Email Us
                </a>
              </li>
              <li>
                <a
                  href={supportWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition-colors"
                >
                  WhatsApp Chat
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Desent Club. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <Mail size={12} />
            <a href={supportMailtoHref} className="hover:text-indigo-500 transition-colors">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
