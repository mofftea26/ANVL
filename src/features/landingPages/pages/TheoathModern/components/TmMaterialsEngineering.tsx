import type { TmResolvedContent } from '../content/theoathModernContent.defaults'
import { TmEyebrow, TmSectionShell } from './TmPrimitives'

/**
 * Materials & Engineering — macro-material imagery with a scroll-linked light
 * sweep (`materialsProgress` drives `--tm-sweep` via the timeline) plus the spec
 * table + construction notes. All figures are CMS/product data, never invented.
 */
export function TmMaterialsEngineering({
  content,
  materialsMacro,
}: {
  content: TmResolvedContent
  materialsMacro: string | null
}) {
  const { materials } = content
  return (
    <TmSectionShell section="materials">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <TmEyebrow>{materials.eyebrow}</TmEyebrow>
          <h2
            data-tm-heading
            data-tm-reveal-m
            className="anvl-heading mt-4 text-3xl uppercase leading-tight sm:text-4xl lg:text-5xl"
          >
            {materials.title}
          </h2>
          <p
            data-tm-reveal
            className="mt-5 text-[color:var(--color-text-muted)]"
          >
            {materials.description}
          </p>

          {materialsMacro ? (
            <div
              data-tm-clip
              data-tm-reveal-m
              className="relative mt-8 aspect-[16/10] overflow-hidden rounded-xl border border-[var(--color-line)]"
            >
              <img
                data-tm-bleed
                src={materialsMacro}
                alt="Fiber-level macro of the knit yarn"
                className="h-[124%] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <ul className="mt-8 space-y-2">
            {materials.notes.map((note) => (
              <li
                key={note}
                data-tm-reveal-m
                className="flex gap-3 text-sm text-[color:var(--color-text-muted)]"
              >
                <span aria-hidden="true" className="text-[color:var(--color-highlight)]">
                  —
                </span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <dl
          data-tm-reveal
          className="grid content-start gap-px overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-line)]"
        >
          {materials.specs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-baseline justify-between gap-4 bg-[var(--color-surface)] p-5"
            >
              <dt className="anvl-micro text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-text-muted)]">
                {spec.label}
              </dt>
              <dd className="text-right text-sm font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </TmSectionShell>
  )
}
