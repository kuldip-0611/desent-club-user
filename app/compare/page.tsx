'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { listProducts } from '@/services/product.service';
import type { Product } from '@/types/product';

const ROWS = [
  { label: 'Price', key: 'price', render: (v: unknown) => `₹${(v as number).toLocaleString()}` },
  { label: 'Rating', key: 'rating', render: (v: unknown) => `${v as number} ★` },
  { label: 'Reviews', key: 'reviewsCount', render: (v: unknown) => String(v) },
  { label: 'Category', key: 'category', render: (v: unknown) => (v as { name: string }).name },
  { label: 'Audience', key: 'audience', render: (v: unknown) => String(v) },
];

export default function ComparePage() {
  const params = useSearchParams();
  const ids = useMemo(() => (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, 3), [params]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    listProducts({ limit: 50 })
      .then((res) => {
        setProducts((res.items ?? []).filter((p) => ids.includes(p.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ids]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    );
  }

  if (!ids.length) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-medium text-slate-700">No products to compare</p>
        <p className="text-sm text-slate-500">Add ?ids=id1,id2,id3 to the URL to compare products</p>
        <Link href="/products" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
          Browse Products
        </Link>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Compare Products</h1>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px]">
            {/* Product images + names */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-32 p-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Feature
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-4 text-left">
                    <Link href={`/products/${p.slug}`} className="group block">
                      <div className="relative mx-auto mb-2 aspect-square w-24 overflow-hidden rounded-lg bg-slate-100">
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover transition group-hover:scale-105"
                            sizes="96px"
                          />
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-black">
                        {p.name}
                      </p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-slate-50 last:border-0">
                  <td className="p-4 text-xs font-semibold text-slate-500">{row.label}</td>
                  {products.map((p) => {
                    const val = p[row.key as keyof Product];
                    return (
                      <td key={p.id} className="p-4 text-sm font-medium text-slate-800">
                        {val !== undefined && val !== null ? row.render(val) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Sizes */}
              <tr className="border-b border-slate-50">
                <td className="p-4 text-xs font-semibold text-slate-500">Sizes</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(p.variants.map((v) => v.size))].map((s) => (
                        <span key={s} className="rounded border border-slate-200 px-1.5 py-0.5 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Colors */}
              <tr>
                <td className="p-4 text-xs font-semibold text-slate-500">Colors</td>
                {products.map((p) => (
                  <td key={p.id} className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(p.variants.map((v) => v.colorHex))].map((hex) => (
                        <span
                          key={hex}
                          className="h-5 w-5 rounded-full border border-slate-200"
                          style={{ background: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center gap-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Buy {p.name.split(' ')[0]}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
