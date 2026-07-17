import { Check, Info, Package, Save } from '@/shared/icons'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  readPdpContentFromStorage,
  savePdpContentAsync,
  subscribePdpContentChange,
} from '@/features/cms/pdpContent/pdpContent.settings'
import {
  DEFAULT_PDP_PRODUCT_CONTENT,
  type PdpContentConfig,
  type PdpProductContent,
} from '@/features/cms/pdpContent/pdpContent.zod'
import { Textarea } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

function useStoredPdpContent(): PdpContentConfig {
  return useSyncExternalStore(
    subscribePdpContentChange,
    () => readPdpContentFromStorage(),
    () => readPdpContentFromStorage(),
  )
}

/** Drop blank lines so empty textarea rows never render as empty bullets. */
function sanitizeLines(value: string): string[] {
  return value
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/**
 * Per-product PDP editor. Pick a product (from the commerce catalog — Shopify
 * later) and author the non-commerce bento content for it: story, material,
 * care, forged details, and the editorial assets (material macro, lifestyle,
 * ambient backdrop, size-guide diagram). Blank fields fall back to the product's
 * own data / global slots on the storefront. Saved to `pdp_content` via the
 * shared CMS sync.
 */
export function AdminPdpContentEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredPdpContent()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'pdp-content',
    stored,
    saveAsync: savePdpContentAsync,
    successMessage: 'Product content saved.',
    errorFallbackMessage: 'Could not save product content.',
  })
  const [slug, setSlug] = useState<string>('')

  const productsQuery = useAdminProductCatalogQuery()
  const mediaQuery = useMediaAssetsQuery()
  const products = productsQuery.data?.items ?? []
  const mediaAssets = mediaQuery.data ?? []

  // Default the selection to the first product once loaded.
  useEffect(() => {
    if (!slug && products.length > 0) setSlug(products[0]!.slug)
  }, [products, slug])

  const current: PdpProductContent = useMemo(
    () => config[slug] ?? { ...DEFAULT_PDP_PRODUCT_CONTENT },
    [config, slug],
  )

  const patch = useCallback(
    (next: Partial<PdpProductContent>) => {
      if (!slug) return
      setConfig((prev) => ({
        ...prev,
        [slug]: { ...DEFAULT_PDP_PRODUCT_CONTENT, ...prev[slug], ...next },
      }))
    },
    [slug, setConfig],
  )

  const toolbar = useMemo(
    () => (
      <Button
        type="button"
        disabled={saving}
        variant="primary"
        size="md"
        density="compact"
        loading={saving}
        onClick={save}
      >
        {showSuccess ? <Check size={ICON_SIZE.sm} /> : <Save size={ICON_SIZE.sm} />}
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save content'}
      </Button>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const rail = (
    <AdminRailPanel
      title="How product content works"
      icon={<Info size={17} />}
      description="Authored per product, read by the PDP bento."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Products come from the commerce catalog (Shopify when connected).</li>
        <li>Blank fields fall back to the product's own data, then the global PDP slots.</li>
        <li>Price, sizes, colors, and gallery images stay on the product — not here.</li>
      </ul>
    </AdminRailPanel>
  )

  if (productsQuery.isLoading) {
    return (
      <AdminWorkspace asideLabel="Product content help" aside={rail}>
        <AdminLoadingState message="Loading products…" />
      </AdminWorkspace>
    )
  }

  return (
    <AdminWorkspace asideLabel="Product content help" aside={rail}>
      <div className="space-y-6" data-testid="pdp-content-editor">
        <AdminFieldSelect
          label="Product"
          value={slug}
          onChange={setSlug}
          options={products.map((p) => ({ value: p.slug, label: p.name }))}
          placeholder={products.length === 0 ? 'No products found' : 'Select a product…'}
        />

        {slug ? (
          <>
            <section className="space-y-4 rounded-xl border border-[var(--color-line)] p-5">
              <h2 className="anvl-heading text-base font-normal">Story</h2>
              <FormField label="Story heading" hint="Small eyebrow above the story (blank → “The piece”)." labelStyle="stacked">
                <Input density="compact" value={current.storyHeading} onChange={(e) => patch({ storyHeading: e.target.value })} />
              </FormField>
              <FormField label="Story body" hint="Blank → the product's own storytelling." labelStyle="stacked">
                <Textarea rows={3} value={current.storyBody} onChange={(e) => patch({ storyBody: e.target.value })} />
              </FormField>
            </section>

            <section className="space-y-4 rounded-xl border border-[var(--color-line)] p-5">
              <h2 className="anvl-heading text-base font-normal">Material & care</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Material title" hint="Blank → product fabric." labelStyle="stacked">
                  <Input density="compact" value={current.materialTitle} onChange={(e) => patch({ materialTitle: e.target.value })} />
                </FormField>
                <FormField label="Material note" hint="Blank → product GSM." labelStyle="stacked">
                  <Input density="compact" value={current.materialNote} onChange={(e) => patch({ materialNote: e.target.value })} />
                </FormField>
              </div>
              <FormField label="Care (one per line)" hint="Blank → product care instructions." labelStyle="stacked">
                <Textarea
                  rows={3}
                  value={current.care.join('\n')}
                  onChange={(e) => patch({ care: sanitizeLines(e.target.value) })}
                />
              </FormField>
            </section>

            <section className="space-y-4 rounded-xl border border-[var(--color-line)] p-5">
              <h2 className="anvl-heading text-base font-normal">Forged details</h2>
              <FormField label="Design details (one per line)" hint="Blank → product design details." labelStyle="stacked">
                <Textarea
                  rows={4}
                  value={current.designDetails.join('\n')}
                  onChange={(e) => patch({ designDetails: sanitizeLines(e.target.value) })}
                />
              </FormField>
            </section>

            <section className="space-y-4 rounded-xl border border-[var(--color-line)] p-5">
              <h2 className="anvl-heading text-base font-normal">Editorial assets</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Per-product imagery. Blank → the global <code className="font-mono text-[10px]">Product detail</code> asset slot.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaLibrarySlotField label="Material macro" kind="image" assets={mediaAssets} mediaId={current.materialMacro} onMediaIdChange={(id) => patch({ materialMacro: id })} />
                <MediaLibrarySlotField label="Lifestyle image" kind="image" assets={mediaAssets} mediaId={current.lifestyleImage} onMediaIdChange={(id) => patch({ lifestyleImage: id })} />
                <MediaLibrarySlotField label="Ambient backdrop" kind="image" assets={mediaAssets} mediaId={current.ambientBackdrop} onMediaIdChange={(id) => patch({ ambientBackdrop: id })} />
                <MediaLibrarySlotField label="Size-guide diagram" kind="image" assets={mediaAssets} mediaId={current.sizeGuideDiagram} onMediaIdChange={(id) => patch({ sizeGuideDiagram: id })} />
              </div>
            </section>

            <p className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Package size={15} aria-hidden="true" />
              Editing content for <span className="text-[var(--color-text)]">{products.find((p) => p.slug === slug)?.name ?? slug}</span>.
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            No products available yet. Connect Shopify or seed the catalog to author PDP content.
          </p>
        )}
      </div>
    </AdminWorkspace>
  )
}
