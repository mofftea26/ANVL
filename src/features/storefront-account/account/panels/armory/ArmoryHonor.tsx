import { Link } from '@tanstack/react-router'
import { Star } from '@/shared/icons'
import type { ArmoryCatalogEntry } from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'
import { buildHonorSlots } from './honorSlots'

/**
 * The Hall of Honor — a shrine of the owner's three best pieces, on lit
 * pedestals. Only shown once at least one piece is pinned (the per-card star is
 * the way in); empty pedestals then invite filling the remaining slots.
 */
export function ArmoryHonor({
  owned,
  catalog,
}: {
  owned: OwnedPassport[]
  catalog: ArmoryCatalogEntry[]
}) {
  const slots = buildHonorSlots(owned, catalog)
  const anyPinned = slots.some((s) => s.passport)
  if (!anyPinned) return null

  return (
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_28%,var(--color-line))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))_0%,var(--color-surface)_100%)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-1.5">
          <Star
            size={13}
            aria-hidden="true"
            className="fill-[var(--color-highlight-bright)] text-[var(--color-highlight-bright)]"
          />
          <h3 className="anvl-micro text-[10px] uppercase tracking-[0.14em] text-[var(--color-heading)]">
            Hall of Honor
          </h3>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {slots.map((slot) =>
            slot.passport ? (
              <Link
                key={slot.slot}
                to="/p/$token"
                params={{ token: slot.passport.token }}
                title={slot.passport.productName}
                aria-label={`Honored: ${slot.passport.productName}`}
                className="focus-ring group relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-bg)_60%,transparent)] motion-safe:transition-transform hover:-translate-y-0.5"
              >
                {slot.image ? (
                  <img
                    src={slot.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Star
                    size={16}
                    aria-hidden="true"
                    className="absolute inset-0 m-auto text-[var(--color-highlight-bright)]"
                  />
                )}
              </Link>
            ) : (
              <div
                key={slot.slot}
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--color-line)]"
              >
                <Star
                  size={13}
                  className="text-[color-mix(in_oklab,var(--color-text-muted)_50%,transparent)]"
                />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
