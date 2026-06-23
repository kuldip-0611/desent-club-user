'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type AppNotification,
} from '@/services/notification.service'
import { useAuthStore } from '@/store/auth-store'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { cn } from '@/utils/cn'

const TYPE_ICON: Record<string, string> = {
  order: '📦',
  coupon: '🏷️',
  shipping: '🚚',
  announcement: '📣',
  offer: '🎁',
  general: '🔔',
}

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const NotificationBell = ({ isDark }: { isDark?: boolean }) => {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const { pushState, requestPush } = usePushNotifications()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: getUnreadCount,
    enabled: !!user,
    refetchInterval: 60_000,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: !!user && open,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      void qc.invalidateQueries({ queryKey: ['notif-unread'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      void qc.invalidateQueries({ queryKey: ['notif-unread'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      void qc.invalidateQueries({ queryKey: ['notif-unread'] })
    },
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full transition-colors',
          isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100',
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border shadow-xl sm:w-96',
            isDark
              ? 'border-slate-700 bg-slate-900 text-slate-100'
              : 'border-slate-200 bg-white text-slate-900',
          )}
        >
          {/* Header */}
          <div className={cn('flex items-center justify-between border-b px-4 py-3', isDark ? 'border-slate-700' : 'border-slate-100')}>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  title="Mark all read"
                  onClick={() => readAllMutation.mutate()}
                  className={cn('rounded-lg p-1.5 transition-colors', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn('rounded-lg p-1.5 transition-colors', isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Push notification enable banner */}
          {pushState === 'idle' && (
            <div className={cn('flex items-center gap-3 border-b px-4 py-3', isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-100 bg-slate-50')}>
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isDark ? 'bg-white' : 'bg-slate-900')}>
                <Bell className={cn('h-4 w-4', isDark ? 'text-slate-900' : 'text-white')} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">Enable push notifications</p>
                <p className={cn('text-[11px]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Get instant alerts for orders &amp; offers
                </p>
              </div>
              <button
                type="button"
                onClick={requestPush}
                className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Enable
              </button>
            </div>
          )}

          {pushState === 'loading' && (
            <div className={cn('flex items-center gap-2 border-b px-4 py-3 text-xs', isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500')}>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Requesting permission…
            </div>
          )}

          {pushState === 'denied' && (
            <div className={cn('flex items-center gap-2 border-b px-4 py-2.5 text-xs', isDark ? 'border-slate-700 text-slate-500' : 'border-slate-100 text-slate-400')}>
              <BellOff className="h-3.5 w-3.5 shrink-0 text-red-400" />
              Push notifications blocked — enable in browser settings
            </div>
          )}

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-400">We'll notify you about orders and offers</p>
              </div>
            ) : (
              notifications.map((n: AppNotification) => (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-3 border-b px-4 py-3 transition-colors',
                    isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50',
                    !n.isRead && (isDark ? 'bg-slate-800/40' : 'bg-slate-50'),
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-base dark:bg-slate-800">
                    {TYPE_ICON[n.type] ?? '🔔'}
                  </span>
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => !n.isRead && readMutation.mutate(n.id)}
                  >
                    <p className={cn(
                      'text-sm font-semibold leading-snug',
                      !n.isRead
                        ? (isDark ? 'text-white' : 'text-slate-900')
                        : (isDark ? 'text-slate-300' : 'text-slate-600'),
                    )}>
                      {n.title}
                    </p>
                    <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>{n.body}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{formatTime(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.isRead && (
                      <button
                        type="button"
                        title="Mark read"
                        onClick={() => readMutation.mutate(n.id)}
                        className={cn('rounded p-1', isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                      >
                        <Check className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteMutation.mutate(n.id)}
                      className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                  {!n.isRead && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-slate-900 dark:bg-white" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
