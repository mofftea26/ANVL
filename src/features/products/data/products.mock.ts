import type { Product } from '../types/product.types'

export const productsMock: Product[] = [
  {
    id: 'anvl-oversized-tee',
    slug: 'oversized-tee',
    name: 'Oversized Tee',
    dropName: 'Drop 01: The Oath',
    role: 'Heavy streetwear fit — boxy, drop-shoulder, built for gym and streetwear hours.',
    fit: 'Regular oversized length, boxy silhouette, drop shoulders, wide sleeves, thick collar.',
    fabric: '100% heavyweight cotton jersey',
    gsm: '240-260 GSM',
    storytelling:
      'Heavy streetwear pump-cover with a structured and premium hand feel.',
    designDetails: [
      'Small centered ANVL front wordmark',
      'Back title: The Oath',
      'Forged oath emblem/sigil on back',
      'Forged Under Pressure slogan',
      'Lower back crest detail',
    ],
    careInstructions: [
      'Machine wash cold',
      'Inside out wash recommended',
      'Do not tumble dry',
      'Low heat iron only',
    ],
    colorways: [
      { name: 'Black / Dark Steel Grey', base: '#0B0B0C', accent: '#1D1F21' },
      { name: 'Washed Charcoal / Black', base: '#34373A', accent: '#0B0B0C' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    price: 59,
    images: [
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Oversized Tee front view in black' },
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Oversized Tee back graphic for The Oath' },
    ],
  },
  {
    id: 'anvl-stringer',
    slug: 'stringer',
    name: 'Old-school Cut Stringer',
    dropName: 'Drop 01: The Oath',
    role: 'Revealing lifter-style cut built for serious training.',
    fit: 'Controlled deep armholes, racerback, wider straps than extreme classic stringers.',
    fabric: '95% cotton / 5% elastane premium stretch blend',
    gsm: '180-220 GSM',
    storytelling:
      'Breathable old-school lifter profile with premium recovery and structure.',
    designDetails: [
      'Small centered ANVL front wordmark',
      'Upper-back crest',
      'Long vertical forged spine symbol',
      'No slogan text for cleaner back panel',
    ],
    careInstructions: [
      'Machine wash cold',
      'Avoid bleach',
      'Hang dry',
      'Do not dry clean',
    ],
    colorways: [
      { name: 'Black / Graphite', base: '#0B0B0C', accent: '#5B5E61' },
      { name: 'Charcoal / Bone', base: '#34373A', accent: '#E7E4DF' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 49,
    images: [
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Stringer front view in black graphite' },
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Stringer back view with crest and spine symbol' },
    ],
  },
  {
    id: 'anvl-compression-tee',
    slug: 'compression-tee',
    name: 'Compression Tee',
    dropName: 'Drop 01: The Oath',
    role: 'Strong body-contouring compression — dense performance feel under load.',
    fit: 'Strong compression second-skin fit across chest, shoulders, arms, and torso.',
    fabric: '72% polyamide / 21% polyester / 7% elastane',
    gsm: '270-300 GSM',
    storytelling:
      'Dense, smooth, and sculpted performance compression with premium contour language.',
    designDetails: [
      'Small centered ANVL chest wordmark',
      'Upper-back crest',
      'Tonal angular contour seam language',
      'No slogan text',
    ],
    careInstructions: [
      'Cold wash with similar colors',
      'Do not tumble dry',
      'Do not iron over print',
      'Lay flat to dry',
    ],
    colorways: [
      { name: 'Black / Graphite', base: '#0B0B0C', accent: '#5B5E61' },
      { name: 'Dark Steel Grey / Black', base: '#1D1F21', accent: '#0B0B0C' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 69,
    images: [
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Compression Tee front view in black graphite' },
      { src: '/brand/placeholder-product.svg', alt: 'ANVL Compression Tee back view with contour seams' },
    ],
  },
]
