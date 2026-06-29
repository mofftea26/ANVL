export interface CartLine {
  productId: string
  slug: string
  name: string
  price: number
  colorway: string
  size: string
  quantity: number
  image: string
  /** Shopify variant GID — present when the Shopify commerce adapter is active; drives hosted checkout. */
  variantId?: string
}
