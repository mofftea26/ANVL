import { toast } from 'sonner'
import type { Product } from '@/features/products/types/product.types'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'

/**
 * Share a product via the Web Share API, falling back to copying its canonical
 * URL to the clipboard. Client-only; safe to call from any event handler. Shared
 * by the shop card and the PDP buy panel so the behavior stays identical.
 */
export async function shareProduct(product: Product): Promise<void> {
  if (typeof window === 'undefined') return
  const url = `${window.location.origin}/shop/${product.slug}`
  const name = stripAngleBracketTags(product.name)
  const data = { title: `${name} — ANVL Athletics`, text: name, url }
  try {
    if (navigator.share) {
      await navigator.share(data)
      return
    }
    await navigator.clipboard?.writeText(url)
    toast.success('Product link copied.')
  } catch {
    /* user dismissed the share sheet — no-op */
  }
}
