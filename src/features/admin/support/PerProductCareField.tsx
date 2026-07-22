import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { CareSelector } from '@/features/admin/components/CareSelector'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { convertLegacyCareLines } from '@/features/cms/support/supportContent.convert'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { useState } from 'react'

interface PerProductCareFieldProps {
  perProduct: Record<string, CareProductEntry>
  onChange: (next: Record<string, CareProductEntry>) => void
}

const EMPTY_ENTRY: CareProductEntry = { note: '', lines: [], items: [] }

/**
 * Per-product care editor — pick a commerce product, author a short note plus
 * STRUCTURED care instructions (preset + optional value + note rows via
 * {@link CareSelector}). Entries are keyed by product slug (same convention as
 * `pdp_content`). Legacy free-text `lines` are shown read-only with a one-click
 * "Convert to structured" that maps them to generic items — the stored lines
 * themselves are never deleted, so old blobs keep rendering everywhere.
 */
export function PerProductCareField({ perProduct, onChange }: PerProductCareFieldProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const [slug, setSlug] = useState('')

  const entry = slug ? (perProduct[slug] ?? EMPTY_ENTRY) : null

  const setEntry = (patch: Partial<CareProductEntry>) => {
    if (!slug) return
    const current: CareProductEntry = perProduct[slug] ?? EMPTY_ENTRY
    onChange({ ...perProduct, [slug]: { ...current, ...patch } })
  }

  const authoredSlugs = Object.keys(perProduct)
  const legacyLines = entry ? entry.lines.filter((line) => line.trim().length > 0) : []
  const showLegacy = entry !== null && legacyLines.length > 0 && entry.items.length === 0

  return (
    <div className="space-y-4">
      <AdminFieldSelect
        label="Product"
        value={slug}
        onChange={setSlug}
        placeholder={productsQuery.isLoading ? 'Loading products…' : 'Select a product…'}
        options={products.map((p) => ({
          value: p.slug,
          label: p.name,
          description: perProduct[p.slug] ? 'Has care notes' : undefined,
        }))}
        hint={
          authoredSlugs.length > 0
            ? `${authoredSlugs.length} product${authoredSlugs.length === 1 ? '' : 's'} with care notes.`
            : 'No per-product care notes yet.'
        }
      />
      {entry ? (
        <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3">
          <FormField label="Note" hint="A short lead line for this product." labelStyle="micro">
            <Input
              density="compact"
              value={entry.note}
              onChange={(e) => setEntry({ note: e.target.value })}
            />
          </FormField>

          {showLegacy ? (
            <div className="space-y-2 rounded-lg border border-dashed border-[var(--color-line)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Legacy care lines (read-only)
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-text-muted)]">
                {legacyLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                These render on the storefront until structured instructions exist. Convert
                them to editable rows below — the original lines are kept as a backup.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                density="compact"
                onClick={() => setEntry({ items: convertLegacyCareLines(entry) })}
              >
                Convert to structured
              </Button>
            </div>
          ) : null}

          <FormField
            label="Care instructions"
            hint="Structured rows replace the legacy lines on the storefront once any exist."
            labelStyle="micro"
          >
            <CareSelector items={entry.items} onChange={(items) => setEntry({ items })} />
          </FormField>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Pick a product to author its care notes.
        </p>
      )}
    </div>
  )
}
