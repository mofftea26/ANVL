import { useRef } from 'react'
import { X } from '@/shared/icons'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { useDialogFocusTrap } from '@/shared/hooks/useDialogFocusTrap'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { AboutCtaLink } from '../components/AboutCtaLink'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * The strike modal — forged open out of the orb's explosion. A dark glass
 * panel whose hairline and bloom carry the struck orb's own color; the panel
 * rises, its content staggers in, and numeric stats count up on open.
 * Focus-trapped (`useDialogFocusTrap`), Escape and backdrop close it, and
 * closing hands control back to the stage (the orb re-materializes in orbit).
 * Renders whichever orb fields carry content — orbs are free-form CMS
 * sections. Desktop altar only; the mobile page lays the same orbs out in
 * normal flow.
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
  /** Reports the panel's laid-out rect (pre-animation) — the burst shards
   *  use it to converge into the panel's shape before it materializes. */
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
      gsap.fromTo(q('[data-modal-backdrop]'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      // The panel holds back while the shards draw its rectangle, then
      // materializes inside the formed frame as they dissolve.
      gsap.fromTo(
        q('[data-modal-panel]'),
        { opacity: 0, scale: 0.965 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out', delay: 0.6 },
      )
      gsap.fromTo(
        q('[data-modal-reveal]'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06, delay: 0.8 },
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
          delay: 0.95,
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
      <button
        type="button"
        data-modal-backdrop
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer bg-[color-mix(in_srgb,var(--color-bg)_62%,transparent)] backdrop-blur-md"
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
          {image ? (
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.16]">
              <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 55%, transparent), var(--color-surface) 88%)',
                }}
              />
            </div>
          ) : null}

          <div className="relative max-h-[78svh] overflow-y-auto p-8 md:p-10">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-heading)]"
              aria-label="Close dialog"
            >
              <X size={ICON_SIZE.md} aria-hidden="true" />
            </button>

            <p
              data-modal-reveal
              className="anvl-display text-xs tracking-[0.32em]"
              style={{ color: orb.color }}
            >
              {orb.eyebrow}
            </p>
            <h2
              id="about-orb-modal-title"
              data-modal-reveal
              className="anvl-heading mt-3 max-w-md font-normal leading-[0.95] text-[clamp(1.75rem,3vw,2.75rem)] text-[var(--color-heading)]"
            >
              {orb.title}
            </h2>

            {orb.lines.length > 0 ? (
              <div className="mt-6 space-y-2.5">
                {orb.lines.map((line, i) => (
                  <p
                    key={`${i}-${line}`}
                    data-modal-reveal
                    className="anvl-heading font-normal leading-tight text-[clamp(1.15rem,1.8vw,1.6rem)] text-[var(--color-heading)]/90"
                  >
                    {line}
                  </p>
                ))}
              </div>
            ) : null}

            {orb.body ? (
              <p data-modal-reveal className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-text-muted)]">
                {orb.body}
              </p>
            ) : null}

            {orb.detail ? (
              <p
                data-modal-reveal
                className="mt-5 border-l-2 pl-3 font-sans text-xs uppercase tracking-[0.22em] text-[var(--color-heading)]/80"
                style={{ borderColor: orb.color }}
              >
                {orb.detail}
              </p>
            ) : null}

            {orb.points.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {orb.points.map((p) => (
                  <li key={p.label} data-modal-reveal className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: orb.color }}
                    />
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                      <span className="anvl-display mr-2 text-[11px] tracking-[0.18em] text-[var(--color-heading)]">
                        {p.label}
                      </span>
                      {p.description}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {orb.stats.length > 0 ? (
              <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
                {orb.stats.map((stat) => {
                  const numeric = Number(stat.value)
                  const isNumeric = stat.value.trim().length > 0 && Number.isFinite(numeric)
                  return (
                    <div key={stat.id} data-modal-reveal>
                      <p className="anvl-heading font-normal leading-none text-[clamp(1.75rem,2.6vw,2.5rem)] text-[var(--color-heading)]">
                        {isNumeric ? (
                          <>
                            <span data-modal-stat-value data-stat-target={numeric}>
                              {stat.value}
                            </span>
                            <span style={{ color: orb.color }}>{stat.suffix}</span>
                          </>
                        ) : (
                          <span>
                            {stat.value}
                            {stat.suffix}
                          </span>
                        )}
                      </p>
                      <p className="mt-1.5 text-xs leading-snug text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {orb.primaryCta || orb.secondaryCta ? (
              <div data-modal-reveal className="mt-8 flex flex-wrap gap-3">
                {orb.primaryCta ? (
                  <AboutCtaLink href={orb.primaryCta.href} variant="primary">
                    {orb.primaryCta.label}
                  </AboutCtaLink>
                ) : null}
                {orb.secondaryCta ? (
                  <AboutCtaLink href={orb.secondaryCta.href} variant="secondary">
                    {orb.secondaryCta.label}
                  </AboutCtaLink>
                ) : null}
              </div>
            ) : null}

            {orb.tagline ? (
              <p
                data-modal-reveal
                className="anvl-display mt-8 text-xs tracking-[0.3em]"
                style={{ color: orb.color }}
              >
                {orb.tagline}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
