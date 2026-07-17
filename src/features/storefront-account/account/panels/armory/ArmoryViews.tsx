import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { AuthenticityPlate } from '@/features/passport/components/AuthenticityPlate'
import {
  buildCollectionDrops,
  buildTimeline,
  buildVaultDrops,
  type ArmoryCatalogEntry,
  type VaultSlot,
} from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'
import { cn } from '@/shared/lib/cn'
import { FeaturedPin } from './FeaturedPin'
import { PieceFeats } from './PieceFeats'
import { WoreItButton } from './WoreItButton'

/**
 * The Armory's surfaces. Grid + Vault are the switchable wall views;
 * Collection (accordion) and Timeline (registration record) open from their
 * bento cards as overlays. All read the same passports + catalog, shaped by
 * `passport/lib/armory`. Pure presentation, CSS-only motion.
 */

export type ArmoryViewKey = 'grid' | 'vault'

export const ARMORY_VIEWS: Array<{ key: ArmoryViewKey; label: string; blurb: string }> = [
  { key: 'grid', label: 'Grid', blurb: 'Every registered piece' },
  { key: 'vault', label: 'Vault', blurb: 'Your drops as lit slots' },
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

/**
 * The completionist view — every drop as an expandable row: collapsed shows
 * the completion bar; expanded shows the pieces (owned ones open their
 * passport, missing ones sit dashed). Lives in the Collection overlay.
 */
export function ArmoryCollectionView({ owned, catalog }: ViewProps) {
  const drops = buildCollectionDrops(owned, catalog)
  const [expanded, setExpanded] = useState<string | null>(drops[0]?.dropName ?? null)
  if (drops.length === 0) return null

  return (
    <div className="space-y-3">
      {drops.map((drop) => {
        const pct = Math.round((drop.owned.length / Math.max(1, drop.total)) * 100)
        const isOpen = expanded === drop.dropName
        return (
          <section
            key={drop.dropName}
            className="overflow-hidden rounded-2xl bg-[var(--color-surface-elevated)]"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setExpanded(isOpen ? null : drop.dropName)}
              className="focus-ring flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="anvl-heading truncate text-base text-[var(--color-heading)]">
                    {drop.dropName}
                  </h3>
                  <span className="anvl-micro shrink-0 text-[10px] text-[var(--color-text-muted)]">
                    {drop.owned.length} / {drop.total}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={drop.owned.length}
                  aria-valuemin={0}
                  aria-valuemax={drop.total}
                  aria-label={`${drop.dropName} completion`}
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-bg)]"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)] motion-safe:transition-[width] motion-safe:duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={cn(
                  'shrink-0 text-[var(--color-text-muted)] motion-safe:transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>

            {isOpen ? (
              <div className="grid grid-cols-3 gap-2 px-4 pb-4 sm:grid-cols-4">
                {drop.owned.map((slot) => (
                  <Link
                    key={slot.slug}
                    to="/p/$token"
                    params={{ token: slot.passport!.token }}
                    className="focus-ring group rounded-lg bg-[var(--color-surface)] p-1.5 no-underline motion-safe:transition-transform hover:-translate-y-0.5"
                  >
                    {slot.image ? (
                      <img
                        src={slot.image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        width={200}
                        height={250}
                        className="aspect-[4/5] w-full rounded-md object-cover"
                      />
                    ) : null}
                    <p className="anvl-micro mt-1 truncate text-[9px] text-[var(--color-text)]">
                      {slot.name}
                    </p>
                  </Link>
                ))}
                {drop.missing.map((slot) => (
                  <div
                    key={slot.slug}
                    className="rounded-lg border border-dashed border-[var(--color-line)] p-1.5"
                  >
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md bg-[color-mix(in_oklab,var(--color-bg)_65%,transparent)]">
                      <span
                        aria-hidden="true"
                        className="anvl-heading text-lg text-[color-mix(in_oklab,var(--color-text-muted)_40%,transparent)]"
                      >
                        —
                      </span>
                    </div>
                    <p className="anvl-micro mt-1 truncate text-[9px] text-[var(--color-text-muted)]">
                      {slot.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------ Timeline --- */

/** "3 days ago" style stamp; falls back to the date for older entries. */
function relativeDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function monthLabel(date: Date | null): string {
  if (!date) return 'Undated'
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/**
 * The registration record — every unit newest-first on a champagne spine,
 * grouped by month, each row opening its passport. Lives in the Timeline
 * overlay.
 */
export function ArmoryTimelineView({ owned, catalog }: ViewProps) {
  const entries = buildTimeline(owned, catalog)
  if (entries.length === 0) return null

  // Group consecutive entries by month (entries are already newest-first).
  const groups: Array<{ label: string; items: typeof entries }> = []
  for (const entry of entries) {
    const label = monthLabel(entry.date)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(entry)
    else groups.push({ label, items: [entry] })
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--color-highlight-bright)]">
            {group.label}
          </p>
          <ol className="relative space-y-2 border-l border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] pl-5">
            {group.items.map((entry) => (
              <li key={entry.passport.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.4rem] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--color-highlight-bright)] shadow-[0_0_8px_2px_color-mix(in_oklab,var(--color-highlight)_45%,transparent)]"
                />
                <Link
                  to="/p/$token"
                  params={{ token: entry.passport.token }}
                  className="focus-ring flex items-center gap-3 rounded-xl bg-[var(--color-surface-elevated)] p-2.5 no-underline motion-safe:transition-transform hover:-translate-y-0.5"
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
                      className="h-12 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
                      {entry.passport.productName}
                    </p>
                    <p className="anvl-micro mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-[var(--color-text-muted)]">
                      {entry.dropName ? (
                        <span className="rounded-full bg-[color-mix(in_oklab,var(--color-highlight)_14%,transparent)] px-2 py-0.5 text-[var(--color-heading)]">
                          {entry.dropName}
                        </span>
                      ) : null}
                      {[entry.passport.claimedColor, entry.passport.claimedSize]
                        .filter(Boolean)
                        .join(' / ')}
                    </p>
                  </div>
                  <span className="anvl-micro shrink-0 text-[9px] text-[var(--color-text-muted)]">
                    {entry.date ? relativeDate(entry.date) : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Grid --- */

/**
 * The practical default: every registered unit as a plate, with the owner's
 * wear ritual, feats, and Hall-of-Honor pin inline. The nav link wraps only
 * the piece itself so the action row's controls stay independently clickable.
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
              <WoreItButton
                passportId={passport.id}
                wearCount={passport.wearCount}
                lastWornAt={passport.lastWornAt}
              />
              <div className="flex items-center gap-2">
                {passport.lastWornAt ? (
                  <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                    Last worn {new Date(passport.lastWornAt).toLocaleDateString()}
                  </span>
                ) : null}
                <FeaturedPin passport={passport} owned={owned} />
              </div>
            </div>
            <PieceFeats slug={passport.productSlug} />
          </div>
        )
      })}
    </div>
  )
}
