export interface ProductColorway {
  name: string
  base: string
  accent: string
}

export interface Product {
  id: string
  slug: string
  name: string
  dropName: string
  role: string
  fit: string
  fabric: string
  gsm: string
  storytelling: string
  designDetails: string[]
  careInstructions: string[]
  colorways: ProductColorway[]
  sizes: string[]
  price: number
  images: Array<{ src: string; alt: string }>
}
