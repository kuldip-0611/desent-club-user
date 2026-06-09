'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { featuredProducts } from '@/src/data/home';
import { ProductCard } from '@/src/components/home/ProductCard';

const ProductSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-3">
    <div className="h-72 rounded-2xl bg-white/10" />
    <div className="space-y-3 p-3">
      <div className="h-3 w-1/3 rounded bg-white/10" />
      <div className="h-5 w-3/4 rounded bg-white/10" />
      <div className="h-4 w-1/2 rounded bg-white/10" />
      <div className="h-10 rounded-full bg-white/10" />
    </div>
  </div>
);

export const FeaturedProductsSection = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="mb-10"
      >
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Featured Products</h2>
        <p className="mt-2 text-white/70">Handpicked essentials for your next style upgrade.</p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={`skeleton-${index + 1}`} />)
          : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
};
