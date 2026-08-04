import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'

type Blueprint = ResolvedPassportContent['blueprint']

/**
 * The techpack's BASIC SPECS page, rebuilt as CARDS.
 *
 * This section used to pin markers to a technical flat lifted out of the
 * supplier PDF. That drawing was a page crop with residual artefacts, so
 * coordinates measured against it were never better than the crop — the
 * operator's verdict was blunt, and correct. The construction FACTS are the
 * durable part, so they now stand on their own: code, title, body, in a grid.
 *
 * The schematic reading is carried instead by the passport's own product
 * render, which switches to its holographic treatment while this section is
 * open (see `.pp-holo` in `styles.css`). One image, re-lit — not a second,
 * worse one.
 *
 * Static content, so static markup: no controls, no state, no coordinates.
 * The list is the whole surface, which makes it identical for a mouse, a
 * screen reader and a phone.
 */
export function PassportBlueprint({ blueprint }: { blueprint: Blueprint }) {
  const { features } = blueprint
  if (features.length === 0) return null

  return (
    <div className="space-y-5">
      {blueprint.intro ? (
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {blueprint.intro}
        </p>
      ) : null}

      <ol className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {features.map((feature, index) => (
          <li
            key={`${feature.code}-${index}`}
            className={cn(
              'relative overflow-hidden rounded-xl border border-[var(--color-line)] p-4',
              'bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)]',
            )}
          >
            {/* A struck seam along the top edge — the forge detail that keeps a
                grid of text cards from reading as a generic spec table. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px bg-[color-mix(in_oklab,var(--color-highlight)_45%,transparent)]"
            />
            <div className="flex items-start gap-3">
              <CodeChip code={feature.code} />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold leading-snug text-[var(--color-text)]">
                  {feature.title}
                </h3>
                {feature.body ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {feature.body}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * The techpack letter as a stamped die mark.
 *
 * `aria-hidden` because it is provenance, not information: the letter only
 * meant something next to the drawing it was printed on, and read aloud before
 * every title it is pure noise.
 */
function CodeChip({ code }: { code: string }) {
  return (
    <span
      aria-hidden="true"
      className="anvl-display grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-[var(--color-line)] bg-[var(--color-surface-elevated)] text-sm font-bold uppercase text-[var(--color-highlight-bright)]"
    >
      {code}
    </span>
  )
}
