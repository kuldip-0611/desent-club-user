'use client';

import { motion } from 'framer-motion';
import { gradients } from '@/src/styles/colors';

const floatingTransition = {
  duration: 4,
  repeat: Infinity,
  repeatType: 'mirror' as const,
  ease: 'easeInOut' as const,
};

export const HeroSection = () => (
  <section className="relative flex min-h-[calc(100vh-72px)] items-center overflow-hidden px-4 py-16 sm:px-8">
    <div className="absolute inset-0" style={{ backgroundImage: gradients.heroBackground }} />

    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={floatingTransition}
      className="absolute left-[8%] top-[20%] h-24 w-24 rounded-full bg-sky-500/20 blur-2xl"
    />
    <motion.div
      animate={{ y: [0, 18, 0] }}
      transition={{ ...floatingTransition, duration: 5 }}
      className="absolute bottom-[20%] right-[10%] h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl"
    />

    <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="space-y-6"
      >
        <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
          Summer Drop 2026
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
          Redefine Your Style
        </h1>
        <p className="max-w-xl text-base text-white/70 sm:text-lg">
          Elevated tracks and tees for men and women, crafted to balance performance, comfort, and
          modern edge.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-xl"
          >
            Shop Men
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur"
          >
            Shop Women
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.2 }}
        className="relative"
      >
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-lg">
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80"
            alt="Premium fashion model"
            className="h-[460px] w-full rounded-2xl object-cover"
          />
        </div>
      </motion.div>
    </div>
  </section>
);
