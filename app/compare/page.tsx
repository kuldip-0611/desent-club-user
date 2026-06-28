'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, X } from 'lucide-react';
import { listProducts } from '@/services/product.service';
import { useCartStore } from '@/store/cart-store';
import { setCompareIds } from '@/hooks/use-compare';
import type { Product } from '@/types/product';

const AUDIENCE_LABEL: Record<string, string> = {
  MEN: 'Men',
  WOMEN: 'Women',
  UNISEX: 'Unisex',
}

export default function ComparePage() {
  return <Suspense><ComparePageInner /></Suspense>
}

function ComparePageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, 3), [params]);
  const idsKey = ids.join(',');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addLine = useCartStore((s) => s.addLine);

  // Keep the shared compare selection in sync with the URL (e.g. shared links)
  useEffect(() => {
    setCompareIds(ids);
  }, [idsKey]);

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    listProducts({ ids: idsKey, limit: ids.length })
      .then((res) => {
        // Preserve the user's comparison order
        const map = new Map((res.items ?? []).map((p) => [p.id, p]))
        setProducts(ids.map((id) => map.get(id)).filter(Boolean) as Product[])
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [idsKey]);

  const removeProduct = (id: string) => {
    const remaining = ids.filter((i) => i !== id);
    // Update the shared selection so product listings reflect the change immediately
    setCompareIds(remaining);
    if (remaining.length) {
      router.replace(`/compare?ids=${remaining.join(',')}`);
    } else {
      router.replace('/products');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    );
  }

  if (!ids.length || products.length === 0) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <span className="text-4xl">⚖️</span>
        <p className="text-lg font-semibold text-slate-800">No products to compare</p>
        <p className="text-sm text-slate-500">Browse products and hit the compare icon to add them here.</p>
        <Link href="/products" className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          Browse Products
        </Link>
      </section>
    );
  }

  const cols = products.length;

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          onClick={() => router.push('/products')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </button>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compare Products</h1>
            <p className="mt-1 text-sm text-slate-500">Side-by-side comparison of {cols} product{cols > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setCompareIds([]); router.push('/products'); }}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            Clear all
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full" style={{ minWidth: `${220 + cols * 200}px` }}>

            {/* ── Product header row ── */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-36 bg-slate-50 p-5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400" />
                {products.map((p) => (
                  <th key={p.id} className="p-5 text-left align-top">
                    <div className="relative">
                      {/* Remove button */}
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600 transition"
                        title="Remove from compare"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <Link href={`/products/${p.slug}`} className="group block">
                        <div className="relative mb-3 aspect-square w-28 overflow-hidden rounded-xl bg-slate-100">
                          {p.images[0] && (
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover transition duration-300 group-hover:scale-105"
                              sizes="112px"
                            />
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-black leading-snug">
                          {p.name}
                        </p>
                      </Link>

                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-lg font-bold text-slate-900">₹{Number(p.price).toLocaleString('en-IN')}</span>
                        {p.compareAtPrice && (
                          <span className="text-xs text-slate-400 line-through">₹{Number(p.compareAtPrice).toLocaleString('en-IN')}</span>
                        )}
                      </div>

                      {/* Add to cart */}
                      <button
                        onClick={() => {
                          const v = p.variants[0];
                          if (!v) return;
                          addLine({
                            productId: p.id,
                            variantId: v.id,
                            categoryId: p.category.id,
                            name: p.name,
                            slug: p.slug,
                            image: p.images[0],
                            size: v.size,
                            color: v.colorName,
                            unitPrice: p.price,
                            quantity: 1,
                          });
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Add to cart
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ── Rating ── */}
              <CompareRow label="Rating" alternate>
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{p.rating}</span>
                      <span className="text-yellow-400">★</span>
                      <span className="text-xs text-slate-400">({p.reviewsCount})</span>
                    </div>
                  </td>
                ))}
              </CompareRow>

              {/* ── Category ── */}
              <CompareRow label="Category">
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-sm font-medium text-slate-700">
                    {p.category.name}
                    {p.subcategory && (
                      <span className="ml-1.5 text-xs text-slate-400">/ {p.subcategory.name}</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              {/* ── Audience ── */}
              <CompareRow label="Audience" alternate>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {AUDIENCE_LABEL[p.audience] ?? p.audience}
                    </span>
                  </td>
                ))}
              </CompareRow>

              {/* ── Materials ── */}
              <CompareRow label="Materials">
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    {p.materials && p.materials.length > 0 ? (
                      <div className="space-y-1">
                        {p.materials.map((m) => (
                          <div key={m.name} className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 max-w-[80px] overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${m.percent ?? 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">
                              {m.name}{m.percent != null ? ` ${m.percent}%` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              {/* ── Sizes ── */}
              <CompareRow label="Sizes" alternate>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(p.variants.map((v) => v.size))].map((s) => (
                        <span key={s} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </CompareRow>

              {/* ── Colors ── */}
              <CompareRow label="Colors">
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {[...new Map(p.variants.map((v) => [v.colorHex, v])).values()].map((v) => (
                        <div key={v.colorHex} className="flex flex-col items-center gap-0.5">
                          <span
                            className="h-5 w-5 rounded-full border-2 border-white shadow"
                            style={{ background: v.colorHex }}
                            title={v.colorName}
                          />
                          <span className="text-[9px] text-slate-500 max-w-[40px] truncate">{v.colorName}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </CompareRow>

              {/* ── Tags ── */}
              <CompareRow label="Tags" alternate>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {p.tags.length > 0 ? p.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {tag}
                        </span>
                      )) : <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                ))}
              </CompareRow>

              {/* ── Availability ── */}
              <CompareRow label="Stock">
                {products.map((p) => {
                  const total = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <td key={p.id} className="p-4">
                      {total === 0 ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Out of stock</span>
                      ) : total <= 5 ? (
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">Only {total} left</span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">In stock</span>
                      )}
                    </td>
                  );
                })}
              </CompareRow>
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-slate-400">
          Click a product name to view full details · Use the ✕ to remove from comparison
        </p>
      </div>
    </section>
  );
}

function CompareRow({
  label,
  alternate,
  children,
}: {
  label: string
  alternate?: boolean
  children: React.ReactNode
}) {
  return (
    <tr className={alternate ? 'bg-slate-50/60' : ''}>
      <td className="border-r border-slate-100 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      </td>
      {children}
    </tr>
  );
}
