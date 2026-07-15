import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportView } from '../../schemas/passport.schema'
import { PassportStoryChapter } from '../PassportStoryChapter'
import { WorldOriginMap } from '../WorldOriginMap'

export interface PassportSectionContext {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  claimedDate: string | null
  storyChapter: StoryChapter | null
}

export type PassportSectionKey =
  | 'material'
  | 'details'
  | 'care'
  | 'story'
  | 'origin'
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
    available: ({ content }) => content.care.steps.length > 0,
    teaser: ({ content }) =>
      content.care.intro || `${content.care.steps.length} steps to keep the forge sharp.`,
    Detail: ({ ctx }) => (
      <div className="space-y-6">
        {ctx.content.care.intro ? (
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            {ctx.content.care.intro}
          </p>
        ) : null}
        <ol className="space-y-4">
          {ctx.content.care.steps.map((step, i) => (
            <li key={step} className="flex gap-4 text-sm text-[var(--color-text-muted)]">
              <span className="anvl-heading text-lg text-[var(--color-highlight-bright)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    ),
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
