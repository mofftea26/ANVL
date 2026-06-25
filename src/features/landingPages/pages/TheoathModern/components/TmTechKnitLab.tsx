import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmEyebrow, TmSectionShell } from './TmPrimitives'

/**
 * Tech Knit Laboratory — immersive technical storytelling. Macro-knit imagery
 * (CMS `knitMacro`, falls back to a procedural duotone) plus the four
 * construction callouts. No text is baked into images.
 */
export function TmTechKnitLab({
  content,
  knitMacro,
}: {
  content: TmResolvedContent
  knitMacro: string | null
}) {
  const { techKnit } = content
  return (
    <TmSectionShell section="tech-knit">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div
          data-tm-clip
          data-tm-reveal-m
          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)]"
        >
          {knitMacro ? (
            <img
              data-tm-bleed
              src={knitMacro}
              alt="Macro detail of the seamless circular knit"
              className="h-[124%] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,color-mix(in_srgb,var(--color-highlight)_10%,transparent)_0,color-mix(in_srgb,var(--color-highlight)_10%,transparent)_2px,transparent_2px,transparent_7px)]" />
          )}
        </div>

        <div>
          <TmEyebrow>{techKnit.eyebrow}</TmEyebrow>
          <h2
            data-tm-heading
            data-tm-reveal-m
            className="anvl-heading mt-4 text-3xl uppercase leading-tight sm:text-4xl lg:text-5xl"
          >
            {techKnit.title}
          </h2>
          <p
            data-tm-reveal
            className="mt-5 max-w-xl text-[color:var(--color-text-muted)]"
          >
            {techKnit.description}
          </p>
          <ul data-tm-parallax="0.05" className="mt-10 grid gap-px overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2">
            {techKnit.callouts.map((c) => (
              <li
                key={c.id}
                data-tm-reveal-m
                className="bg-[var(--color-surface)] p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em]">
                  {c.label}
                </p>
                <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {c.line}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TmSectionShell>
  )
}
