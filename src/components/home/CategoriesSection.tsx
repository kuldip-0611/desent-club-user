'use client';

import { motion } from 'framer-motion';
import { categories } from '@/src/data/home';

export const CategoriesSection = () => (
  <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="mb-10"
    >
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">Shop by Category</h2>
      <p className="mt-2 text-white/70">Curated edits designed for premium everyday wear.</p>
    </motion.div>

    <div className="grid gap-6 md:grid-cols-2">
      {categories.map((category, index) => (
        <motion.article
          key={category.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, delay: index * 0.15, ease: 'easeInOut' }}
          whileHover={{ scale: 1.02 }}
          className="group relative overflow-hidden rounded-3xl"
        >
          <img
            src={category.image}
            alt={category.title}
            className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-xs">
            <h3 className="text-3xl font-semibold text-white">{category.title}</h3>
            <p className="mt-2 text-sm text-white/80">{category.description}</p>
          </div>
        </motion.article>
      ))}
    </div>
  </section>
);
