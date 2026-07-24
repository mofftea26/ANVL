import { useRef } from 'react'
import { X } from '@/shared/icons'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { AboutOrbContent, AboutOrbHeroBand } from '../components/AboutOrbContent'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * The strike modal — forged open out of the orb's explosion. A dark glass
 * panel whose hairline and bloom carry the struck orb's own color; the panel
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
  /** Reports the panel's laid-out rect (pre-animation) — the disintegrated
   *  orb's embers use it to converge and FORM the panel's shape before it
   *  materializes (AltarModalForge). */
  onMeasure?: (rect: DOMRect) => void
}) {
  const root = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useDialogFocusTrap({ open: Boolean(orb), panelRef, onClose })

  useGSAP(
    () => {
      if (!orb || !root.current) return
      // Measure at natural layout, BEFORE any transform, so the particle
      // formation targets match where the panel will actually stand.
      if (panelRef.current) onMeasure?.(panelRef.current.getBoundingClientRect())
      const q = gsap.utils.selector(root.current)
      // Timed to the altar's ember choreography (measure → 0.35s drift hold →
      // 0.9s gather → 0.3s plate HOLD → 0.55s dissolve): the stage stays
      // completely clear until the drawn plate has held its beat (~1.55s),
      // then the backdrop dims and the panel materializes exactly as the
      // swarm dissolves into it — the embers must never play behind the
      // backdrop's blur or the opaque panel.
      // CRITICAL: the backdrop's blur must be animated as `backdropFilter`,
      // not hidden via opacity — `backdrop-filter` keeps blurring the canvas
      // even at opacity 0 (Chromium), which smeared the embers into nothing.
      gsap.fromTo(
        q('[data-modal-backdrop]'),
        { opacity: 0, backdropFilter: 'blur(0px)', webkitBackdropFilter: 'blur(0px)' },
        {
          opacity: 1,
          backdropFilter: 'blur(10px)',
          webkitBackdropFilter: 'blur(10px)',
          duration: 0.6,
          ease: 'power2.out',
          delay: 1.6,
        },
      )
      // The panel forges in with a touch of depth — tilting up out of the
      // ember plate the swarm just drew.
      gsap.fromTo(
        q('[data-modal-panel]'),
        { opacity: 0, scale: 0.94, y: 16, rotateX: 7, transformPerspective: 900 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          duration: 0.6,
          ease: 'expo.out',
          delay: 1.7,
        },
      )
      // Ignition — the panel's edge flashes in the orb's color as the embers
      // fuse into it, then the heat dies down.
      gsap.fromTo(
        q('[data-modal-ignite]'),
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.16,
          ease: 'power4.out',
          delay: 1.68,
          onComplete: () => {
            gsap.to(q('[data-modal-ignite]'), { opacity: 0, duration: 0.7, ease: 'power2.out' })
          },
        },
      )
      gsap.fromTo(
        q('[data-modal-reveal]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06, delay: 1.92 },
      )
      for (const el of q('[data-modal-stat-value]')) {
        const target = Number((el as HTMLElement).dataset.statTarget)
        if (!Number.isFinite(target)) continue
        const counter = { n: 0 }
        el.textContent = '0'
        gsap.to(counter, {
          n: target,
          duration: 1.1,
          ease: 'power2.out',
          delay: 2.1,
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
          style={{ borderColor: `color-mix(in srgb, ${orb.color} 38%, var(--color-line))` }}
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
              while the content scrolls beneath it. */}
          <button
            type="button"
            onClick={onClose}
            className="focus-ring absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_72%,transparent)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-heading)]"
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
