'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, RETURN_STATUS_LABEL } from '@/lib/order-status'
import { listMyOrders, type UserOrder } from '@/services/order.service'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const STATUS_FILTERS = [
  { label: 'All',        value: '' },
  { label: 'Pending',    value: 'PENDING' },
  { label: 'Confirmed',  value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped',    value: 'SHIPPED' },
  { label: 'Delivered',  value: 'DELIVERED' },
  { label: 'Cancelled',  value: 'CANCELLED' },
]

export const OrdersPageModule = () => {
  const searchParams = useSearchParams()
  const { user, requireAuth, isAuthReady } = useAuthGuard()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const placed = searchParams.get('placed')
    if (placed) {
      toast.success('Order placed successfully!')
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    listMyOrders(1, 100)
      .then((res) => setOrders(res.items))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Could not load orders')
      })
      .finally(() => setLoading(false))
  }, [user])

  const filteredOrders = orders.filter((order) => {
    if (activeFilter && order.status !== activeFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const matchesId = order.id.toLowerCase().includes(q)
      const matchesProduct = order.items.some((i) => i.product.name.toLowerCase().includes(q))
      if (!matchesId && !matchesProduct) return false
    }
    return true
  })

  if (!isAuthReady) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          Loading orders…
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="mt-2 text-sm text-slate-500">Please login to access order history.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => {})}>
            Login
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>

      {/* Search */}
      <div className="mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID or product name…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-white"
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === f.value
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
            {f.value !== '' && (
              <span className="ml-1 opacity-60">
                ({orders.filter((o) => o.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <h3 className="mb-1.5 text-lg font-semibold text-slate-700 dark:text-slate-300">No orders yet</h3>
          <p className="mb-6 max-w-xs text-sm text-slate-500">You haven&apos;t placed any orders yet. Start shopping and your orders will appear here.</p>
          <a href="/products" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            Shop Now
          </a>
        </div>
      ) : filteredOrders.length === 0 && orders.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <p className="font-medium text-slate-700 dark:text-slate-300">No orders match your filter</p>
          <button onClick={() => { setActiveFilter(''); setSearch('') }} className="mt-3 text-sm text-indigo-600 underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const returnStatus = order.returnRequests?.[0]?.status ?? order.actions?.returnStatus
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-500">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {returnStatus ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        {RETURN_STATUS_LABEL[returnStatus] ?? returnStatus}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {order.items.map((item) => {
                    const productHref = item.product.slug ? `/products/${item.product.slug}` : null
                    return (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      {item.product.images[0] ? (
                        productHref ? (
                          <Link href={productHref}>
                            <img
                              src={item.product.images[0].path}
                              alt={item.product.name}
                              className="h-12 w-12 rounded-lg object-cover hover:opacity-80 transition"
                            />
                          </Link>
                        ) : (
                          <img
                            src={item.product.images[0].path}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        {productHref ? (
                          <Link href={productHref} className="truncate font-medium hover:text-indigo-600 hover:underline block">
                            {item.product.name}
                          </Link>
                        ) : (
                          <p className="truncate font-medium">{item.product.name}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                          {[item.size, item.color].some(Boolean) ? ' · ' : ''}
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">Rs. {item.total}</p>
                    </li>
                    )
                  })}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
                  <span className="text-slate-500">
                    Payment: {order.payment?.status === 'PAID' ? 'Paid' : 'Pending'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">Rs. {order.total}</span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-lg border border-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-900"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
