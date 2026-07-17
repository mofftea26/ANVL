import { Link } from '@tanstack/react-router'
import { BadgeCheck } from 'lucide-react'
import { AnvlCrest } from '@/shared/assets/brand'
import { useOwnedPassportsQuery } from '../hooks/usePassport'
import { isDropComplete, unregistered } from '../lib/relatedProducts'
import type { PassportSectionContext } from './console/passportSections'
import { PassportOwnerTools } from './PassportOwnerTools'
import { PassportShareSection } from './PassportShareSection'

/**
 * The passport's ARMORY tab — one composed surface, not bentos: the ritual
 * controls (wear + feats + shop link), sharing, the top-3 pieces still to
 * forge, and the whole drop as a horizontal carousel. Owner-only.
 */
export function PassportArmoryPanel({ ctx }: { ctx: PassportSectionContext }) {
  const ownedQuery = useOwnedPassportsQuery()
  const owned = ownedQuery.data ?? []
  const related = ctx.related
  const tokenBySlug = new Map(owned.map((p) => [p.productSlug, p.token]))

  const missing = related ? unregistered(related.dropMates, owned) : []
  const suggestions = missing.slice(0, 3)
  const dropComplete = related ? isDropComplete(related, owned) : false

  return (
    <div className="space-y-8">
      {/* Ritual log ------------------------------------------------------ */}
      <section>
        <SectionHeading eyebrow="Ritual log" title="Wear & feats" />
        <PassportOwnerTools token={ctx.token} productSlug={ctx.view.productSlug} />
      </section>

      {/* Share ------------------------------------------------------------ */}
      <section>
        <SectionHeading eyebrow="Spread the forge" title="Share this piece" />
        <PassportShareSection
          productSlug={ctx.view.productSlug}
          productName={ctx.view.productName}
          ownerName={ctx.view.claimedDisplayName ?? 'an ANVL athlete'}
          imageUrl={ctx.content.piece.heroRenderUrl ?? ctx.content.piece.gallery[0]?.src ?? null}
        />
      </section>

      {/* Top 3 to forge ---------------------------------------------------- */}
      {related && related.dropMates.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow="Collection"
            title={dropComplete ? `${related.dropName} — complete` : 'Still to forge'}
          />
          {dropComplete ? (
            <div className="flex max-w-md items-center gap-4 rounded-2xl bg-[linear-gradient(160deg,color-mix(in_oklab,var(--color-highlight)_12%,var(--color-surface))_0%,var(--color-surface)_70%)] p-5">
              <AnvlCrest
                aria-label="ANVL crest"
                className="h-10 w-auto shrink-0 text-[var(--color-highlight-bright)]"
              />
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
                <BadgeCheck aria-hidden="true" className="h-4 w-4 text-[var(--color-success)]" />
                Every piece of the drop stands forged in your armory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {suggestions.map((piece) => (
                <Link
                  key={piece.slug}
                  to="/shop/$slug"
                  params={{ slug: piece.slug }}
                  className="focus-ring group rounded-xl bg-[var(--color-surface-elevated)] p-2.5 no-underline motion-safe:transition-transform hover:-translate-y-1"
                >
                  {piece.image ? (
                    <img
                      src={piece.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="mb-2 aspect-[4/5] w-full rounded-lg object-cover opacity-90 group-hover:opacity-100"
                    />
                  ) : null}
                  <p className="truncate text-[11px] font-semibold text-[var(--color-heading)]">
                    {piece.name}
                  </p>
                  <p className="anvl-micro text-[8px] text-[var(--color-text-muted)]">
                    Not yet registered
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* The drop, as a carousel ------------------------------------------ */}
      {related && related.dropMates.length > 0 ? (
        <section>
          <SectionHeading
            eyebrow={related.dropName || 'The drop'}
            title="The collection"
          />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [mask-image:linear-gradient(90deg,black_calc(100%-24px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.dropMates.map((piece) => {
              const ownToken = tokenBySlug.get(piece.slug)
              const card = (
                <>
                  {piece.image ? (
                    <img
                      src={piece.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      width={240}
                      height={300}
                      className="mb-2 aspect-[4/5] w-full rounded-lg object-cover"
                    />
                  ) : null}
                  <p className="truncate text-[11px] font-semibold text-[var(--color-heading)]">
                    {piece.name}
                  </p>
                  <p className="anvl-micro text-[8px] text-[var(--color-text-muted)]">
                    {ownToken ? 'In your armory — open passport' : 'View in shop'}
                  </p>
                </>
              )
              const shell =
                'focus-ring block w-32 shrink-0 snap-start rounded-xl bg-[var(--color-surface-elevated)] p-2.5 no-underline motion-safe:transition-transform hover:-translate-y-1'
              return ownToken ? (
                <Link key={piece.slug} to="/p/$token" params={{ token: ownToken }} className={shell}>
                  {card}
                </Link>
              ) : (
                <Link key={piece.slug} to="/shop/$slug" params={{ slug: piece.slug }} className={shell}>
                  {card}
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <p className="anvl-micro text-[10px] text-[var(--color-highlight-bright)]">{eyebrow}</p>
      <h3 className="anvl-heading mt-0.5 text-xl text-[var(--color-heading)]">{title}</h3>
    </div>
  )
}
