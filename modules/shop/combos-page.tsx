'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Layers, ArrowRight, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { getActiveCombos, type Combo } from '@/services/combo.service'
import { useCartStore } from '@/store/cart-store'
import toast from 'react-hot-toast'

// ── helpers ──────────────────────────────────────────────────────────────────

const imgSrc = (path: string | null) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? ''}${path}`
}

const originalTotal = (combo: Combo) =>
  combo.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)

// ── Combo card ────────────────────────────────────────────────────────────────

function ComboCard({ combo }: { combo: Combo }) {
  const addLine = useCartStore((s) => s.addLine)
  const [expanded, setExpanded] = useState(false)

  const total = originalTotal(combo)
  const comboPrice = Number(combo.price)
  const savings = total - comboPrice
  const savingsPct = total > 0 ? Math.round((savings / total) * 100) : 0

  const handleAddToCart = () => {
    // Add each combo product as a separate cart line tagged with comboId
    let addedCount = 0
    for (const item of combo.items) {
      const p = item.product
      const v = item.variant
      // Price per item = proportional share of combo price
      const unitPrice = comboPrice / combo.items.reduce((s, i) => s + i.quantity, 0)

      for (let q = 0; q < item.quantity; q++) {
        addLine({
          productId: p.id,
          variantId: v?.id ?? '',
          name: p.name,
          slug: p.slug ?? '',
          image: imgSrc(p.images?.[0]?.path ?? null) ?? '',
          size: v?.size ?? '',
          color: v?.color ?? '',
          unitPrice: Math.round(unitPrice * 100) / 100,
          quantity: 1,
          comboId: combo.id,
          comboName: combo.name,
        })
        addedCount++
      }
    }
    toast.success(`${combo.name} added to cart`)
  }

  const heroImg = combo.image
    ? imgSrc(combo.image)
    : imgSrc(combo.items[0]?.product.images?.[0]?.path ?? null)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      {/* Hero image strip */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {heroImg ? (
          <Image src={heroImg} alt={combo.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 100vw, 50vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Layers size={40} className="text-slate-300" />
          </div>
        )}
        {savingsPct > 0 && (
          <div className="absolute top-3 left-3 rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-white">
            {savingsPct}% OFF
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
          COMBO
        </div>
      </div>

      {/* Product thumbnails strip */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-1">
        {combo.items.map((item) => {
          const src = imgSrc(item.product.images?.[0]?.path ?? null)
          return (
            <div key={item.id} className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {src ? (
                <Image src={src} alt={item.product.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <Package size={12} className="text-slate-400" />
                </div>
              )}
              {item.quantity > 1 && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">
                  ×{item.quantity}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">{combo.name}</h3>
        {combo.description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{combo.description}</p>
        )}

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">₹{comboPrice.toFixed(2)}</span>
          {savings > 0 && (
            <>
              <span className="text-sm text-slate-400 line-through">₹{total.toFixed(2)}</span>
              <span className="text-sm font-medium text-green-600">Save ₹{savings.toFixed(0)}</span>
            </>
          )}
        </div>

        {/* Included products toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide' : 'Show'} {combo.items.length} included products
        </button>

        {expanded && (
          <ul className="mt-2 space-y-1.5">
            {combo.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <Tag size={11} className="flex-shrink-0 text-violet-500" />
                <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{item.product.name}</span>
                {item.variant && (
                  <span className="text-[10px] text-slate-400">{item.variant.size}{item.variant.color ? `/${item.variant.color}` : ''}</span>
                )}
                <span className="text-xs font-medium text-slate-500">×{item.quantity}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 active:scale-95"
        >
          <ShoppingCart size={16} />
          Add Combo to Cart
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveCombos().then((data) => {
      setCombos(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={22} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Combo Deals</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Handpicked combinations at special prices — save more when you buy together
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-100 animate-pulse dark:bg-slate-800" />
          ))}
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-24 dark:border-slate-700">
          <Layers size={48} className="mb-4 text-slate-300" />
          <p className="text-lg font-semibold text-slate-500">No combos available right now</p>
          <p className="mt-1 text-sm text-slate-400">Check back soon for exclusive combo deals</p>
          <Link href="/products" className="mt-6 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700">
            Browse Products <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </div>
  )
}
