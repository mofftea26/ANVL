import type { ReactNode } from 'react'
import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'
import { cn } from '@/shared/lib/cn'

/**
 * The parsed document, section by section, so an operator can check the read
 * against the PDF open beside it. Deliberately plain: this is a verification
 * surface, not a presentation of the product.
 *
 * Fields the disclosure policy marks internal-only
 * (`schema/techpackDisclosure.ts`) are shown — the operator needs them — but
 * badged, so nobody copies a supplier cross-reference into public copy.
 */

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className="border-t border-[var(--color-line)] pt-4 first:border-0 first:pt-0">
      <h3 className="anvl-heading text-sm tracking-[0.08em] text-[var(--color-heading)]">
        {title}
        {typeof count === 'number' ? (
          <span className="ml-2 text-[var(--color-text-muted)]">({count})</span>
        ) : null}
      </h3>
      <div className="mt-2 text-sm text-[var(--color-text)]">{children}</div>
    </section>
  )
}

function Empty({ what }: { what: string }) {
  return <p className="text-sm text-[var(--color-text-muted)]">No {what} in this pack.</p>
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="anvl-micro w-32 shrink-0 text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value || '—'}</dd>
    </div>
  )
}

function InternalTag() {
  return (
    <span className="ml-2 rounded-full border border-[var(--color-line)] px-1.5 py-px text-[9px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
      Internal
    </span>
  )
}

const CELL = 'whitespace-nowrap px-2 py-1.5 text-left'

