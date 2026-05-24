import { BRAND } from '@/shared/constants/brand'
import { resolveAssetUrl } from '@/app/seo/meta'
import { AdminCard } from '@/features/admin/components/AdminCard'

export type SiteSeoPreviewState = {
  metaTitle: string
  metaDescription: string
  path: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  defaultShareImage?: string
}

function previewTitle(state: SiteSeoPreviewState): string {
  return (
    state.metaTitle.trim() ||
    state.ogTitle?.trim() ||
    'ANVL Athletics | Forged Under Pressure'
  )
}

function previewDescription(state: SiteSeoPreviewState): string {
  return (
    state.metaDescription.trim() ||
    state.ogDescription?.trim() ||
    'Premium bodybuilding gymwear built for disciplined lifters.'
  )
}

function previewShareImage(state: SiteSeoPreviewState): string {
  return (
    resolveAssetUrl(
      state.ogImage?.trim() ||
        state.twitterImage?.trim() ||
        state.defaultShareImage?.trim(),
    ) ?? `${BRAND.canonicalBaseUrl}/brand/og-default.svg`
  )
}

function previewUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BRAND.canonicalBaseUrl}${normalized === '/' ? '' : normalized}`
}

export function SiteSeoPreviewPanel({ state }: { state: SiteSeoPreviewState }) {
  const title = previewTitle(state)
  const description = previewDescription(state)
  const url = previewUrl(state.path)
  const image = previewShareImage(state)
  const twitterTitle = state.twitterTitle?.trim() || state.ogTitle?.trim() || title
  const twitterDescription =
    state.twitterDescription?.trim() || state.ogDescription?.trim() || description

  return (
    <div className="space-y-4" data-testid="site-seo-preview">
      <AdminCard title="Google preview">
        <div className="space-y-1 rounded-lg border border-[var(--color-line)] bg-white p-4 text-left">
          <p className="truncate text-lg text-[#1a0dab]">{title}</p>
          <p className="truncate text-sm text-[#006621]">{url}</p>
          <p className="line-clamp-2 text-sm text-[#545454]">{description}</p>
        </div>
      </AdminCard>
      <AdminCard title="Twitter card">
        <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div
            className="aspect-[1.91/1] w-full bg-[var(--color-bg)] bg-cover bg-center"
            style={{ backgroundImage: `url(${image})` }}
            role="img"
            aria-label="Share image preview"
          />
          <div className="space-y-1 border-t border-[var(--color-line)] p-3">
            <p className="truncate text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
              anvlathletics.com
            </p>
            <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
              {twitterTitle}
            </p>
            <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">
              {twitterDescription}
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
