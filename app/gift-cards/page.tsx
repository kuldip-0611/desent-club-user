'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StoreShell } from '@/modules/shop/components/store-shell'
import { toast } from 'react-hot-toast'
import { Gift, CheckCircle2, CreditCard, Copy, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/services/api/client'
import { loadRazorpayScript, type RazorpaySuccessResponse } from '@/lib/razorpay'

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

const PRESET_AMOUNTS = [500, 1000, 2000, 5000]

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function GiftCardVisual({ code, amount, balance }: { code: string; amount: number; balance: number }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-5 text-white shadow-lg">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <Gift className="h-7 w-7 text-white/80" />
          <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Disent Club</span>
        </div>
        <p className="mt-4 text-2xl font-black">₹{amount.toFixed(0)}</p>
        <p className="text-xs text-white/60">Balance: ₹{balance.toFixed(2)}</p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/15 px-3 py-2">
          <span className="font-mono text-sm font-bold tracking-widest">{code}</span>
          <button onClick={copy} className="ml-2 rounded-lg p-1 hover:bg-white/20">
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-white/70" />}
          </button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'buy' | 'my-cards' | 'check'

export default function GiftCardsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('buy')

  // Purchase form state
  const [amount, setAmount] = useState<number | ''>('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState<GiftCard | null>(null)

  // My cards
  const [cards, setCards] = useState<GiftCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)

  // Check balance
  const [checkCode, setCheckCode] = useState('')
  const [checkResult, setCheckResult] = useState<{ code: string; balance: number; initialAmount: number; expiresAt: string | null } | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (user === null) { router.replace('/login'); return }
    if (user && tab === 'my-cards') {
      setLoadingCards(true)
      apiClient.get<GiftCard[]>('/gift-cards/my')
        .then((res) => setCards(res.data))
        .catch(() => undefined)
        .finally(() => setLoadingCards(false))
    }
  }, [user, router, tab])

  const handlePay = async () => {
    const amtNum = Number(amount)
    if (!amtNum || amtNum < 50) { toast.error('Minimum amount is ₹50'); return }
    if (amtNum > 10000) { toast.error('Maximum amount is ₹10,000'); return }
    if (!recipientEmail.trim()) { toast.error('Recipient email is required'); return }

    setPaying(true)
    try {
      // Step 1: create Razorpay order on backend
      const { data: initData } = await apiClient.post<{
        giftCardId: string
        razorpayOrderId: string
        amount: number
        currency: string
        keyId: string
      }>('/gift-cards/initiate', {
        amount: amtNum,
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        message: message.trim() || undefined,
      })

      // Step 2: open Razorpay checkout
      const loaded = await loadRazorpayScript()
      if (!loaded || !window.Razorpay) {
        toast.error('Could not load payment gateway. Please try again.')
        setPaying(false)
        return
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: initData.keyId,
          amount: initData.amount,
          currency: initData.currency,
          name: 'Disent Club',
          description: `Gift Card · ₹${amtNum} for ${recipientEmail}`,
          order_id: initData.razorpayOrderId,
          prefill: {
            name: user?.name ?? '',
            email: user?.email ?? '',
          },
          theme: { color: '#4f46e5' },
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              // Step 3: verify payment → activate gift card
              const { data: verified } = await apiClient.post<{
                message: string
                code: string
                giftCardId: string
                recipientEmail: string
              }>('/gift-cards/verify-payment', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })

              // Fetch the full gift card to show success UI
              const { data: myCards } = await apiClient.get<GiftCard[]>('/gift-cards/my')
              const newCard = myCards.find((c) => c.id === verified.giftCardId) ?? {
                id: verified.giftCardId,
                code: verified.code,
                initialAmount: amtNum,
                balance: amtNum,
                recipientEmail: verified.recipientEmail,
                isActive: true,
                expiresAt: null,
                createdAt: new Date().toISOString(),
              }
              setSuccess(newCard)
              toast.success(`Gift card sent to ${recipientEmail}!`)
              resolve()
            } catch (err) {
              const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
              toast.error(msg ?? 'Payment verified but failed to activate gift card. Contact support.')
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled.', { icon: 'ℹ️' })
              reject(new Error('dismissed'))
            },
          },
        })

        rzp.on('payment.failed', (response: unknown) => {
          const failed = response as { error?: { description?: string } }
          toast.error(failed?.error?.description ?? 'Payment failed. Please try again.')
          reject(new Error('payment_failed'))
        })

        rzp.open()
      })
    } catch (err) {
      // Dismissed or failed — already toasted
      const e = err as Error
      if (e?.message && e.message !== 'dismissed' && e.message !== 'payment_failed') {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(msg ?? 'Could not initiate payment. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }

  const handleCheck = async () => {
    if (!checkCode.trim()) return
    setChecking(true)
    setCheckResult(null)
    try {
      const { data } = await apiClient.post<{ code: string; balance: number; initialAmount: number; expiresAt: string | null }>(
        '/gift-cards/check', { code: checkCode.trim() })
      setCheckResult(data)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Gift card not found or invalid')
    } finally {
      setChecking(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'buy',      label: 'Send a Gift Card', icon: <Gift className="h-4 w-4" /> },
    { key: 'my-cards', label: 'My Gift Cards',     icon: <CreditCard className="h-4 w-4" /> },
    { key: 'check',    label: 'Check Balance',     icon: <CheckCircle2 className="h-4 w-4" /> },
  ]

  return (
    <StoreShell>
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
            <Gift className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
          <p className="mt-1 text-sm text-slate-500">
            The perfect gift — send to anyone, use on anything at Disent Club.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSuccess(null) }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.key === 'buy' ? 'Send' : t.key === 'my-cards' ? 'Mine' : 'Check'}</span>
            </button>
          ))}
        </div>

        {/* ── BUY TAB ───────────────────────────────────────────────────────── */}
        {tab === 'buy' && !success && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            {/* Amount presets */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Choose amount</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setAmount(p)}
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                      amount === p
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    ₹{p.toLocaleString('en-IN')}
                  </button>
                ))}
                <input
                  type="number"
                  min={50}
                  max={10000}
                  placeholder="Custom ₹"
                  className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-400"
                  value={!PRESET_AMOUNTS.includes(Number(amount)) && amount !== '' ? amount : ''}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Min ₹50 · Max ₹10,000</p>
            </div>

            {/* Recipient */}
            <div className="grid gap-3 sm:grid-cols-2">
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
                <label className="text-xs font-semibold text-slate-600">Recipient Name (optional)</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="e.g. Priya"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Personal Message (optional)</label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
                placeholder="Happy Birthday! Hope you love this."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Gift card preview */}
            {amount && recipientEmail && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-5 text-white">
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                  <Gift className="h-6 w-6 text-white/70" />
                  <p className="mt-3 text-2xl font-black">₹{Number(amount).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-white/70">To: {recipientName || recipientEmail}</p>
                  {message && <p className="mt-2 text-xs italic text-white/60">&ldquo;{message}&rdquo;</p>}
                  <p className="mt-3 font-mono text-sm tracking-widest text-white/40">XXXX-XXXX-XXXX</p>
                </div>
              </div>
            )}

            {/* Payment notice */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
              <span>You will be redirected to Razorpay to complete payment. The gift card is sent only after successful payment.</span>
            </div>

            <button
              disabled={paying || !amount || !recipientEmail}
              onClick={() => void handlePay()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
              ) : (
                <><Gift className="h-4 w-4" /> Pay & Send Gift Card{amount ? ` · ₹${Number(amount).toLocaleString('en-IN')}` : ''}</>
              )}
            </button>
          </div>
        )}

        {/* ── SUCCESS STATE ─────────────────────────────────────────────────── */}
        {tab === 'buy' && success && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Payment successful! Gift card sent.</p>
                <p className="text-sm text-slate-500">An email has been sent to {success.recipientEmail}</p>
              </div>
            </div>
            <GiftCardVisual code={success.code} amount={success.initialAmount} balance={success.balance} />
            <button
              onClick={() => {
                setSuccess(null)
                setAmount('')
                setRecipientEmail('')
                setRecipientName('')
                setMessage('')
              }}
              className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Send another gift card
            </button>
          </div>
        )}

        {/* ── MY CARDS TAB ─────────────────────────────────────────────────── */}
        {tab === 'my-cards' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Gift Cards I&apos;ve Sent</h2>
            {loadingCards ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : cards.length === 0 ? (
              <div className="py-10 text-center">
                <Gift className="mx-auto h-10 w-10 text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">You haven&apos;t sent any gift cards yet.</p>
                <button
                  onClick={() => setTab('buy')}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Send your first gift card
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cards.map((card) => {
                  const isExpired = card.expiresAt ? new Date(card.expiresAt) < new Date() : false
                  const used = card.initialAmount - card.balance
                  const pct = Math.round((used / card.initialAmount) * 100)
                  return (
                    <div key={card.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-bold text-slate-900">{card.code}</p>
                          <p className="mt-0.5 text-xs text-slate-500">To: {card.recipientEmail}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Sent {fmtDate(card.createdAt)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-slate-900">₹{card.balance.toFixed(0)}</p>
                          <p className="text-xs text-slate-400">of ₹{card.initialAmount.toFixed(0)}</p>
                          <span className={`mt-1 inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                            !card.isActive || isExpired ? 'bg-slate-100 text-slate-500'
                            : card.balance <= 0 ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {!card.isActive || isExpired ? 'Inactive' : card.balance <= 0 ? 'Used up' : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">{pct}% used</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CHECK BALANCE TAB ─────────────────────────────────────────────── */}
        {tab === 'check' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Check Gift Card Balance</h2>
            <p className="text-sm text-slate-500">Enter a gift card code to see its remaining balance.</p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono uppercase tracking-widest outline-none focus:border-indigo-400"
                placeholder="XXXX-XXXX-XXXX"
                value={checkCode}
                onChange={(e) => setCheckCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && void handleCheck()}
              />
              <button
                disabled={checking || !checkCode.trim()}
                onClick={() => void handleCheck()}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {checking ? '…' : 'Check'}
              </button>
            </div>
            {checkResult && (
              <>
                <GiftCardVisual
                  code={checkResult.code}
                  amount={checkResult.initialAmount}
                  balance={checkResult.balance}
                />
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Initial Value</span>
                    <span className="font-semibold">₹{checkResult.initialAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Balance Remaining</span>
                    <span className="font-bold text-emerald-700">₹{checkResult.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Expires</span>
                    <span>{checkResult.expiresAt ? fmtDate(checkResult.expiresAt) : 'No expiry'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info cards */}
        <div className="grid gap-3 sm:grid-cols-3 text-center">
          {[
            { icon: '🔒', title: 'Secure Payment', desc: 'Powered by Razorpay' },
            { icon: '✅', title: 'Use at Checkout', desc: 'Apply code to any order' },
            { icon: '📅', title: '1 Year Validity', desc: 'Valid for 365 days' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="text-2xl">{item.icon}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    </StoreShell>
  )
}
