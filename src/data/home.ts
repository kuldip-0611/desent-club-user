export type Product = {
  id: string;
  name: string;
  category: 'Men' | 'Women';
  /** List / MRP before discount */
  price: number;
  /** 1–100 when on sale; omit or null for no badge */
  discountPercent?: number | null;
  image: string;
};

export const featuredProducts: Product[] = [
  {
    id: 'p1',
    name: 'AeroFit Men Track Set',
    category: 'Men',
    price: 3499,
    discountPercent: 20,
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'p2',
    name: 'Urban Motion Women Track',
    category: 'Women',
    price: 3799,
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'p3',
    name: 'Essential Oversized Tee',
    category: 'Men',
    price: 1499,
    discountPercent: 10,
    image:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'p4',
    name: 'Minimal Luxe Crop Tee',
    category: 'Women',
    price: 1699,
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80',
  },
];

export const trendingProducts: Product[] = [
  {
    id: 't1',
    name: 'Neo Street Runner Track',
    category: 'Men',
    price: 3999,
    discountPercent: 15,
    image:
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't2',
    name: 'CloudFlex Women Co-ord',
    category: 'Women',
    price: 4299,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't3',
    name: 'Mono Signature Tee',
    category: 'Men',
    price: 1399,
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't4',
    name: 'Satin Touch Tee',
    category: 'Women',
    price: 1599,
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 't5',
    name: 'Velocity Zip Track',
    category: 'Men',
    price: 3599,
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
  },
];

export const categories = [
  {
    id: 'men',
    title: 'Men',
    description: 'Performance tracks and statement tees for daily style.',
    image:
      'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'women',
    title: 'Women',
    description: 'Contemporary essentials with elevated silhouettes.',
    image:
      'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
  },
];
