import { useState } from 'react'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { SizeGuideTable, EMPTY_SIZE_TABLE } from '@/features/admin/components/SizeGuideTable'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { convertLegacySizeEntry } from '@/features/cms/support/supportContent.convert'
import type { SizeProductEntry, SizeTable } from '@/features/cms/support/supportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

interface PerProductSizeFieldProps {
  perProduct: Record<string, SizeProductEntry>
  onChange: (next: Record<string, SizeProductEntry>) => void
}

const EMPTY_ENTRY: SizeProductEntry = { note: '', columns: [], rows: [] }

/**
 * Per-product size-table editor — pick a commerce product, author a fit note
 * plus the STRUCTURED fixed measurement grid ({@link SizeGuideTable}: 7
 * measurement rows × XS–XXL, cm). Entries are keyed by product slug (same
 * convention as `pdp_content`). Legacy free-form `columns`/`rows` are shown
 * read-only with a conservative one-click "Convert" (legacy sizes map onto the
 * fixed columns, measurement headings onto rows by name) — the stored legacy
 * fields are never deleted.
 */
export function PerProductSizeField({ perProduct, onChange }: PerProductSizeFieldProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const [slug, setSlug] = useState('')

  const entry = slug ? (perProduct[slug] ?? EMPTY_ENTRY) : null

  const setEntry = (patch: Partial<SizeProductEntry>) => {
    if (!slug) return
    const current: SizeProductEntry = perProduct[slug] ?? EMPTY_ENTRY
    onChange({ ...perProduct, [slug]: { ...current, ...patch } })
  }

  const setTable = (table: SizeTable) => setEntry({ table })

  const authoredSlugs = Object.keys(perProduct)
  const hasStructured = Boolean(
    entry?.table?.rows.some((row) => row.values.some((v) => v.trim().length > 0)),
  )
  const showLegacy = entry !== null && entry.rows.length > 0 && !hasStructured

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
          description: perProduct[p.slug] ? 'Has a size table' : undefined,
        }))}
        hint={
          authoredSlugs.length > 0
            ? `${authoredSlugs.length} product${authoredSlugs.length === 1 ? '' : 's'} with a size table.`
            : 'No per-product size tables yet.'
        }
      />
      {entry ? (
        <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3">
          <FormField label="Note" hint="Optional fit note for this product." labelStyle="micro">
            <Input
              density="compact"
              value={entry.note}
              onChange={(e) => setEntry({ note: e.target.value })}
            />
          </FormField>

          {showLegacy ? (
            <div className="space-y-2 rounded-lg border border-dashed border-[var(--color-line)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Legacy size table (read-only)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      <th className="border-b border-[var(--color-line)] px-2 py-1.5 font-semibold text-[var(--color-text)]">
                        Size
                      </th>
                      {entry.columns.map((column, i) => (
                        <th
                          key={`${column}-${i}`}
                          className="border-b border-[var(--color-line)] px-2 py-1.5 font-semibold text-[var(--color-text)]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entry.rows.map((row, rowIndex) => (
                      <tr key={row.id || rowIndex}>
                        <td className="border-b border-[var(--color-line)] px-2 py-1.5 font-medium text-[var(--color-text)]">
                          {row.size}
                        </td>
                        {entry.columns.map((_, columnIndex) => (
                          <td
                            key={columnIndex}
                            className="border-b border-[var(--color-line)] px-2 py-1.5 text-[var(--color-text-muted)]"
                          >
                            {row.values[columnIndex] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                This legacy table renders on the storefront until the structured grid below
                has values. Convert maps its sizes and measurement headings onto the fixed
                grid — the original table is kept as a backup.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                density="compact"
                onClick={() => setTable(convertLegacySizeEntry(entry))}
              >
                Convert to structured
              </Button>
            </div>
          ) : null}

          <FormField
            label="Measurements"
            hint="The structured grid replaces the legacy table on the storefront once any cell is filled."
            labelStyle="micro"
          >
            <SizeGuideTable value={entry.table ?? EMPTY_SIZE_TABLE} onChange={setTable} />
          </FormField>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Pick a product to build its size table.
        </p>
      )}
    </div>
  )
}
