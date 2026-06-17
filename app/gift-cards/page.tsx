'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Gift } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/services/api/client'
import { Button } from '@/components/ui/button'

type GiftCard = {
  id: string
  code: string
  initialAmount: number
  balance: number
  recipientEmail: string
  recipientName?: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export default function GiftCardsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)

  // Purchase form
  const [amount, setAmount] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [purchasing, setPurchasing] = useState(false)

  // Check card form
  const [checkCode, setCheckCode] = useState('')
  const [checkResult, setCheckResult] = useState<{ code: string; balance: number; expiresAt: string | null } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    apiClient.get<GiftCard[]>('/gift-cards/my')
      .then((res) => setCards(res.data))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [user, router])

  const handlePurchase = async () => {
    const amtNum = parseFloat(amount)
    if (isNaN(amtNum) || amtNum < 50) { toast.error('Minimum amount is ₹50'); return }
    if (!recipientEmail.trim()) { toast.error('Recipient email is required'); return }
    setPurchasing(true)
    try {
      const { data } = await apiClient.post<GiftCard>('/gift-cards/purchase', {
        amount: amtNum,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        message: message.trim() || undefined,
      })
      setCards((prev) => [data, ...prev])
      toast.success(`Gift card sent to ${recipientEmail}!`)
      setAmount('')
      setRecipientEmail('')
      setRecipientName('')
      setMessage('')
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Could not purchase gift card')
    } finally {
      setPurchasing(false)
    }
  }

  const handleCheck = async () => {
    if (!checkCode.trim()) return
    setChecking(true)
    setCheckResult(null)
    try {
      const { data } = await apiClient.post<{ code: string; balance: number; expiresAt: string | null }>('/gift-cards/check', { code: checkCode.trim() })
      setCheckResult(data)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Gift card not found')
    } finally {
      setChecking(false)
    }
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
          <p className="mt-1 text-sm text-slate-500">Send a gift card to someone special or check your balance.</p>
        </div>

        {/* Purchase form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" /> Send a Gift Card
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Amount (₹)</label>
              <input
                type="number"
                min={50}
                max={10000}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Recipient Email *</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="friend@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Recipient Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="e.g. Priya"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Personal Message</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="Happy Birthday!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={purchasing || !amount || !recipientEmail}
            onClick={() => void handlePurchase()}
          >
            {purchasing ? 'Sending…' : `Send Gift Card${amount ? ` (₹${amount})` : ''}`}
          </Button>
        </div>

        {/* Check balance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Check Gift Card Balance</h2>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-indigo-400"
              placeholder="XXXX-XXXX-XXXX"
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
            />
            <Button
              variant="outline"
              disabled={checking || !checkCode.trim()}
              onClick={() => void handleCheck()}
            >
              {checking ? '…' : 'Check'}
            </Button>
          </div>
          {checkResult && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
              <p className="font-mono font-bold text-indigo-900">{checkResult.code}</p>
              <p className="mt-1 text-2xl font-black text-indigo-700">₹{checkResult.balance.toFixed(2)}</p>
              <p className="text-xs text-indigo-500">
                {checkResult.expiresAt
                  ? `Valid until ${new Date(checkResult.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'No expiry'}
              </p>
            </div>
          )}
        </div>

        {/* My gift cards */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Gift Cards I&apos;ve Sent</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-slate-400">You haven&apos;t sent any gift cards yet.</p>
          ) : (
            <ul className="space-y-3">
              {cards.map((card) => (
                <li key={card.id} className="rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono font-bold text-slate-900 text-sm">{card.code}</p>
                    <p className="text-xs text-slate-500 mt-0.5">To: {card.recipientEmail}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(card.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">₹{card.balance.toFixed(0)}</p>
                    <p className="text-xs text-slate-400">of ₹{card.initialAmount.toFixed(0)}</p>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${card.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {card.isActive ? 'Active' : 'Used'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
