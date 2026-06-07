import { Suspense } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { resolveLandingPage } from './registry'

interface LandingPageRendererProps {
  activeKey: string | null | undefined
  products: Product[]
  assets: ResolvedDropAssets
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

export function LandingPageRenderer({
  activeKey,
  products,
  assets,
}: LandingPageRendererProps) {
  const definition = resolveLandingPage(activeKey)
  const Page = definition.component
  return (
    <Suspense fallback={<LandingFallback />}>
      <Page products={products} assets={assets} />
    </Suspense>
  )
}
