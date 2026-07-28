import { useRef } from 'react'
import { X } from '@/shared/icons'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { AboutOrbContent, AboutOrbHeroBand } from '../components/AboutOrbContent'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { ALTAR_MODAL } from './altarForgeTiming'

/**
 * The strike modal — forged open out of the struck orb's own embers. A dark
 * glass panel whose hairline and bloom carry the orb's color; the panel
 * rises, its content staggers in, and numeric stats count up on open.
 * Focus-trapped (`useDialogFocusTrap`), Escape and backdrop close it, and
 * closing hands control back to the stage (the orb re-materializes in orbit).
 * The orb's fields render through the shared {@link AboutOrbContent} body —
 * the same presentation the mobile page's sections use — with a hero image
 * band ({@link AboutOrbHeroBand}) when the orb carries an image. Desktop
 * altar only; the mobile page lays the same orbs out in normal flow.
 */
export function AboutOrbModal({
  orb,
  image,
  onClose,
  onMeasure,
}: {
  orb: AboutResolvedOrb | null
  image?: string
  onClose: () => void
  /** Reports the panel's laid-out rect (pre-animation, so BEFORE the reveal
   *  transform below shrinks and offsets it) — the shared ember swarm
   *  converges on exactly this rectangle to FORM the panel (see
   *  `AboutAltar`'s `handlePanelMeasure` → `ForgeEmberCanvas`). */
  onMeasure?: (rect: DOMRect) => void
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useDialogFocusTrap({ open: Boolean(orb), panelRef, onClose })

  useGSAP(
    () => {
      if (!orb || !root.current) return
      // Measure at natural layout, BEFORE the reveal transform below is
      // applied (gsap.fromTo sets its from-state immediately), so the ember
      // swarm's target rect matches where the panel will actually stand. This
      // runs in a layout effect, ahead of ForgeEmberCanvas's own measure.
      if (panelRef.current) onMeasure?.(panelRef.current.getBoundingClientRect())
      const q = gsap.utils.selector(root.current)
      // EVERY delay below comes from the altar's one choreography clock
      // (`altarForgeTiming.ts`) — this component mounts AT the hand-off beat,
      // so `ALTAR_MODAL`'s numbers are already in this timeline's frame. They
      // used to be hand-copied magic numbers (1.6 / 1.68 / 1.7 / 1.92 / 2.1)
      // that had to be re-derived by hand whenever AboutAltar's ember chain
      // moved.
      //
      // CRITICAL: the backdrop's blur must be animated as `backdropFilter`,
      // not hidden via opacity — `backdrop-filter` keeps blurring the canvas
      // even at opacity 0 (Chromium), which smeared the embers into nothing.
      // Its delay is therefore pinned to the 3D shroud's cross-fade: it may
      // only start once the in-canvas embers are gone.
      //
      // `immediateRender: false` is load-bearing for the same reason, one step
      // further: a `fromTo` normally applies its from-state on creation, so the
      // element would carry `backdrop-filter: blur(0px)` from the hand-off frame
      // — visually a no-op, but it makes the compositor snapshot and re-filter
      // the whole viewport behind it (a live WebGL canvas plus the ember swarm)
      // every frame of the delay. Deferring the from-state means no
      // backdrop-filter root exists at all until the blur genuinely starts.
      gsap.fromTo(
        q('[data-modal-backdrop]'),
        { opacity: 0, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' },
        {
          opacity: 1,
          backdropFilter: 'blur(10px)',
          webkitBackdropFilter: 'blur(10px)',
          duration: ALTAR_MODAL.backdropDuration,
          ease: 'power2.out',
          delay: ALTAR_MODAL.backdropDelay,
          immediateRender: false,
        },
      )
      // The panel forges in with a touch of depth — tilting up out of the
      // ember plate the swarm is landing on, so the two fuse.
      gsap.fromTo(
        q('[data-modal-panel]'),
        { opacity: 0, scale: 0.94, y: 16, rotateX: 7, transformPerspective: 900 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          duration: ALTAR_MODAL.panelDuration,
          ease: 'expo.out',
          delay: ALTAR_MODAL.panelDelay,
        },
      )
      // Ignition — the panel's edge flashes in the orb's color as the embers
      // fuse into it, then the heat dies down.
      gsap.fromTo(
        q('[data-modal-ignite]'),
        { opacity: 0 },
        {
          opacity: 1,
          duration: ALTAR_MODAL.igniteDuration,
          ease: 'power4.out',
          delay: ALTAR_MODAL.igniteDelay,
          onComplete: () => {
            gsap.to(q('[data-modal-ignite]'), {
              opacity: 0,
              duration: ALTAR_MODAL.igniteFadeDuration,
              ease: 'power2.out',
            })
          },
        },
      )
      gsap.fromTo(
        q('[data-modal-reveal]'),
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: ALTAR_MODAL.contentDuration,
          ease: 'power3.out',
          stagger: ALTAR_MODAL.contentStagger,
          delay: ALTAR_MODAL.contentDelay,
        },
      )
      for (const el of q('[data-modal-stat-value]')) {
        const target = Number((el as HTMLElement).dataset.statTarget)
        if (!Number.isFinite(target)) continue
        const counter = { n: 0 }
        el.textContent = '0'
        gsap.to(counter, {
          n: target,
          duration: ALTAR_MODAL.statsDuration,
          ease: 'power2.out',
          delay: ALTAR_MODAL.statsDelay,
          onUpdate: () => {
            el.textContent = String(Math.round(counter.n))
          },
        })
      }
    },
    { scope: root, dependencies: [orb?.id] },
  )

  if (!orb) return null

  return (
    <div ref={root} className="absolute inset-0 z-[75]">
      {/* Backdrop — dark glass with the orb's own bloom rising behind the panel. */}
      {/* No blur utility class here — the blur is GSAP-driven (see above):
          a static `backdrop-blur` would smear the forming embers from frame
          one even while the element is at opacity 0. */}
      <button
        type="button"
        data-modal-backdrop
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer bg-[color-mix(in_srgb,var(--color-bg)_62%,transparent)] opacity-0"
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 45% at 50% 62%, color-mix(in srgb, ${orb.color} 18%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
        <div
          ref={panelRef}
          data-modal-panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-orb-modal-title"
          className="pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-xl border bg-[color-mix(in_srgb,var(--color-surface)_92%,var(--color-bg))] shadow-[0_30px_90px_rgba(0,0,0,0.7)] will-change-transform"
          // The orb's colour as a custom property so descendants (the close
          // control) can tint themselves through `color-mix` in a class and
          // still keep their `:hover` states — an inline `color` would win over
          // any hover utility.
          style={
            {
              borderColor: `color-mix(in srgb, ${orb.color} 38%, var(--color-line))`,
              '--about-orb-tint': orb.color,
            } as React.CSSProperties
          }
        >
          {/* Hairline in the orb's color across the top of the panel. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${orb.color} 30%, color-mix(in srgb, ${orb.color} 60%, transparent) 70%, transparent)`,
            }}
          />
          {/* Ignition edge — flashes as the ember plate fuses into the panel. */}
          <span
            aria-hidden="true"
            data-modal-ignite
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0"
            style={{
              border: `1px solid color-mix(in srgb, ${orb.color} 80%, white)`,
              boxShadow: `0 0 34px color-mix(in srgb, ${orb.color} 55%, transparent), inset 0 0 26px color-mix(in srgb, ${orb.color} 30%, transparent)`,
            }}
          />
          {/* Close — anchored to the PANEL (not the scroller), so it stays put
              while the content scrolls beneath it. Wears the orb's colour like
              the rest of the panel's hardware: its ring matches the panel's own
              border mix, and the glyph is the orb mixed 45% into
              `--color-heading` — the same "lighten the tint toward the
              foreground" move `resolveForgeRamp` makes for the swarm's cold
              stop. 45% is the contrast floor, not a taste call: it clears WCAG
              AA (≥4.5:1) against the panel for every orb colour in the shipped
              set in BOTH themes (worst case 4.9:1, bone on bone-light), where
              the raw orb colour manages only 1.3:1. Mixing toward the theme's
              own foreground token is what keeps that true for CMS colours the
              set does not contain. */}
          <button
            type="button"
            onClick={onClose}
            className="focus-ring absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--about-orb-tint)_38%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-surface)_72%,transparent)] text-[color-mix(in_srgb,var(--about-orb-tint)_45%,var(--color-heading))] transition-colors hover:border-[var(--about-orb-tint)] hover:bg-[color-mix(in_srgb,var(--about-orb-tint)_16%,var(--color-surface))] hover:text-[var(--color-heading)]"
            aria-label="Close dialog"
          >
            <X size={ICON_SIZE.md} aria-hidden="true" />
          </button>

          {/* data-lenis-prevent: the altar page runs Lenis smooth-wheel, which
              captures wheel events document-wide — on this non-scrolling stage
              that swallowed the wheel before this inner scroller ever saw it.
              The attribute is Lenis's native escape hatch for nested scrollers. */}
          <div
            data-lenis-prevent
            className="relative max-h-[78svh] overflow-y-auto overscroll-contain"
          >
            {/* Hero image band — the orb's own upload (or slot default) with a
                scrim and the label riding it; no band when there is no image. */}
            {image ? <AboutOrbHeroBand orb={orb} image={image} reveal /> : null}

            <div className={image ? 'p-8 pt-6 md:p-10 md:pt-7' : 'p-8 md:p-10'}>
              <AboutOrbContent
                orb={orb}
                headingId="about-orb-modal-title"
                variant="modal"
                reveal
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
