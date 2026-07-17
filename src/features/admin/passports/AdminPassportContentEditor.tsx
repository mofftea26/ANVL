import { useMemo, useState, useSyncExternalStore } from 'react'
import { BookOpenText, Pencil, Plus, Trash2 } from '@/shared/icons'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  readPassportContentFromStorage,
  savePassportContentAsync,
  subscribePassportContentChange,
} from '@/features/cms/passportContent/passportContent.settings'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  type PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { PassportContentWizard } from './PassportContentWizard'

function useStoredPassportContent() {
  return useSyncExternalStore(
    subscribePassportContentChange,
    () => readPassportContentFromStorage(),
    () => readPassportContentFromStorage(),
  )
}

/** How many of the six sections carry authored content. */
function authoredSectionCount(c: PassportProductContent): number {
  let n = 0
  if (c.identity.tagline || c.identity.authenticityNote) n += 1
  if (c.piece.heroRender || c.piece.gallery.length) n += 1
  if (c.material.title || c.material.note || c.material.macroAsset) n += 1
  if (c.care.intro || c.care.steps.length || c.care.asset) n += 1
  if (c.details.heading || c.details.story || c.details.facts.length || c.details.funFact) n += 1
  if (c.origin.label || c.origin.place || c.origin.story || c.origin.asset) n += 1
  return n
}

/**
 * /admin/passports · "Passport content" tab — the editorial layer of every
 * product's passport, authored per product through the multi-step wizard
 * (one step per passport section). Saved to `passport_content` via the
 * shared CMS sync; blank fields fall back to PDP content / product data.
 */
export function AdminPassportContentEditor() {
  const stored = useStoredPassportContent()
  const productsQuery = useAdminProductCatalogQuery()
  const mediaQuery = useMediaAssetsQuery()
  const products = productsQuery.data?.items ?? []
  const mediaAssets = mediaQuery.data ?? []

  const [wizardSlug, setWizardSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removeSlug, setRemoveSlug] = useState<string | null>(null)

  const authored = useMemo(
    () =>
      Object.entries(stored).map(([slug, content]) => ({
        slug,
        content,
        product: products.find((p) => p.slug === slug),
        sections: authoredSectionCount(content),
      })),
    [stored, products],
  )
  const unauthored = products.filter((p) => !stored[p.slug])

  const wizardProduct = products.find((p) => p.slug === wizardSlug)

  const saveWizard = async (content: PassportProductContent) => {
    if (!wizardSlug) return
    setSaving(true)
    try {
      await savePassportContentAsync({ ...stored, [wizardSlug]: content })
      toast.success('Passport content saved.')
      setWizardSlug(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save passport content.')
    } finally {
      setSaving(false)
    }
  }

  const removeContent = async () => {
    if (!removeSlug) return
    setSaving(true)
    try {
      const next = { ...stored }
      delete next[removeSlug]
      await savePassportContentAsync(next)
      toast.success('Passport content removed.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove passport content.')
    } finally {
      setSaving(false)
      setRemoveSlug(null)
    }
  }

  const rail = (
    <AdminRailPanel
      title="How passport content works"
      icon={<BookOpenText size={16} aria-hidden="true" />}
      description="Each product's passport is authored section by section — the wizard steps match the passport page's cards exactly."
    >
      <ul className="mt-2 space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>The hero render (transparent PNG) drives the ember particle silhouette.</li>
        <li>Blank fields fall back to PDP content, then the product's own data.</li>
        <li>QR codes live in the other tab — content here applies to every unit of a product.</li>
      </ul>
    </AdminRailPanel>
  )

  if (productsQuery.isLoading) {
    return (
      <AdminWorkspace asideLabel="Passport content help" aside={rail}>
        <AdminLoadingState message="Loading products…" />
      </AdminWorkspace>
    )
  }

  return (
    <AdminWorkspace asideLabel="Passport content help" aside={rail}>
      <div className="space-y-6">
        {authored.length > 0 ? (
          <AdminCard
            title="Authored passports"
            description="Products with passport content. Edit re-opens the wizard; remove clears the content (QR codes are untouched)."
          >
            <ul className="divide-y divide-[var(--color-line)]">
              {authored.map((row) => (
                <li key={row.slug} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {row.product?.name ?? row.slug}
                    </p>
                    <p className="anvl-micro text-[var(--color-text-muted)]">
                      {row.sections} of 6 sections authored
                      {!row.product ? ' · product no longer in catalog' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      density="compact"
                      onClick={() => setWizardSlug(row.slug)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      density="compact"
                      aria-label={`Remove passport content for ${row.product?.name ?? row.slug}`}
                      onClick={() => setRemoveSlug(row.slug)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>
        ) : null}

        <AdminCard
          title="Add passport content"
          description="Products without authored passport content — their passports currently fall back to PDP content and product data."
        >
          {unauthored.length === 0 ? (
            <p className="py-4 text-sm text-[var(--color-text-muted)]">
              {products.length === 0
                ? 'No products in the catalog yet.'
                : 'Every product has passport content — nice.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {unauthored.map((p) => (
                <li key={p.slug} className="flex items-center gap-3 py-3">
                  <p className="min-w-0 flex-1 truncate text-sm text-[var(--color-text)]">
                    {p.name}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    density="compact"
                    onClick={() => setWizardSlug(p.slug)}
                  >
                    <Plus size={15} aria-hidden="true" />
                    Author passport
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {wizardSlug ? (
        <PassportContentWizard
          open
          onClose={() => setWizardSlug(null)}
          productName={wizardProduct?.name ?? wizardSlug}
          initial={stored[wizardSlug] ?? structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT)}
          mediaAssets={mediaAssets}
          saving={saving}
          onSave={(content) => void saveWizard(content)}
        />
      ) : null}

      <AdminConfirmDialog
        open={removeSlug !== null}
        onClose={() => setRemoveSlug(null)}
        title="Remove passport content?"
        confirmLabel="Remove"
        confirmVariant="destructive"
        confirmLoading={saving}
        onConfirm={() => void removeContent()}
      >
        The authored sections for{' '}
        <strong>{products.find((p) => p.slug === removeSlug)?.name ?? removeSlug}</strong> will be
        cleared. Its passports fall back to PDP/product data. QR codes are untouched.
      </AdminConfirmDialog>
    </AdminWorkspace>
  )
}