export function TechpackDocumentView({ document }: { document: TechpackDocument }) {
  const { header, colorways, sizing, blueprint, technical, packaging, trims, prints, knits } =
    document

  return (
    <div className="space-y-5">
      <Section title="Header">
        <dl className="space-y-1.5">
          <Field label="Product" value={header.product} />
          <Field label="Style" value={header.style} />
          <Field label="Contrast" value={header.contrast} />
          <Field label="Colorways" value={header.colorwayCount || '—'} />
          <Field label="Fabric" value={header.fabric.raw} />
          <Field
            label="Composition"
            value={header.fabric.composition
              .map((part) =>
                part.percentage == null
                  ? part.material
                  : `${part.percentage}% ${part.material}`,
              )
              .join(' · ')}
          />
          <Field label="GSM" value={header.fabric.gsm ?? '—'} />
          <Field label="Construction" value={header.fabric.construction} />
        </dl>
      </Section>

      <Section title="Colorways" count={colorways.length}>
        {colorways.length === 0 ? (
          <Empty what="colorways" />
        ) : (
          <ul className="space-y-3">
            {colorways.map((colorway) => (
              <li key={`${colorway.index}-${colorway.name}`}>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {colorway.index}. {colorway.name || 'Unnamed'}
                </p>
                <ul className="mt-1 space-y-1">
                  {colorway.roles.map((role) => (
                    <li
                      key={`${role.roleKey}-${role.colorName}`}
                      className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]"
                    >
                      {role.hex ? (
                        <span
                          aria-hidden="true"
                          className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-[var(--color-line)]"
                          style={{ background: role.hex }}
                        />
                      ) : null}
                      <span className="text-[var(--color-text)]">{role.role}</span>
                      <span>{role.colorName}</span>
                      {role.pantone ? <span>· {role.pantone}</span> : null}
                      {role.coloro ? <span>· {role.coloro}</span> : null}
                      {role.hex ? <span>· {role.hex}</span> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Sizing">
        {!sizing || sizing.rows.length === 0 ? (
          <Empty what="sizing table" />
        ) : (
          <>
            <p className="anvl-micro mb-2 text-[var(--color-text-muted)]">
              Measurements as printed, in {sizing.unit === 'in' ? 'inches' : 'centimetres'}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-text-muted)]">
                    <th scope="col" className={CELL}>
                      Point
                    </th>
                    {sizing.sizes.map((size) => (
                      <th scope="col" key={size} className={CELL}>
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizing.rows.map((row) => (
                    <tr
                      key={`${row.letter}-${row.label}`}
                      className="border-b border-[var(--color-line)]/60"
                    >
                      <th scope="row" className={cn(CELL, 'font-normal')}>
                        <span className="text-[var(--color-text)]">
                          {row.letter ? `${row.letter}. ` : ''}
                          {row.label}
                        </span>
                        {row.isHalf ? (
                          <span className="ml-1 text-[var(--color-text-muted)]">(½)</span>
                        ) : null}
                        {row.rowKey ? null : (
                          <span className="ml-1 text-[11px] text-[var(--color-warning)]">
                            unmapped
                          </span>
                        )}
                      </th>
                      {sizing.sizes.map((size, index) => (
                        <td key={size} className={CELL}>
                          {row.values[index] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      <Section title="Blueprint features" count={blueprint.reduce((n, b) => n + b.features.length, 0)}>
        {blueprint.length === 0 ? (
          <Empty what="blueprint pages" />
        ) : (
          blueprint.map((page) => (
            <div key={page.page} className="mb-3 last:mb-0">
              <p className="anvl-micro text-[var(--color-text-muted)]">
                Page {page.page}
                {page.view ? ` · ${page.view}` : ''} · {page.features.length} features
              </p>
              <ul className="mt-1 space-y-1.5">
                {page.features.map((feature) => (
                  <li key={`${page.page}-${feature.code}-${feature.label}`} className="text-[13px]">
                    <span className="anvl-heading mr-2 text-[var(--color-heading)]">
                      {feature.code || '·'}
                    </span>
                    <span className="text-[var(--color-text)]">{feature.label}</span>
                    {feature.detail ? (
                      <span className="text-[var(--color-text-muted)]"> — {feature.detail}</span>
                    ) : null}
                    {feature.positions.length > 1 ? (
                      <span className="text-[var(--color-text-muted)]">
                        {' '}
                        ({feature.positions.length} placements)
                      </span>
                    ) : null}
                    {feature.supplierRef ? (
                      <span className="text-[var(--color-text-muted)]">
                        {' '}
                        {feature.supplierRef}
                        <InternalTag />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      <Section title="Technical">
        {!technical ? (
          <Empty what="technical sheet" />
        ) : (
          <div className="space-y-3">
            <dl className="space-y-1.5">
              <Field label="Base size" value={technical.baseSize} />
              <Field label="Scale" value={technical.scale} />
            </dl>
            {technical.seams.length > 0 ? (
              <ul className="space-y-1 text-[13px]">
                {technical.seams.map((seam, index) => (
                  <li key={`${seam.code}-${index}`} className="text-[var(--color-text)]">
                    {seam.text}
                    {seam.code ? (
                      <span className="text-[var(--color-text-muted)]"> · {seam.code}</span>
                    ) : null}
                    {seam.spi ? (
                      <span className="text-[var(--color-text-muted)]"> · {seam.spi} SPI</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {technical.patternPieces.length > 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {technical.patternPieces.length} dimensioned pattern measurements captured
                <InternalTag />
              </p>
            ) : null}
          </div>
        )}
      </Section>

      <Section title="Care & labels">
        {!packaging ? (
          <Empty what="packaging page" />
        ) : (
          <div className="space-y-2">
            {packaging.careLabel.textAvailable ? (
              <ul className="list-inside list-disc text-[13px] text-[var(--color-text)]">
                {packaging.careLabel.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[var(--color-warning)]">
                The care label is artwork with no text layer — the lines have to come from a
                human before this pack can be imported.
              </p>
            )}
            <dl className="space-y-1.5">
              <Field label="Origin" value={packaging.careLabel.origin} />
              <Field label="Size label" value={packaging.sizeLabel.placement} />
              <Field label="Sizes" value={packaging.sizeLabel.sizes.join(' · ')} />
            </dl>
          </div>
        )}
      </Section>

      <Section title="Trims, prints & knits">
        {trims.length + prints.length + knits.length === 0 ? (
          <Empty what="trims, prints or knits" />
        ) : (
          <ul className="space-y-1 text-[13px]">
            {trims.map((trim) => (
              <li key={`trim-${trim.code}-${trim.name}`}>
                <span className="anvl-heading mr-2 text-[var(--color-heading)]">{trim.code}</span>
                {trim.name}
                {trim.visibleSize ? (
                  <span className="text-[var(--color-text-muted)]"> · {trim.visibleSize}</span>
                ) : null}
              </li>
            ))}
            {[...prints, ...knits].map((artwork) => (
              <li key={`art-${artwork.kind}-${artwork.code}`}>
                <span className="anvl-heading mr-2 text-[var(--color-heading)]">
                  {artwork.code}
                </span>
                {artwork.kind === 'knit' ? 'Knit' : 'Print'}
                {artwork.size ? (
                  <span className="text-[var(--color-text-muted)]"> · {artwork.size}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Pages read" count={document.pages.length}>
        <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
          {document.pages.map((page) => (
            <li key={page.page} className="flex items-baseline gap-2">
              <span className="anvl-micro w-10 shrink-0 text-[var(--color-text-muted)]">
                p{page.page}
              </span>
              <span
                className={
                  page.kind === 'unknown'
                    ? 'text-[var(--color-warning)]'
                    : 'text-[var(--color-text)]'
                }
              >
                {page.kind}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
