/** Product catalog subscriptions removed with the products CMS — no-op for callers. */
export function subscribeProductsChange(_listener: () => void): () => void {
  return () => {}
}
