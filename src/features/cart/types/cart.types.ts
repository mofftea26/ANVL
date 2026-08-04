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
  /**
   * ISO 4217 code captured from the product at add-to-cart time.
   *
   * Optional so carts persisted before this field existed stay valid — those
   * lines fall back to the default in `formatMoney`. Stored per line rather
   * than once per cart because the catalogue type carries currency per product;
   * a mixed-currency cart is not a supported checkout, but silently RENDERING
   * one currency's symbol over another product's price is exactly the bug this
   * closes.
   */
  currency?: string
}
