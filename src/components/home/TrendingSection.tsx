'use client';

import { motion } from 'framer-motion';
import { trendingProducts } from '@/src/data/home';
import { pricingFromList } from '@/src/lib/pricing';

export const TrendingSection = () => (
  <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="mb-10"
    >
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">Trending New Arrivals</h2>
      <p className="mt-2 text-white/70">Fresh drops with modern silhouettes and premium textures.</p>
    </motion.div>

    <div className="flex snap-x gap-5 overflow-x-auto pb-3">
      {trendingProducts.map((product, index) => (
        <motion.article
          key={product.id}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeInOut' }}
          whileHover={{ y: -6, rotate: 0 }}
          className="min-w-[280px] snap-start overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur"
          style={{ rotate: index % 2 === 0 ? '-1deg' : '1deg' }}
        >
          <div className="relative">
            {product.discountPercent ? (
              <span className="absolute right-3 top-3 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {Math.min(100, Math.floor(product.discountPercent))}% off
              </span>
            ) : null}
            <img src={product.image} alt={product.name} className="h-80 w-full object-cover" />
          </div>
          <div className="space-y-2 p-4">
            <h3 className="text-lg font-medium text-white">{product.name}</h3>
            {(() => {
              const { listPrice, salePrice, discountPercent } = pricingFromList(
                product.price,
                product.discountPercent,
              );
              return discountPercent != null ? (
                <p className="text-sm text-white/90">
                  <span className="text-white/45 line-through">Rs {listPrice.toLocaleString('en-IN')}</span>
                  <span className="ml-2 font-semibold text-emerald-300">
                    Rs {salePrice.toLocaleString('en-IN')}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-white/70">Rs {listPrice.toLocaleString('en-IN')}</p>
              );
            })()}
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);
