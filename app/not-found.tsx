import Link from 'next/link'
import { Home, ArrowLeft, ShoppingBag, Search } from 'lucide-react'

export const metadata = {
  title: '404 — Page Not Found | Desent Club',
  description: "Sorry, the page you're looking for doesn't exist.",
}

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      {/* Subtle background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-indigo-50 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-violet-50 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-indigo-600"
        >
          <ShoppingBag size={18} />
          Desent Club
        </Link>

        {/* 404 display */}
        <div className="relative mb-6 select-none">
          <span className="bg-gradient-to-b from-slate-100 to-slate-200 bg-clip-text text-[140px] font-black leading-none tracking-tighter text-transparent sm:text-[180px]">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200">
              <Search size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          Page not found
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          We couldn't find the page you're looking for.
          <br className="hidden sm:block" />
          It might have been moved, deleted, or never existed.
        </p>

        {/* CTA buttons */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ShoppingBag size={16} />
            Shop Now
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-10 w-full border-t border-slate-100 pt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Popular pages
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/products', label: 'All Products' },
              { href: '/products?category=men', label: "Men's" },
              { href: '/products?category=women', label: "Women's" },
              { href: '/orders', label: 'My Orders' },
              { href: '/profile', label: 'My Account' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Support note */}
        <p className="mt-8 text-xs text-slate-400">
          Still lost?{' '}
          <a href="mailto:support@desenclub.com" className="font-medium text-indigo-500 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
