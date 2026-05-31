import type { ReactNode } from 'react'
import { Suspense, useMemo } from 'react'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { Product } from '@/features/products/types/product.types'
import { defaultLandingActSequence } from '@/features/drops/drops.actSequence'
import { publicLandingActsFromSequence } from '@/features/cms/landing/landingActs.normalize'
import { resolveActPreset } from '@/features/marketing/act-presets/registry'
import { resolveActCampaignMarkSrc } from '@/features/cms/landing/resolveActCampaignMark'
import { Container } from '@/shared/components/ui'
import { DropLoadingIndicator } from '@/shared/components/ui/DropLoadingIndicator'

export { resolveProductShowcaseProducts } from '@/features/marketing/act-presets/resolveProductShowcaseProducts'

function SectionFallback({ label }: { label: string }) {
  return (
    <section className="anvl-screen-section flex items-center justify-center border-b border-[var(--color-line)] bg-[var(--color-bg)]">
      <Container>
        <DropLoadingIndicator label={label} />
      </Container>
    </section>
  )
}

function UnknownActNotice({
  nature,
  cmsPreview,
}: {
  nature: string
  cmsPreview?: boolean
}) {
  return (
    <section
      className="anvl-screen-section border-b border-[var(--color-line)] bg-[var(--color-bg)]"
      aria-label={`Unsupported act: ${nature}`}
    >
      <Container className="anvl-act-content flex flex-col justify-center py-6 sm:py-8">
        {cmsPreview ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-50"
          >
            <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em]">
              CMS preview — unsupported act
            </p>
            <p className="mt-2 text-sm text-amber-100/90">
              Type &quot;{nature}&quot; is not wired to a public section yet. The live site skips
              this row; fix the nature or disable the act before publishing.
            </p>
          </div>
        ) : (
          <p className="anvl-micro text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Act type {nature} is not available on this build. The section is skipped.
          </p>
        )}
      </Container>
    </section>
  )
}

function wrapLazy(key: string, label: string, node: ReactNode) {
  return (
    <Suspense key={key} fallback={<SectionFallback label={label} />}>
      {node}
    </Suspense>
  )
}

export type PublicLandingActsProps = {
  landing: LandingPageCmsContent
  products: Product[]
  emblemSrc?: string
  wordmarkSrc?: string
  /** When true, unknown act types show an explicit admin warning instead of the public notice. */
  cmsPreview?: boolean
  /**
   * Drop editor: merge each act row’s builder fields over the composed landing
   * slices so copy / CTAs refresh immediately (order still comes from `landing.landingActs`).
   */
  draftActs?: LandingAct[]
}

export function PublicLandingActs({
  landing,
  products,
  emblemSrc,
  wordmarkSrc,
  cmsPreview,
  draftActs,
}: PublicLandingActsProps) {
  const actRows = draftActs ?? landing.dropActs
  const rowById = useMemo(() => {
    if (!actRows?.length) return null
    return new Map(actRows.map((a) => [a.id, a]))
  }, [actRows])

  function rowFor(actId: string): LandingAct | undefined {
    return rowById?.get(actId)
  }
  if (cmsPreview && landing.landingActs.length === 0) {
    return (
      <section
        className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16"
        aria-label="Drop preview has no acts"
      >
        <Container>
          <p className="anvl-micro text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            CMS preview
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text)]">
            No landing acts yet. Open the <strong>Acts</strong> tab to add rows or sync copy — the
            live preview only reflects the acts builder, not the legacy slot sequence.
          </p>
        </Container>
      </section>
    )
  }

  const acts =
    landing.landingActs.length > 0
      ? [...landing.landingActs].sort((a, b) => a.sortOrder - b.sortOrder)
      : publicLandingActsFromSequence(defaultLandingActSequence())

  return (
    <>
      {acts.map((act) => {
        if (act.enabled === false) return null

        const entry = resolveActPreset(act.nature, act.preset)
        if (!entry) {
          return (
            <UnknownActNotice key={act.id} nature={act.nature} cmsPreview={cmsPreview} />
          )
        }

        const Preset = entry.component
        const row = rowFor(act.id)
        const loadingLabel = `Loading ${entry.label}`
        const actEmblemSrc = resolveActCampaignMarkSrc({
          row,
          dropEmblemSrc: emblemSrc,
          dropWordmarkSrc: wordmarkSrc,
        })

        return wrapLazy(
          act.id,
          loadingLabel,
          <Preset
            act={act}
            landing={landing}
            products={products}
            emblemSrc={actEmblemSrc}
            row={row}
          />,
        )
      })}
    </>
  )
}
