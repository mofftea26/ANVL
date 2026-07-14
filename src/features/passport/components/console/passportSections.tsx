import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, Flame, MapPin, Shirt, Sparkles } from 'lucide-react'
import type { Product } from '@/features/products/types/product.types'
import type { ResolvedPassportContent } from '../../lib/resolvePassportContent'
import type { PassportView } from '../../schemas/passport.schema'
import { PassportOriginMap } from '../PassportOriginMap'

export interface PassportSectionContext {
  view: PassportView
  product: Product | null
  content: ResolvedPassportContent
  claimedDate: string | null
}

export type PassportSectionKey = 'material' | 'care' | 'details' | 'origin' | 'authenticity'

export interface PassportSectionDef {
  key: PassportSectionKey
  title: string
  eyebrow: string
  icon: LucideIcon
  available: (ctx: PassportSectionContext) => boolean
  teaser: (ctx: PassportSectionContext) => string
  cardImage?: (ctx: PassportSectionContext) => string | undefined
  Detail: (props: { ctx: PassportSectionContext }) => React.ReactNode
}

/**
 * The passport's section registry — one entry per bento card on the desktop
 * console AND per step in the CMS wizard AND per block in the mobile dossier,
 * so the three surfaces can never drift apart.
 */
export const PASSPORT_SECTIONS: PassportSectionDef[] = [
  {
    key: 'material',
    title: 'Material dossier',
    eyebrow: 'Fabric',
    icon: Shirt,
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
            className="max-h-[38vh] w-auto rounded-xl border border-[var(--color-line)] object-cover"
          />
        ) : null}
      </div>
    ),
  },
  {
    key: 'care',
    title: 'Care ritual',
    eyebrow: 'Ritual',
    icon: Flame,
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
    key: 'details',
    title: 'Forged details',
    eyebrow: 'Story',
    icon: Sparkles,
    available: ({ content }) =>
      Boolean(content.details.story || content.details.facts.length || content.details.funFact),
    teaser: ({ content }) =>
      content.details.funFact ||
      content.details.story.slice(0, 90) ||
      'Design decisions, hidden details, one fun fact.',
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
    key: 'origin',
    title: 'Origin',
    eyebrow: 'Provenance',
    icon: MapPin,
    available: () => true,
    teaser: ({ content }) =>
      content.origin.place
        ? `${content.origin.label} — ${content.origin.place}`
        : content.origin.label,
    cardImage: ({ content }) => content.origin.assetUrl,
    Detail: ({ ctx }) => (
      <div className="space-y-6">
        <PassportOriginMap />
        {ctx.content.origin.place ? (
          <p className="anvl-micro text-center text-[var(--color-text-muted)]">
            {ctx.content.origin.place}
          </p>
        ) : null}
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
    title: 'Authenticity',
    eyebrow: 'Verified',
    icon: BadgeCheck,
    available: () => true,
    teaser: ({ view }) => `Token-verified · one of ${view.editionTotal}`,
    Detail: ({ ctx }) => (
      <div className="max-w-xl space-y-4">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {ctx.content.identity.authenticityNote ||
            'This passport is bound to a single unit and a single owner. The claim is atomic — once forged to a name, this QR can never be claimed again.'}
        </p>
        <dl className="grid grid-cols-2 gap-4">
          <DetailStat
            term="Forge number"
            detail={`${ctx.view.serialNumber} of ${ctx.view.editionTotal}`}
          />
          {ctx.claimedDate ? <DetailStat term="Forged on" detail={ctx.claimedDate} /> : null}
          {ctx.view.claimedDisplayName ? (
            <DetailStat term="Forged by" detail={ctx.view.claimedDisplayName} />
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
