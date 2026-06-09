import type { Product } from '@/types/product'

const colorBank = [
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#F8FAFC' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Charcoal', hex: '#334155' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Olive', hex: '#4D7C0F' },
]

const imagePool = [
  'https://images.pexels.com/photos/9558761/pexels-photo-9558761.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6311606/pexels-photo-6311606.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/428340/pexels-photo-428340.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6311644/pexels-photo-6311644.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6311598/pexels-photo-6311598.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/6311640/pexels-photo-6311640.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/8173478/pexels-photo-8173478.jpeg?auto=compress&cs=tinysrgb&w=1200',
]

const tShirtNames = [
  'Classic Crew Neck Tshirt',
  'Oversized Street Tshirt',
  'Athletic Dry-Fit Tshirt',
  'Premium Logo Tshirt',
  'Weekend Relaxed Tshirt',
]

const trackNames = [
  'Performance Track Pants',
  'Relaxed Jogger Tracks',
  'Women High Waist Tracks',
  'Essential Training Tracks',
  'All Day Comfort Tracks',
]

const audienceCycle: Array<'MEN' | 'WOMEN' | 'UNISEX'> = ['MEN', 'WOMEN', 'UNISEX']

const buildProduct = (index: number): Product => {
  const category = index % 2 === 0 ? 'tshirts' : 'tracks'
  const nameBase = category === 'tshirts' ? tShirtNames[index % tShirtNames.length] : trackNames[index % trackNames.length]
  const c1 = colorBank[index % colorBank.length]
  const c2 = colorBank[(index + 2) % colorBank.length]
  const imgA = imagePool[index % imagePool.length]
  const imgB = imagePool[(index + 1) % imagePool.length]
  const imgC = imagePool[(index + 2) % imagePool.length]
  const imgD = imagePool[(index + 3) % imagePool.length]

  return {
    id: `p${index + 1}`,
    slug: `${nameBase.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
    name: `${nameBase} ${index + 1}`,
    description:
      category === 'tshirts'
        ? 'Premium cotton-rich t-shirt with refined fit and breathable comfort.'
        : 'Performance tracks with flexible movement and premium everyday finish.',
    category,
    audience: audienceCycle[index % audienceCycle.length],
    price: 999 + (index % 12) * 120,
    compareAtPrice: 1299 + (index % 12) * 130,
    rating: Number((4 + ((index % 10) * 0.08)).toFixed(1)),
    reviewsCount: 40 + index * 3,
    tags: category === 'tshirts' ? ['cotton', 'streetwear'] : ['training', 'athleisure'],
    images: [imgA, imgB],
    imagesByColor: {
      [c1.name.toLowerCase()]: [imgA, imgC],
      [c2.name.toLowerCase()]: [imgB, imgD],
    },
    variants: [
      { id: `p${index + 1}v1`, size: 'M', colorName: c1.name, colorHex: c1.hex, stock: 10 + (index % 20) },
      { id: `p${index + 1}v2`, size: 'L', colorName: c1.name, colorHex: c1.hex, stock: 8 + (index % 15) },
      { id: `p${index + 1}v3`, size: 'XL', colorName: c2.name, colorHex: c2.hex, stock: 6 + (index % 12) },
    ],
    isNewArrival: index % 5 === 0,
    isBestSeller: index % 7 === 0,
  }
}

export const MOCK_PRODUCTS: Product[] = Array.from({ length: 100 }, (_, index) => buildProduct(index))
