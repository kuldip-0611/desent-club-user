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

export const OrdersPageModule = () => {
  const searchParams = useSearchParams()
  const { user, requireAuth, isAuthReady } = useAuthGuard()
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const placed = searchParams.get('placed')
    if (placed) {
      toast.success('Order placed successfully!')
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    listMyOrders()
      .then((res) => setOrders(res.items))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Could not load orders')
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!isAuthReady) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading orders…
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
      <h1 className="mb-3 text-2xl font-bold">Orders</h1>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          No orders yet. Place your first order from checkout.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const returnStatus = order.returnRequests?.[0]?.status ?? order.actions?.returnStatus
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
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
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0].path}
                          alt={item.product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.product.name}</p>
                        <p className="text-xs text-slate-500">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                          {[item.size, item.color].some(Boolean) ? ' · ' : ''}
                          Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">Rs. {item.total}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">
                    Payment: {order.payment?.status === 'PAID' ? 'Paid' : 'Pending'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">Rs. {order.total}</span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
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
