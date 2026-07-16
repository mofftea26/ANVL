import { Link } from '@tanstack/react-router'
import { Star } from 'lucide-react'
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
    <section className="rounded-2xl border border-[color-mix(in_oklab,var(--color-highlight)_28%,var(--color-line))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-highlight)_12%,var(--color-surface))_0%,var(--color-surface)_100%)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Star
          size={16}
          aria-hidden="true"
          className="fill-[var(--color-highlight-bright)] text-[var(--color-highlight-bright)]"
        />
        <h3 className="anvl-heading text-lg text-[var(--color-heading)]">Hall of Honor</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot) =>
          slot.passport ? (
            <Link
              key={slot.slot}
              to="/p/$token"
              params={{ token: slot.passport.token }}
              className="focus-ring group flex flex-col items-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface-elevated)] p-3 no-underline motion-safe:transition-transform hover:-translate-y-1"
            >
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--color-bg)_60%,transparent)]">
                {slot.image ? (
                  <img
                    src={slot.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Star
                    size={20}
                    aria-hidden="true"
                    className="text-[var(--color-highlight-bright)]"
                  />
                )}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,color-mix(in_oklab,var(--color-highlight)_30%,transparent)_100%)]"
                />
              </div>
              <p className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-[var(--color-heading)]">
                {slot.passport.productName}
              </p>
            </Link>
          ) : (
            <div
              key={slot.slot}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--color-line)] p-3 text-center"
            >
              <Star
                size={16}
                aria-hidden="true"
                className="text-[color-mix(in_oklab,var(--color-text-muted)_50%,transparent)]"
              />
              <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
                Pin a piece
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  )
}
