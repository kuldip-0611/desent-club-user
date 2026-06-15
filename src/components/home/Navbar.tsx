'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const navItems = ['Home', 'Shop', 'Categories', 'About'];

export const Navbar = () => (
  <motion.header
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, ease: 'easeInOut' }}
    className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl"
  >
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
      <Link href="/" className="flex items-center gap-3 text-white">
        <Image src="/logo.png" alt="Disent Clung logo" width={44} height={44} className="h-11 w-11 shrink-0 rounded-md" />
        <span className="text-xl font-bold tracking-[0.2em]">DISENT CLUNG</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {navItems.map((item) => (
          <motion.a
            key={item}
            href="#"
            whileHover={{ y: -2 }}
            className="group relative text-sm text-white/80 transition hover:text-white"
          >
            {item}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-sky-300 to-indigo-300 transition-all duration-300 group-hover:w-full" />
          </motion.a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-full border border-white/40 px-4 py-2 text-xs font-medium text-white transition hover:border-white"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/50 transition hover:scale-[1.02]"
        >
          Register
        </Link>
      </div>
    </nav>
  </motion.header>
);
