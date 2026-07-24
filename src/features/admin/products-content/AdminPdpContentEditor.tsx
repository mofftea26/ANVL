import { Info, Package, QrCode } from '@/shared/icons'
import { Link } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { CareSelector } from '@/features/admin/components/CareSelector'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { usePreviewHoverProps } from '@/features/admin/preview/usePreviewHoverProps'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { previewFieldAnchorId } from '@/features/cms/preview'
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
import {
  convertLegacyPdpCare,
  convertLegacyPdpDetails,
  convertLegacyPdpMaterials,
} from '@/features/cms/pdpContent/pdpContent.convert'
import { Textarea } from '@/shared/components/ui'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { PdpDetailsField } from './PdpDetailsField'
import { PdpMaterialsField } from './PdpMaterialsField'
import { ProductPickerModal } from './ProductPickerModal'
import { ProductSummaryCard } from './ProductSummaryCard'
import { LegacyConvertNotice } from './LegacyConvertNotice'

function useStoredPdpContent(): PdpContentConfig {
  return useSyncExternalStore(
    subscribePdpContentChange,
    () => readPdpContentFromStorage(),
    () => readPdpContentFromStorage(),
  )
}

/**
 * Per-product PDP editor. Pick a product from the product-card modal and author
 * its non-commerce bento content: story, structured materials, structured care
 * (the shared CareSelector), forged-detail cards, and the editorial assets.
 * Blank fields fall back to the product's own data / global slots on the
 * storefront. Legacy free-text material/care/detail blobs still render and can
 * be converted to the structured editors in one click (originals kept). Saved
 * to `pdp_content` via the shared CMS sync.
 */
export function AdminPdpContentEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredPdpContent()
  const { config, setConfig, isDirty, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'pdp-content',
    stored,
    saveAsync: savePdpContentAsync,
    successMessage: 'Product content saved.',
    errorFallbackMessage: 'Could not save product content.',
  })
  usePushPreviewDraft('pdpContent', config)
  const [slug, setSlug] = useState<string>('')
  const [pickerOpen, setPickerOpen] = useState(false)

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
  const selectedProduct = useMemo(
    () => products.find((p) => p.slug === slug) ?? null,
    [products, slug],
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

  const materialsHover = usePreviewHoverProps({ kind: 'content-field', id: 'pdp:materials' })
  const careHover = usePreviewHoverProps({ kind: 'content-field', id: 'pdp:care' })
  const detailsHover = usePreviewHoverProps({ kind: 'content-field', id: 'pdp:details' })

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save content"
      />
    ),
    [save, saving, showSuccess, isDirty],
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
        <li>Materials, care, and forged details render as bento cards on the PDP.</li>
        <li>Blank fields fall back to the product&rsquo;s own data, then the global slots.</li>
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

  if (products.length === 0) {
    return (
      <AdminWorkspace asideLabel="Product content help" aside={rail}>
        <p className="text-sm text-[var(--color-text-muted)]">
          No products available yet. Connect Shopify or seed the catalog to author PDP content.
        </p>
      </AdminWorkspace>
    )
  }

  const hasLegacyMaterial =
    current.materials.length === 0 &&
    (current.materialTitle.trim().length > 0 || current.materialNote.trim().length > 0)
  const hasLegacyCare =
    current.careItems.length === 0 && current.care.some((l) => l.trim().length > 0)
  const hasLegacyDetails =
    current.details.length === 0 && current.designDetails.some((l) => l.trim().length > 0)

  return (
    <AdminWorkspace asideLabel="Product content help" aside={rail}>
      <div className="space-y-6" data-testid="pdp-content-editor">
        <ProductSummaryCard
          product={selectedProduct}
          slug={slug}
          authored={current}
          onChangeProduct={() => setPickerOpen(true)}
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

            <section
              id={previewFieldAnchorId('pdp:materials')}
              {...materialsHover}
              className="space-y-4 rounded-xl border border-[var(--color-line)] p-5"
            >
              <div>
                <h2 className="anvl-heading text-base font-normal">Materials</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Each entry is a bento card (name, percentage, GSM, optional image). Blank → the
                  product&rsquo;s own fabric.
                </p>
              </div>
              {hasLegacyMaterial ? (
                <LegacyConvertNotice
                  label="Legacy material copy"
                  lines={[current.materialTitle, current.materialNote].filter((l) => l.trim())}
                  onConvert={() => patch({ materials: convertLegacyPdpMaterials(current) })}
                />
              ) : null}
              <PdpMaterialsField
                materials={current.materials}
                onChange={(materials) => patch({ materials })}
                assets={mediaAssets}
              />
            </section>

            <section
              id={previewFieldAnchorId('pdp:care')}
              {...careHover}
              className="space-y-4 rounded-xl border border-[var(--color-line)] p-5"
            >
              <div>
                <h2 className="anvl-heading text-base font-normal">Care</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Structured instructions (same editor as the care guide). Blank → the product&rsquo;s
                  own care.
                </p>
              </div>
              {hasLegacyCare ? (
                <LegacyConvertNotice
                  label="Legacy care lines"
                  lines={current.care.filter((l) => l.trim())}
                  onConvert={() => patch({ careItems: convertLegacyPdpCare(current) })}
                />
              ) : null}
              <CareSelector items={current.careItems} onChange={(careItems) => patch({ careItems })} />
            </section>

            <section
              id={previewFieldAnchorId('pdp:details')}
              {...detailsHover}
              className="space-y-4 rounded-xl border border-[var(--color-line)] p-5"
            >
              <div>
                <h2 className="anvl-heading text-base font-normal">Forged details</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Each entry is a card (title, description, optional image). Blank → the
                  product&rsquo;s own design details.
                </p>
              </div>
              {hasLegacyDetails ? (
                <LegacyConvertNotice
                  label="Legacy detail lines"
                  lines={current.designDetails.filter((l) => l.trim())}
                  onConvert={() => patch({ details: convertLegacyPdpDetails(current) })}
                />
              ) : null}
              <PdpDetailsField
                details={current.details}
                onChange={(details) => patch({ details })}
                assets={mediaAssets}
              />
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Package size={15} aria-hidden="true" />
                Editing content for <span className="text-[var(--color-text)]">{selectedProduct?.name ?? slug}</span>.
              </p>
              <Link
                to="/admin/passports"
                search={{ tab: 'content', product: slug }}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] no-underline transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-text)]"
              >
                <QrCode size={ICON_SIZE.sm} aria-hidden="true" />
                Passport content for this product
              </Link>
            </div>
          </>
        ) : null}
      </div>

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={products}
        pdpContent={config}
        selectedSlug={slug}
        onSelect={setSlug}
      />
    </AdminWorkspace>
  )
}
