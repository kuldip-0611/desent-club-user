'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/src/components/home/Navbar';
import { HeroSection } from '@/src/components/home/HeroSection';
import { CategoriesSection } from '@/src/components/home/CategoriesSection';
import { FeaturedProductsSection } from '@/src/components/home/FeaturedProductsSection';
import { TrendingSection } from '@/src/components/home/TrendingSection';
import { BannerSection } from '@/src/components/home/BannerSection';
import { Footer } from '@/src/components/home/Footer';
import { colors } from '@/src/styles/colors';

export const FashionHomePage = () => (
  <motion.main
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6, ease: 'easeInOut' }}
    className="min-h-screen"
    style={{ backgroundColor: colors.appBackground }}
  >
    <Navbar />
    <HeroSection />
    <CategoriesSection />
    <FeaturedProductsSection />
    <TrendingSection />
    <BannerSection />
    <Footer />
  </motion.main>
);
