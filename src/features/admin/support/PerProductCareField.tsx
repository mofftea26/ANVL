import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import type { CareProductEntry } from '@/features/cms/support/supportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useState } from 'react'

interface PerProductCareFieldProps {
  perProduct: Record<string, CareProductEntry>
  onChange: (next: Record<string, CareProductEntry>) => void
}

/**
 * Per-product care notes editor — pick a commerce product, then author a short
 * note plus care lines (one per line). Entries are keyed by product slug (same
 * convention as `pdp_content`); removing all copy drops the entry on save.
 */
export function PerProductCareField({ perProduct, onChange }: PerProductCareFieldProps) {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const [slug, setSlug] = useState('')

  const entry = slug ? (perProduct[slug] ?? { note: '', lines: [] }) : null

  const setEntry = (patch: Partial<CareProductEntry>) => {
    if (!slug) return
    const current: CareProductEntry = perProduct[slug] ?? { note: '', lines: [] }
    onChange({ ...perProduct, [slug]: { ...current, ...patch } })
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
          <FormField label="Care lines" hint="One instruction per line." labelStyle="micro">
            <Textarea
              density="compact"
              rows={4}
              value={entry.lines.join('\n')}
              onChange={(e) => setEntry({ lines: e.target.value.split('\n') })}
            />
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
