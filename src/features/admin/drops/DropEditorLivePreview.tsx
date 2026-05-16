import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from 'react'
import { DropPreviewThemeScope } from '@/app/providers/ActiveDropThemeBridge'
import type { DropThemePalette } from '@/features/admin/drops/drops.types'
import type { LandingPageCmsContent } from '@/features/admin/landing-cms/landingCms.types'
import { PublicLandingActs } from '@/features/marketing/public-landing/PublicLandingActs'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'

type ViewportId = 'fit' | 'mobile' | 'tablet' | 'desktop'

const VIEWPORT_OPTIONS: Array<{ id: ViewportId; label: string; widthClass: string }> = [
  { id: 'fit', label: 'Fit', widthClass: 'w-full' },
  { id: 'mobile', label: 'Mobile', widthClass: 'w-full max-w-[390px]' },
  { id: 'tablet', label: 'Tablet', widthClass: 'w-full max-w-[820px]' },
  { id: 'desktop', label: 'Desktop', widthClass: 'w-full max-w-[1280px]' },
]

type BoundaryProps = { children: ReactNode }
type BoundaryState = { error: Error | null }

class DropEditorPreviewErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DropEditorLivePreview]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-50"
        >
          <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em]">
            CMS preview — render error
          </p>
          <p className="mt-2 text-sm text-amber-100/90">
            The preview hit invalid draft data or an unsupported combination. Fix the issue, then
            use &quot;Try again&quot;.
          </p>
          <p className="mt-2 font-mono text-xs text-amber-200/80">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-md border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50 transition hover:bg-amber-500/30"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export type DropEditorLivePreviewProps = {
  landing: LandingPageCmsContent
  products: Product[]
  palette: DropThemePalette
  emblemUrl: string
}

export function DropEditorLivePreview({
  landing,
  products,
  palette,
  emblemUrl,
}: DropEditorLivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportId>('fit')
  const frameClass = useMemo(
    () => VIEWPORT_OPTIONS.find((o) => o.id === viewport)?.widthClass ?? 'w-full',
    [viewport],
  )

  return (
    <div className="space-y-3">
      <div
        role="toolbar"
        aria-label="Preview viewport size"
        className="flex flex-wrap gap-2"
      >
        {VIEWPORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={viewport === opt.id}
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] transition',
              viewport === opt.id
                ? 'border-[var(--color-accent)] bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/50',
            )}
            onClick={() => setViewport(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <DropPreviewThemeScope palette={palette} emblemUrl={emblemUrl}>
        <div className="overflow-x-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] shadow-inner">
          <div className={cn('mx-auto', frameClass)}>
            <DropEditorPreviewErrorBoundary>
              <div className="pointer-events-none select-none space-y-10 p-4 opacity-95 [&_a]:pointer-events-none">
                <PublicLandingActs
                  landing={landing}
                  products={products}
                  emblemSrc={emblemUrl}
                  cmsPreview
                />
              </div>
            </DropEditorPreviewErrorBoundary>
          </div>
        </div>
      </DropPreviewThemeScope>
    </div>
  )
}
