import type {
  ResolvedPdpCareItem,
  ResolvedPdpDetail,
  ResolvedPdpMaterial,
} from '@/features/products/pdp/resolvePdpContent'
import { CARE_ICON_COMPONENTS, formatCareValue } from '@/features/support/components'
import { cn } from '@/shared/lib/cn'
import { useHighlightOnArrival } from '@/shared/hooks/useHighlightOnArrival'

/**
 * The redesigned bento cards for the PDP "second screen": one forged card per
 * material entry (big percentage numeral + gsm), per care instruction (its
 * care icon), and per forged detail (title/description). All colors come from
 * the `--shop-*` semantic tokens so every CMS theme re-skins them. Reveals via
 * the parent's `usePdpReveal` (`data-reveal`); the first card of each group
 * carries the group's anchor id + live-preview target.
 */

/** Absolutely-positioned card backdrop image + legibility gradient. */
function CardBackdrop({ src, strong }: { src: string; strong?: boolean }) {
  return (
    <>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={640}
        height={640}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-gradient-to-t to-transparent',
          strong
            ? 'from-[var(--shop-bg)] via-[var(--shop-bg)]/55'
            : 'from-[var(--shop-bg)]/92 via-[var(--shop-bg)]/40',
        )}
      />
    </>
  )
}

const cardBaseClass =
  'relative flex min-h-[10rem] flex-col overflow-hidden rounded-xl border border-[var(--shop-card-border)] bg-[var(--shop-card-bg)] p-4 md:min-h-0'

/**
 * One material composition card: name, big percentage numeral, gsm chip,
 * optional image backdrop. Legacy single-material cards carry a free-text
 * `note` instead of numbers.
 */
export function PdpMaterialCard({
  material,
  anchorId,
  previewTarget,
}: {
  material: ResolvedPdpMaterial
  /** Search/preview anchor — only the first card of the group carries it. */
  anchorId?: string
  previewTarget?: string
}) {
  useHighlightOnArrival(anchorId ?? '')
  return (
    <article
      id={anchorId}
      data-reveal
      data-anvl-preview-target={previewTarget}
      className={cn(
        cardBaseClass,
        'justify-end md:col-span-1 md:row-span-1',
        anchorId && 'scroll-mt-[var(--anvl-header-h)]',
      )}
    >
      {material.image ? <CardBackdrop src={material.image} strong /> : null}
      <div className="relative z-10">
        <p className="anvl-display mb-1 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">
          Material
        </p>
        {material.percentage !== null ? (
          <p className="anvl-display text-4xl leading-none text-[var(--shop-text)] md:text-5xl">
            {material.percentage}
            <span className="ml-0.5 align-top text-base text-[var(--shop-accent)]">%</span>
          </p>
        ) : null}
        <p className="mt-1 text-sm font-medium text-[var(--shop-text)]">{material.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {material.gsm !== null ? (
            <span className="anvl-micro rounded-full border border-[var(--shop-card-border)] bg-[var(--shop-bg)]/60 px-2 py-0.5 text-[var(--shop-text-muted)]">
              {material.gsm} GSM
            </span>
          ) : null}
          {material.note ? (
            <span className="anvl-micro text-[var(--shop-text-muted)]">{material.note}</span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/**
 * The care group: one bento tile holding a small card per care instruction —
 * each with its care icon, name, contextual value, and optional note.
 */
export function PdpCareCards({
  items,
  anchorId,
  previewTarget,
}: {
  items: ResolvedPdpCareItem[]
  anchorId?: string
  previewTarget?: string
}) {
  useHighlightOnArrival(anchorId ?? '')
  const shown = items.slice(0, 8)
  const tall = shown.length > 4
  return (
    <article
      id={anchorId}
      data-reveal
      data-anvl-preview-target={previewTarget}
      className={cn(
        cardBaseClass,
        'md:col-span-2',
        tall ? 'md:row-span-2' : 'md:row-span-1',
        anchorId && 'scroll-mt-[var(--anvl-header-h)]',
      )}
    >
      <p className="anvl-display mb-2 text-[10px] tracking-[0.26em] text-[var(--shop-accent)]">
        Care
      </p>
      <ul className="grid flex-1 grid-cols-1 content-start gap-2 overflow-hidden sm:grid-cols-2">
        {shown.map((item) => {
          const Icon = CARE_ICON_COMPONENTS[item.icon]
          const value = formatCareValue(item.value)
          return (
            <li
              key={item.id}
              className="flex items-center gap-2.5 rounded-lg border border-[var(--shop-card-border)] bg-[var(--shop-bg)]/45 px-3 py-2"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--shop-card-border)] text-[var(--shop-accent)]">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-[var(--shop-text)]">
                  {item.name}
                  {value ? (
                    <span className="text-[var(--shop-accent)]"> · {value}</span>
                  ) : null}
                </span>
                {item.note ? (
                  <span className="anvl-micro block truncate text-[var(--shop-text-muted)]">
                    {item.note}
                  </span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

/**
 * One forged-detail card: numbered display numeral, title, description, and an
 * optional image backdrop.
 */
export function PdpDetailCard({
  detail,
  index,
  anchorId,
  previewTarget,
}: {
  detail: ResolvedPdpDetail
  index: number
  anchorId?: string
  previewTarget?: string
}) {
  useHighlightOnArrival(anchorId ?? '')
  return (
    <article
      id={anchorId}
      data-reveal
      data-anvl-preview-target={previewTarget}
      className={cn(
        cardBaseClass,
        'justify-end md:col-span-1 md:row-span-1',
        anchorId && 'scroll-mt-[var(--anvl-header-h)]',
      )}
    >
      {detail.image ? <CardBackdrop src={detail.image} strong /> : null}
      <div className="relative z-10">
        <p className="anvl-display text-lg leading-none text-[var(--shop-accent)]">
          {String(index + 1).padStart(2, '0')}
        </p>
        <p className="mt-1.5 text-sm font-medium text-[var(--shop-text)]">{detail.title}</p>
        {detail.description ? (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--shop-text-muted)]">
            {detail.description}
          </p>
        ) : null}
      </div>
    </article>
  )
}
