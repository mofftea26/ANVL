import { Link } from '@tanstack/react-router'
import { AuthenticityPlate } from '@/features/passport/components/AuthenticityPlate'
import {
  buildCollectionDrops,
  buildLoadout,
  buildTimeline,
  buildVaultDrops,
  type ArmoryCatalogEntry,
  type VaultSlot,
} from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'
import { cn } from '@/shared/lib/cn'
import { FeaturedPin } from './FeaturedPin'
import { WoreItButton } from './WoreItButton'

/**
 * The Armory's views. All four read the same registered passports + catalog —
 * only the shaping differs (see `passport/lib/armory.ts`). Pure presentation,
 * no data fetching, CSS-only motion so the account stays light.
 */

export type ArmoryViewKey = 'grid' | 'vault' | 'collection' | 'timeline' | 'loadout'

export const ARMORY_VIEWS: Array<{ key: ArmoryViewKey; label: string; blurb: string }> = [
  { key: 'grid', label: 'Grid', blurb: 'Every registered piece' },
  { key: 'vault', label: 'Vault', blurb: 'Your drops as lit slots' },
  { key: 'collection', label: 'Collection', blurb: 'Completion across all drops' },
  { key: 'timeline', label: 'Timeline', blurb: 'In order of registration' },
  { key: 'loadout', label: 'Loadout', blurb: 'Grouped as a kit' },
]

interface ViewProps {
  owned: OwnedPassport[]
  catalog: ArmoryCatalogEntry[]
}

/* --------------------------------------------------------------- Vault --- */

/**
 * The vault wall: your drops as illuminated slots. Registered pieces are lit
 * plates; the rest of the drop sits as an empty socket — you see the gap.
 */
