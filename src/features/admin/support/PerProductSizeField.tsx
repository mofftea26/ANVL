import { Plus, Trash2 } from '@/shared/icons'
import { useState } from 'react'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import type { SizeProductEntry, SizeRow } from '@/features/cms/support/supportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface PerProductSizeFieldProps {
  perProduct: Record<string, SizeProductEntry>
  onChange: (next: Record<string, SizeProductEntry>) => void
}

const EMPTY_ENTRY: SizeProductEntry = { note: '', columns: [], rows: [] }

/** Pad/truncate a row's value list to match the current column count. */
function fitValues(values: string[], columnCount: number): string[] {
  const out = values.slice(0, columnCount)
  while (out.length < columnCount) out.push('')
  return out
}

/**
 * Per-product size table editor — pick a commerce product, define the table
 * columns (comma-separated), then add rows (a size label + one value per
 * column). Entries are keyed by product slug (same convention as `pdp_content`).
 */
export function PerProductSizeField({ perProduct, onChange }: PerProductSizeFieldProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const [slug, setSlug] = useState('')

  const entry = slug ? (perProduct[slug] ?? EMPTY_ENTRY) : null

  const setEntry = (next: SizeProductEntry) => {
    if (!slug) return
    onChange({ ...perProduct, [slug]: next })
  }

  const setColumns = (raw: string) => {
    if (!entry) return
    const columns = raw
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    setEntry({
      ...entry,
      columns,
      rows: entry.rows.map((r) => ({ ...r, values: fitValues(r.values, columns.length) })),
    })
  }

  const addRow = () => {
    if (!entry) return
    const row: SizeRow = {
      id: makeSectionId('size'),
      size: '',
      values: fitValues([], entry.columns.length),
    }
    setEntry({ ...entry, rows: [...entry.rows, row] })
  }

  const patchRow = (index: number, patch: Partial<SizeRow>) => {
    if (!entry) return
    setEntry({
      ...entry,
      rows: entry.rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    })
  }

  const setRowValue = (rowIndex: number, colIndex: number, value: string) => {
    if (!entry) return
    setEntry({
      ...entry,
      rows: entry.rows.map((r, i) => {
        if (i !== rowIndex) return r
        const values = fitValues(r.values, entry.columns.length)
        values[colIndex] = value
        return { ...r, values }
      }),
    })
  }

  const removeRow = (index: number) => {
    if (!entry) return
    setEntry({ ...entry, rows: entry.rows.filter((_, i) => i !== index) })
  }

  const authoredSlugs = Object.keys(perProduct)

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
              onChange={(e) => setEntry({ ...entry, note: e.target.value })}
            />
          </FormField>
          <FormField
            label="Columns"
            hint="Comma-separated table headers, e.g. Body chest (cm), Back length (cm)."
            labelStyle="micro"
          >
            <Input
              density="compact"
              value={entry.columns.join(', ')}
              onChange={(e) => setColumns(e.target.value)}
            />
          </FormField>

          <div className="space-y-3">
            {entry.rows.map((row, rowIndex) => (
              <div
                key={row.id || rowIndex}
                className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    Row {rowIndex + 1}
                  </span>
                  <IconButton
                    type="button"
                    size="sm"
                    aria-label={`Remove row ${rowIndex + 1}`}
                    onClick={() => removeRow(rowIndex)}
                  >
                    <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                  </IconButton>
                </div>
                <FormField label="Size" labelStyle="micro">
                  <Input
                    density="compact"
                    value={row.size}
                    onChange={(e) => patchRow(rowIndex, { size: e.target.value })}
                  />
                </FormField>
                {entry.columns.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {entry.columns.map((col, colIndex) => (
                      <FormField key={colIndex} label={col || `Column ${colIndex + 1}`} labelStyle="micro">
                        <Input
                          density="compact"
                          value={fitValues(row.values, entry.columns.length)[colIndex]}
                          onChange={(e) => setRowValue(rowIndex, colIndex, e.target.value)}
                        />
                      </FormField>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Add columns above to give this row values.
                  </p>
                )}
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" size="sm" density="compact" onClick={addRow}>
            <Plus size={ICON_SIZE.sm} aria-hidden="true" />
            Add row
          </Button>
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)]">
          Pick a product to build its size table.
        </p>
      )}
    </div>
  )
}
