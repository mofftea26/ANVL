import type { RefObject } from 'react'
import type { AboutResolvedOrb } from '../../content/aboutContent.defaults'

/**
 * The finale's DOM shell. The 3D stage itself lives in the film's persistent
 * canvas (parked at the end of the camera path); this section provides
 * everything around it:
 *
 * - the strike impact frames (`[data-strike-flash]` / `[data-strike-lines]`)
 *   the strike timeline snaps on and burns off
 * - the orb picker chips — the keyboard/AT path into the same strike
 *   ceremony, CSS-revealed once the stage loads (`data-altar-ready`, set by
 *   the load bar) and faded by the strike timeline (`[data-altar-picker]`)
 * - the load bar's portal slot (`#about-altar-load-slot`)
 *
 * NO backdrop imagery here, deliberately: pinning applies a transform, which
 * makes the section its own stacking context — a negative-z child then paints
 * INSIDE the section (i.e. over the fixed canvas) instead of behind it, and
 * the 3D stage vanishes behind the picture. The void gradient, aurora, and
 * dust carry the finale's atmosphere from the canvas instead.
 *
 * While `buildAboutAltarPin` holds this section pinned it flips
 * `data-altar-live` on the experience root — the CSS contract that turns the
 * canvas pointer-live so the anvil is grabbable. Everything here except the
 * chips is pointer-transparent so those events actually reach the canvas.
 */
export function AboutAltarSection({
  orbs,
  sectionRef,
  onPick,
}: {
  orbs: AboutResolvedOrb[]
  sectionRef: RefObject<HTMLElement | null>
  onPick: (index: number) => void
}) {
  return (
    <section
      ref={sectionRef as RefObject<HTMLElement>}
      data-scene="altar"
      id="about-altar"
      aria-labelledby="about-altar-heading"
      className="pointer-events-none relative h-[100svh] overflow-visible"
    >
      <h2 id="about-altar-heading" className="sr-only">
        The Forge Altar
      </h2>

      {/* Impact frames — a white-hot flash + anime radial speed-lines centred
          on the anvil seat. Above the canvas, snapped on by the strike. */}
      <div
        aria-hidden="true"
        data-strike-flash
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 62%, color-mix(in srgb, var(--color-highlight-bright) 80%, white) 0%, color-mix(in srgb, var(--color-highlight) 38%, transparent) 20%, transparent 55%)',
        }}
      />
      <div
        aria-hidden="true"
        data-strike-lines
        className="pointer-events-none absolute inset-0 z-20 opacity-0"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 62%, transparent 0deg 7deg, color-mix(in srgb, var(--color-highlight-bright) 55%, transparent) 7deg 8.4deg)',
          maskImage:
            'radial-gradient(circle at 50% 62%, transparent 13%, black 34%, transparent 60%)',
          WebkitMaskImage:
            'radial-gradient(circle at 50% 62%, transparent 13%, black 34%, transparent 60%)',
        }}
      />

      {/* Orb picker — top of the stage; also the keyboard/AT path into the
          strike ceremony. CSS-hidden until the stage loads (data-altar-ready),
          faded during strikes by the timeline (data-altar-picker), and the one
          pointer-live island in the section. */}
      <div
        data-altar-picker
        className="absolute inset-x-0 top-[calc(var(--anvl-header-h)+4.5rem)] z-10 flex flex-col items-center gap-3 px-6"
      >
        <p
          data-altar-fade
          className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70"
        >
          Strike an orb — it carries you back to its chapter
        </p>
        <div data-altar-fade className="flex flex-wrap items-center justify-center gap-2">
          {orbs.map((orb, i) => (
            <button
              key={orb.id}
              type="button"
              onClick={() => onPick(i)}
              className="focus-ring anvl-display pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_65%,transparent)] px-4 py-2.5 text-[10px] tracking-[0.24em] text-[var(--color-text-muted)] backdrop-blur-sm transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-heading)]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: orb.color, boxShadow: `0 0 6px ${orb.color}` }}
              />
              {orb.label}
            </button>
          ))}
        </div>
      </div>

      {/* The forging bar's portal slot — the lazy WebGL chunk renders into it. */}
      <div
        id="about-altar-load-slot"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[12vh] z-10 flex justify-center"
      />
    </section>
  )
}