export function ArmoryVaultView({ owned, catalog }: ViewProps) {
  const drops = buildVaultDrops(owned, catalog)
  if (drops.length === 0) return null

  return (
    <div className="space-y-8">
      {drops.map((drop) => (
        <section key={drop.dropName}>
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="anvl-heading text-lg text-[var(--color-heading)]">{drop.dropName}</h3>
            <span className="anvl-micro text-[var(--color-text-muted)]">
              {drop.owned} of {drop.total} forged
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-line)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-bg)_92%,black)_0%,var(--color-surface)_100%)] p-4 sm:grid-cols-3 lg:grid-cols-4">
            {drop.slots.map((slot) => (
              <VaultSlotCard key={slot.slug} slot={slot} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function VaultSlotCard({ slot }: { slot: VaultSlot }) {
  const filled = slot.passport !== null

  const inner = (
    <>
      <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg">
        {filled && slot.image ? (
          <img
            src={slot.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            width={400}
            height={520}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="anvl-heading text-2xl text-[color-mix(in_oklab,var(--color-text-muted)_45%,transparent)]"
          >
            —
          </span>
        )}
        {/* The champagne wash that reads as "lit". */}
        {filled ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,color-mix(in_oklab,var(--color-highlight)_28%,transparent)_100%)] opacity-70 motion-safe:transition-opacity motion-safe:duration-500 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <p
        className={cn(
          'anvl-micro mt-2 truncate text-[10px]',
          filled ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]',
        )}
      >
        {slot.name}
      </p>
      <p className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
        {filled ? 'Registered' : 'Empty socket'}
      </p>
    </>
  )

  const shell = cn(
    'group block rounded-xl border p-2 no-underline motion-safe:transition-all motion-safe:duration-300',
    filled
      ? 'border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[var(--color-surface-elevated)] shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--color-highlight)_60%,transparent)] hover:-translate-y-1'
      : 'border-dashed border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-bg)_75%,transparent)]',
  )

  if (!filled || !slot.passport) {
    return <div className={shell}>{inner}</div>
  }
  return (
    <Link
      to="/p/$token"
      params={{ token: slot.passport.token }}
      aria-label={`Open the ${slot.name} passport`}
      className={cn(shell, 'focus-ring')}
    >
      {inner}
    </Link>
  )
}

/* ---------------------------------------------------------- Collection --- */

/** Completion across every drop — what you hold, what's still missing. */
export function ArmoryCollectionView({ owned, catalog }: ViewProps) {
  const drops = buildCollectionDrops(owned, catalog)
  if (drops.length === 0) return null

  return (
    <div className="space-y-5">
      {drops.map((drop) => {
        const pct = Math.round((drop.owned.length / Math.max(1, drop.total)) * 100)
        return (
          <section
            key={drop.dropName}
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="anvl-heading text-lg text-[var(--color-heading)]">
                {drop.dropName}
              </h3>
              <span className="anvl-micro text-[var(--color-text-muted)]">
                {drop.owned.length} of {drop.total}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={drop.owned.length}
              aria-valuemin={0}
              aria-valuemax={drop.total}
              aria-label={`${drop.dropName} completion`}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)] motion-safe:transition-[width] motion-safe:duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {drop.owned.map((slot) => (
                <Link
                  key={slot.slug}
                  to="/p/$token"
                  params={{ token: slot.passport!.token }}
                  className="focus-ring rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_40%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_12%,transparent)] px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-heading)] no-underline"
                >
                  {slot.name}
                </Link>
              ))}
              {drop.missing.map((slot) => (
                <span
                  key={slot.slug}
                  className="rounded-full border border-dashed border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
                >
                  {slot.name}
                </span>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------ Timeline --- */

/** Registration order — a record of service, newest first. */
export function ArmoryTimelineView({ owned, catalog }: ViewProps) {
  const entries = buildTimeline(owned, catalog)
  if (entries.length === 0) return null

  return (
    <ol className="relative space-y-4 border-l border-[var(--color-line)] pl-6">
      {entries.map((entry) => (
        <li key={entry.passport.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.6rem] top-4 h-2 w-2 rounded-full bg-[var(--color-highlight-bright)] shadow-[0_0_10px_2px_color-mix(in_oklab,var(--color-highlight)_50%,transparent)]"
          />
          <Link
            to="/p/$token"
            params={{ token: entry.passport.token }}
            className="focus-ring flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 no-underline motion-safe:transition-colors hover:border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))]"
          >
            {entry.image ? (
              <img
                src={entry.image}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                width={80}
                height={100}
                className="h-14 w-11 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                {entry.passport.productName}
              </p>
              <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                {entry.dropName ? `${entry.dropName} · ` : ''}
                {[entry.passport.claimedColor, entry.passport.claimedSize]
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            </div>
            <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
              {entry.date ? entry.date.toLocaleDateString() : '—'}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------- Loadout --- */

/** The kit: registered pieces grouped by category. */
export function ArmoryLoadoutView({ owned, catalog }: ViewProps) {
  const slots = buildLoadout(owned, catalog)
  if (slots.length === 0) return null

  return (
    <div className="space-y-6">
      {slots.map((slot) => (
        <section key={slot.category}>
          <p className="anvl-micro mb-2 border-b border-[var(--color-line)] pb-2 uppercase tracking-[0.2em] text-[var(--color-highlight-bright)]">
            {slot.category}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slot.pieces.map(({ passport, image }) => (
              <Link
                key={passport.id}
                to="/p/$token"
                params={{ token: passport.token }}
                className="focus-ring group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3 no-underline motion-safe:transition-transform hover:-translate-y-1"
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    width={300}
                    height={380}
                    className="mb-2 aspect-[3/4] w-full rounded-md object-cover"
                  />
                ) : null}
                <p className="truncate text-xs font-semibold text-[var(--color-heading)]">
                  {passport.productName}
                </p>
                <p className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                  {[passport.claimedColor, passport.claimedSize].filter(Boolean).join(' / ')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Grid --- */

/**
 * The practical default: every registered unit as a plate, with the owner's
 * wear ritual and Hall-of-Honor pin inline. The nav link wraps only the piece
 * itself so the action row's controls stay independently clickable.
 */
export function ArmoryGridView({ owned, catalog }: ViewProps) {
  const catalogBySlug = new Map(catalog.map((p) => [p.slug, p]))
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {owned.map((passport) => {
        const image = catalogBySlug.get(passport.productSlug)?.image
        return (
          <div
            key={passport.id}
            className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 motion-safe:transition-colors"
          >
            <Link
              to="/p/$token"
              params={{ token: passport.token }}
              className="focus-ring flex gap-4 no-underline"
            >
              {image ? (
                <img
                  src={image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  width={120}
                  height={150}
                  className="h-20 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                  {passport.productName}
                </p>
                <div className="mt-2">
                  <AuthenticityPlate editionTotal={passport.editionTotal} size="sm" />
                </div>
                <p className="anvl-micro mt-2 text-[10px] text-[var(--color-text-muted)]">
                  {[passport.claimedColor, passport.claimedSize].filter(Boolean).join(' / ')}
                  {passport.claimedAt
                    ? ` · ${new Date(passport.claimedAt).toLocaleDateString()}`
                    : ''}
                </p>
              </div>
            </Link>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--color-line)] pt-3">
              <WoreItButton passportId={passport.id} wearCount={passport.wearCount} />
              <div className="flex items-center gap-2">
                {passport.lastWornAt ? (
                  <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                    Last worn {new Date(passport.lastWornAt).toLocaleDateString()}
                  </span>
                ) : null}
                <FeaturedPin passport={passport} owned={owned} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
