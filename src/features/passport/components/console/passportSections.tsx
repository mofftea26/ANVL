import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportRelated } from '../../lib/relatedProducts'
import { recommendSizes, type PassportSizeGuide } from '../../lib/sizeRecommendation'
import type { PassportView } from '../../schemas/passport.schema'
import { CareGuide } from '../CareGuide'
import { ForgeNotes } from '../ForgeNotes'
import { PassportRelatedStrip } from '../PassportRelatedStrip'
import { PassportStoryChapter } from '../PassportStoryChapter'
import { WorldOriginMap } from '../WorldOriginMap'

export interface PassportSectionContext {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  claimedDate: string | null
  storyChapter: StoryChapter | null
  /** Cross-product size map (loader-built, user-independent). */
  sizeGuide: PassportSizeGuide | null
  /** Candidate related pieces (loader-built; owner filters client-side). */
  related: PassportRelated | null
}

export type PassportSectionKey =
  | 'material'
  | 'specs'
  | 'details'
  | 'care'
  | 'fit'
  | 'story'
  | 'forge-notes'
  | 'origin'
  | 'complete-drop'
  | 'matching'
  | 'authenticity'

export type PassportSectionGroup = 'craft' | 'ritual' | 'legacy'

export const PASSPORT_GROUPS: Array<{ key: PassportSectionGroup; label: string }> = [
  { key: 'craft', label: 'The Craft' },
  { key: 'ritual', label: 'The Ritual' },
  { key: 'legacy', label: 'The Legacy' },
]

export interface PassportSectionDef {
  key: PassportSectionKey
  group: PassportSectionGroup
  title: string
  eyebrow: string
  available: (ctx: PassportSectionContext) => boolean
  teaser: (ctx: PassportSectionContext) => string
  cardImage?: (ctx: PassportSectionContext) => string | undefined
  Detail: (props: { ctx: PassportSectionContext }) => React.ReactNode
}

/**
 * The passport's section registry — one entry per bento card on the desktop
 * console AND per block in the mobile dossier AND (loosely) per CMS wizard
 * step, grouped into the console's tab categories, so the surfaces can never
 * drift apart. No icons by design — cards carry champagne numerals instead.
 */
