'use client';

import { motion } from 'framer-motion';
import { gradients } from '@/src/styles/colors';

export const BannerSection = () => (
  <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-sky-500/80 via-indigo-500/75 to-zinc-800/85 p-8 shadow-2xl sm:p-12"
    >
      <div className="absolute inset-0" style={{ backgroundImage: gradients.bannerGlow }} />
      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Limited Time</p>
          <h2 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">Summer Collection 2026</h2>
          <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">
            Discover lightweight fabrics, bolder cuts, and elite comfort crafted for the new season.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg"
        >
          Explore Collection
        </motion.button>
      </div>
    </motion.div>
  </section>
);
