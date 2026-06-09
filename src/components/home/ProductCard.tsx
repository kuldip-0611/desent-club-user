'use client';

import { motion } from 'framer-motion';
import type { Product } from '@/src/data/home';
import { pricingFromList } from '@/src/lib/pricing';

type ProductCardProps = {
  product: Product;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const { listPrice, salePrice, discountPercent } = pricingFromList(
    product.price,
    product.discountPercent,
  );
  const hasDiscount = discountPercent != null;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl backdrop-blur"
    >
      <div className="relative overflow-hidden rounded-2xl">
        {hasDiscount ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            {discountPercent}% off
          </span>
        ) : null}
        <img
          src={product.image}
          alt={product.name}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>

      <div className="space-y-2 p-3">
        <p className="text-xs uppercase tracking-wide text-white/60">{product.category}</p>
        <h3 className="text-lg font-medium text-white">{product.name}</h3>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {hasDiscount ? (
            <>
              <p className="text-sm text-white/50 line-through">
                Rs {listPrice.toLocaleString('en-IN')}
              </p>
              <p className="text-base font-semibold text-emerald-300">
                Rs {salePrice.toLocaleString('en-IN')}
              </p>
            </>
          ) : (
            <p className="text-base font-semibold text-white">Rs {listPrice.toLocaleString('en-IN')}</p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-2 w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white opacity-0 transition duration-300 group-hover:opacity-100"
        >
          Add to Cart
        </motion.button>
      </div>
    </motion.article>
  );
};