export const PASSPORT_SECTIONS: PassportSectionDef[] = [
  {
    key: 'material',
    group: 'craft',
    title: 'Material dossier',
    eyebrow: 'Fabric',
    available: ({ content, product }) =>
      Boolean(content.material.title || content.material.note || product?.fabric),
    teaser: ({ content, product }) =>
      content.material.title || product?.fabric || 'The cloth this piece is cut from.',
    cardImage: ({ content }) => content.material.macroUrl,
    Detail: ({ ctx }) => (
      <div className="space-y-6">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ctx.product?.fabric ? <DetailStat term="Fabric" detail={ctx.product.fabric} /> : null}
          {ctx.product?.gsm ? <DetailStat term="Weight" detail={ctx.product.gsm} /> : null}
          {ctx.product?.fit ? <DetailStat term="Fit" detail={ctx.product.fit} /> : null}
        </dl>
        {ctx.content.material.note ? (
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {ctx.content.material.note}
          </p>
        ) : null}
        {ctx.content.material.macroUrl ? (
          <img
            src={ctx.content.material.macroUrl}
            alt={`${ctx.view.productName} fabric macro`}
            width={1200}
            height={800}
            loading="lazy"
            decoding="async"
            className="max-h-[26vh] w-full rounded-xl border border-[var(--color-line)] object-cover"
          />
        ) : null}
      </div>
    ),
  },
  {
    key: 'specs',
    group: 'craft',
    title: 'Specifications',
    eyebrow: 'Built',
    available: ({ content }) =>
      Object.values(content.specs).some((v) => Boolean(v)),
    teaser: ({ content }) =>
      content.specs.construction || content.specs.intendedUse || 'How this piece is built.',
    Detail: ({ ctx }) => (
      <dl className="grid max-w-xl grid-cols-2 gap-4">
        <SpecStat term="Construction" detail={ctx.content.specs.construction} />
        <SpecStat term="Fit type" detail={ctx.content.specs.fitType} />
        <SpecStat term="Compression" detail={ctx.content.specs.compression} />
        <SpecStat term="Stretch" detail={ctx.content.specs.stretch} />
        <SpecStat term="Breathability" detail={ctx.content.specs.breathability} />
        <SpecStat term="Intended use" detail={ctx.content.specs.intendedUse} />
      </dl>
    ),
  },
  {
    key: 'details',
    group: 'craft',
    title: 'Forged details',
    eyebrow: 'Design',
    available: ({ content }) =>
      Boolean(content.details.story || content.details.facts.length || content.details.funFact),
    teaser: ({ content }) =>
      content.details.funFact ||
      content.details.story.slice(0, 90) ||
      'Design decisions, hidden details, one forge fact.',
    cardImage: ({ content }) => content.details.assetUrl,
    Detail: ({ ctx }) => (
      <div className="space-y-6">
        {ctx.content.details.story ? (
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {ctx.content.details.story}
          </p>
        ) : null}
        {ctx.content.details.facts.length > 0 ? (
          <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
            {ctx.content.details.facts.map((d) => (
              <li key={d} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-2 h-px w-4 shrink-0 bg-[var(--color-highlight)]"
                />
                {d}
              </li>
            ))}
          </ul>
        ) : null}
        {ctx.content.details.funFact ? (
          <p className="max-w-xl rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text)]">
            <span className="anvl-micro mr-2 text-[var(--color-highlight-bright)]">
              Forge fact
            </span>
            {ctx.content.details.funFact}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: 'care',
    group: 'ritual',
    title: 'Care ritual',
    eyebrow: 'Preserve',
    available: ({ content }) =>
      content.care.steps.length > 0 || content.care.symbols.length > 0,
    teaser: ({ content }) =>
      content.care.intro || `${content.care.steps.length} steps to keep the forge sharp.`,
    Detail: ({ ctx }) => <CareGuide care={ctx.content.care} />,
  },
  {
    key: 'fit',
    group: 'ritual',
    title: 'Fit & sizing',
    eyebrow: 'Measure',
    available: ({ content }) =>
      Boolean(
        content.fit.intendedFit ||
          content.fit.measurements.length ||
          content.fit.modelSize ||
          content.fit.sizeAdvice,
      ),
    teaser: ({ content }) =>
      content.fit.intendedFit || content.fit.sizeAdvice || 'Measurements, stretch, model fit.',
    Detail: ({ ctx }) => <FitDetail ctx={ctx} />,
  },
  {
    key: 'story',
    group: 'legacy',
    title: 'The story',
    eyebrow: 'Saga',
    available: ({ storyChapter }) => Boolean(storyChapter && storyChapter.acts.length > 0),
    teaser: ({ storyChapter }) =>
      storyChapter?.subtitle ||
      storyChapter?.description.slice(0, 90) ||
      'The chapter behind this piece.',
    Detail: ({ ctx }) =>
      ctx.storyChapter ? <PassportStoryChapter chapter={ctx.storyChapter} /> : null,
  },
  {
    key: 'forge-notes',
    group: 'legacy',
    title: 'Forge notes',
    eyebrow: 'Development',
    available: ({ content }) => content.forgeNotes.length > 0,
    teaser: ({ content }) =>
      content.forgeNotes[0]?.title || 'Notes from the development floor.',
    Detail: ({ ctx }) => <ForgeNotes notes={ctx.content.forgeNotes} />,
  },
  {
    key: 'origin',
    group: 'legacy',
    title: 'Origin',
    eyebrow: 'Provenance',
    available: () => true,
    teaser: ({ content }) =>
      content.origin.place
        ? `${content.origin.label} — ${content.origin.place}`
        : content.origin.label,
    cardImage: ({ content }) => content.origin.assetUrl,
    Detail: ({ ctx }) => (
      <div className="space-y-6">
        <WorldOriginMap
          madeIn={ctx.content.origin.madeIn}
          designedIn={ctx.content.origin.designedIn}
          label={ctx.content.origin.label}
        />
        {ctx.content.origin.story ? (
          <p className="mx-auto max-w-xl text-center text-sm leading-relaxed text-[var(--color-text-muted)]">
            {ctx.content.origin.story}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: 'complete-drop',
    group: 'legacy',
    title: 'Complete the drop',
    eyebrow: 'Collection',
    // Owner-only, and only when this piece's drop has other pieces at all.
    available: ({ view, related }) =>
      view.isOwner && (related?.dropMates.length ?? 0) > 0,
    teaser: ({ related }) =>
      related?.dropName ? `Finish ${related.dropName}` : 'Complete the collection.',
    Detail: ({ ctx }) =>
      ctx.related ? (
        <PassportRelatedStrip mode="drop" related={ctx.related} />
      ) : null,
  },
  {
    key: 'matching',
    group: 'legacy',
    title: 'Matching pieces',
    eyebrow: 'Loadout',
    available: ({ view, related }) =>
      view.isOwner && (related?.categoryMates.length ?? 0) > 0,
    teaser: () => 'Complete your loadout.',
    Detail: ({ ctx }) =>
      ctx.related ? (
        <PassportRelatedStrip mode="category" related={ctx.related} />
      ) : null,
  },
  {
    key: 'authenticity',
    group: 'legacy',
    title: 'Authenticity',
    eyebrow: 'Verified',
    available: () => true,
    teaser: ({ view }) => `Verified · limited to ${view.editionTotal} pieces`,
    Detail: ({ ctx }) => (
      <div className="max-w-xl space-y-4">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {ctx.content.identity.authenticityNote ||
            'This passport is bound to a single unit and a single owner. The registration is atomic — once forged to a name, this QR can never be claimed again.'}
        </p>
        <dl className="grid grid-cols-2 gap-4">
          <DetailStat term="Status" detail="Authentic ANVL product" />
          <DetailStat term="Edition" detail={`Limited to ${ctx.view.editionTotal} pieces`} />
          {ctx.claimedDate ? <DetailStat term="Registered" detail={ctx.claimedDate} /> : null}
          {ctx.view.claimedDisplayName ? (
            <DetailStat term="Registered to" detail={ctx.view.claimedDisplayName} />
          ) : null}
        </dl>
      </div>
    ),
  },
]

function DetailStat({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <dt className="anvl-micro text-[var(--color-text-muted)]">{term}</dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--color-text)]">{detail}</dd>
    </div>
  )
}

/** Spec rows hide themselves when unauthored (never show an empty stat). */
function SpecStat({ term, detail }: { term: string; detail: string }) {
  if (!detail) return null
  return <DetailStat term={term} detail={detail} />
}

/**
 * Fit & sizing — facts first, then (owner-only) the cross-product size advice
 * derived from the size they registered. Silent when the CMS hasn't mapped
 * this product's sizes: no map, no guess.
 */
function FitDetail({ ctx }: { ctx: PassportSectionContext }) {
  const { fit } = ctx.content
  const recommendations = recommendSizes(ctx.sizeGuide, ctx.view.claimedSize)

  return (
    <div className="max-w-xl space-y-6">
      <dl className="grid grid-cols-2 gap-4">
        <SpecStat term="Intended fit" detail={fit.intendedFit} />
        <SpecStat term="Stretch" detail={fit.stretchRange} />
        {fit.modelHeight || fit.modelSize ? (
          <SpecStat
            term="On the model"
            detail={[fit.modelHeight, fit.modelSize ? `wears ${fit.modelSize}` : '']
              .filter(Boolean)
              .join(' · ')}
          />
        ) : null}
        {ctx.view.claimedSize ? (
          <SpecStat term="Your size" detail={ctx.view.claimedSize} />
        ) : null}
      </dl>

      {fit.measurements.length > 0 ? (
        <div>
          <p className="anvl-micro mb-2 text-[var(--color-text-muted)]">Measurements</p>
          <dl className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
            {fit.measurements.map((m) => (
              <div key={m.label} className="flex justify-between px-4 py-2 text-sm">
                <dt className="text-[var(--color-text-muted)]">{m.label}</dt>
                <dd className="font-semibold text-[var(--color-text)]">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {fit.sizeAdvice ? (
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{fit.sizeAdvice}</p>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface)] p-4">
          <p className="anvl-micro text-[var(--color-highlight-bright)]">
            You wear {ctx.view.claimedSize} in this piece
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Across the rest of the armory, that maps to:
          </p>
          <ul className="mt-3 space-y-1.5">
            {recommendations.map((r) => (
              <li key={r.slug} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">{r.name}</span>
                <span className="font-semibold text-[var(--color-heading)]">{r.size}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
