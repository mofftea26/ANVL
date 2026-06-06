import { Suspense } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { resolveLandingPage } from './registry'

interface LandingPageRendererProps {
  /** Active key from the CMS (`cms_settings.activeLandingPageKey`). */
  activeKey: string | null | undefined
  products: Product[]
}

function LandingFallback() {
  return (
    <div
      className="flex min-h-[100svh] items-center justify-center bg-[var(--color-bg)]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading experience…</span>
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-accent)]"
      />
    </div>
  )
}

/**
 * Resolves the active landing page from the registry and renders it. Only the
 * active page's chunk is fetched (lazy). Falls back to the default page for any
 * unknown/disabled key — never renders blank.
 */
export function LandingPageRenderer({
  activeKey,
  products,
}: LandingPageRendererProps) {
  const definition = resolveLandingPage(activeKey)
  const Page = definition.component
  return (
    <Suspense fallback={<LandingFallback />}>
      <Page products={products} />
    </Suspense>
  )
}
