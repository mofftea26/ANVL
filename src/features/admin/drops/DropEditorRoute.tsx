import { Link, useNavigate } from '@tanstack/react-router'
import { Check, Eye, EyeOff, MonitorPlay, Plus, Power, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { toast } from 'sonner'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { DropEditorHeaderMeta } from '@/features/admin/drops/DropEditorHeaderMeta'
import { DropSitePreviewModal } from '@/features/admin/drops/DropSitePreviewModal'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import { DropEditorLivePreview } from '@/features/admin/drops/DropEditorLivePreview'
import {
  deleteDrop,
  persistProductDropLinks,
  resetDropToDefaults,
  saveDrop,
} from '@/features/admin/drops/drops.service'
import {
  collectDropDraftErrors,
  type DropFieldErrors,
} from '@/features/admin/drops/drops.editor.validation'
import { useDropsList } from '@/features/admin/drops/useDrops'
import {
  useDeactivateAdminDropMutation,
  useSetActiveAdminDropMutation,
} from '@/features/admin/drops/useAdminDropsListQuery'
import {
  adminProductIsPubliclyVisible,
  adminProductPrimaryPreviewImage,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import {
  createNewAdminProduct,
  upsertAdminProduct,
} from '@/features/admin/products/products.service'
import type {
  ProductSourceType,
  ProductStatus,
} from '@/features/admin/products/products.types'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import { buildQuickCreateAdminProduct } from '@/features/admin/drops/quickCreateAdminProduct'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { getGlobalBrandSettings } from '@/features/cms/read/themeBrandDefaults'
import { useWebsiteLayout } from '@/features/admin/website-layout/useWebsiteLayout'
import {
  DropEditorFieldError,
} from '@/features/admin/drops/DropEditorFieldError'
import {
  defaultScheduleActivationIso,
  scheduleActivationHint,
} from '@/features/admin/drops/dropScheduleDisplay'
import {
  DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS,
  DROP_EDITOR_SPLIT_LG_MIN_H_CLASS,
  fieldErrorClass,
  type TabId,
} from '@/features/admin/drops/dropEditorRoute.shared'
import { useDropEditorXlPreviewSplit } from '@/features/admin/drops/useDropEditorXlPreviewSplit'
import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { DropThemePaletteCard } from '@/features/admin/drops/DropThemePaletteCard'
import { DebouncedColorField } from '@/features/admin/drops/DebouncedColorField'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import {
  resolveFirstValidationTarget,
  scrollToDropEditorField,
} from '@/features/admin/drops/dropEditorValidationNavigation'
import { useDropLiveOnStorefront } from '@/features/admin/drops/useDropLiveOnStorefront'
import type { CmsDropVisualAssetRole } from '@/features/admin/cmsRemote/uploadCmsMedia'
import { publishStorefrontDropByClientId } from '@/features/admin/cmsRemote/adminCmsPublish'
import { flushAdminCmsRemoteSync } from '@/features/admin/cmsRemote/adminCmsRemoteSync'
import { rehydrateAdminCmsFromRemote } from '@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { notifyStorefrontPublicationChanged } from '@/features/cms/hooks/invalidateStorefrontPublication'
import { notifyAdminDropsListChanged } from '@/features/admin/cmsRemote/invalidateAdminDropsList'

const DropActsBuilderPanel = lazy(() =>
  import('@/features/admin/drops/DropActsBuilderPanel').then((m) => ({
    default: m.DropActsBuilderPanel,
  })),
)

const QUICK_PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
]

const QUICK_PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  inactive: 'Inactive',
  comingSoon: 'Coming soon',
  outOfStock: 'Out of stock',
  sale: 'Sale',
  archived: 'Archived',
}

const QUICK_PRODUCT_CURRENCIES = ['USD', 'EUR', 'GBP'] as const

export function DropEditorRoute({ dropId }: { dropId: string }) {
  const navigate = useNavigate()
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const drops = useDropsList()
  const catalog = useAdminProductsList()
  const websiteLayout = useWebsiteLayout()
  const saved = useMemo(() => drops.find((d) => d.id === dropId), [drops, dropId])

  const [draft, setDraft] = useState(saved)
  const [tab, setTab] = useState<TabId>('basics')
  const [persistedActivateAfterSave, setPersistedActivateAfterSave] = useState(false)
  const persistedActivateAfterSaveRef = useRef(persistedActivateAfterSave)
  persistedActivateAfterSaveRef.current = persistedActivateAfterSave
  const [saveModalActivateAfterSave, setSaveModalActivateAfterSave] = useState(false)
  const confirmSaveWasOpenRef = useRef(false)
  const dropEditorSplitRef = useRef<HTMLDivElement | null>(null)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)

  const [confirmSave, setConfirmSave] = useState(false)
  const [saveInFlight, setSaveInFlight] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmActivateToggle, setConfirmActivateToggle] = useState<
    'activate' | 'deactivate' | null
  >(null)
  const setActiveMut = useSetActiveAdminDropMutation()
  const deactivateMut = useDeactivateAdminDropMutation()
  const activateToggleBusy = setActiveMut.isPending || deactivateMut.isPending
  const [sitePreviewOpen, setSitePreviewOpen] = useState(false)
  const [quickProductOpen, setQuickProductOpen] = useState(false)
  const [quickProductSlug, setQuickProductSlug] = useState('')
  const [quickProductName, setQuickProductName] = useState('')
  const [quickProductPrice, setQuickProductPrice] = useState('48')
  const [quickProductCurrency, setQuickProductCurrency] = useState<string>('USD')
  const [quickProductCategory, setQuickProductCategory] = useState('Apparel')
  const [quickProductShortDesc, setQuickProductShortDesc] = useState('')
  const [quickProductDescription, setQuickProductDescription] = useState('')
  const [quickProductStatus, setQuickProductStatus] =
    useState<ProductStatus>('draft')
  const [quickProductIsActive, setQuickProductIsActive] = useState(false)
  const [quickProductSourceType, setQuickProductSourceType] =
    useState<ProductSourceType>('drop')
  const [quickProductLinkDrop, setQuickProductLinkDrop] = useState(true)
  const [quickProductColorName, setQuickProductColorName] = useState('Black')
  const [quickProductColorHex, setQuickProductColorHex] = useState('#0B0B0C')
  const [quickProductSizes, setQuickProductSizes] = useState('S, M, L, XL')
  const [quickProductSku, setQuickProductSku] = useState('')
  const [quickProductQuantity, setQuickProductQuantity] = useState('24')
  const [quickProductTags, setQuickProductTags] = useState('')
  const [quickProductFit, setQuickProductFit] = useState('')
  const [quickProductFabric, setQuickProductFabric] = useState('')
  const [quickProductGsm, setQuickProductGsm] = useState('')
  const [quickProductImageUrl, setQuickProductImageUrl] = useState('')

  useEffect(() => {
    setDraft(saved)
  }, [saved])

  useEffect(() => {
    if (!confirmSave && confirmSaveWasOpenRef.current) {
      confirmSaveWasOpenRef.current = false
    }
    if (confirmSave && !confirmSaveWasOpenRef.current) {
      confirmSaveWasOpenRef.current = true
      setSaveModalActivateAfterSave(persistedActivateAfterSaveRef.current)
    }
  }, [confirmSave])

  useEffect(() => {
    if (quickProductOpen) return
    setQuickProductSlug('')
    setQuickProductName('')
    setQuickProductPrice('48')
    setQuickProductCurrency('USD')
    setQuickProductCategory('Apparel')
    setQuickProductShortDesc('')
    setQuickProductDescription('')
    setQuickProductStatus('draft')
    setQuickProductIsActive(false)
    setQuickProductSourceType('drop')
    setQuickProductLinkDrop(true)
    setQuickProductColorName('Black')
    setQuickProductColorHex('#0B0B0C')
    setQuickProductSizes('S, M, L, XL')
    setQuickProductSku('')
    setQuickProductQuantity('24')
    setQuickProductTags('')
    setQuickProductFit('')
    setQuickProductFabric('')
    setQuickProductGsm('')
    setQuickProductImageUrl('')
  }, [quickProductOpen])

  // ---- All hooks above this gate ----
  const errors: DropFieldErrors = useMemo(() => {
    if (!draft) return { summary: [], fields: {} }
    return collectDropDraftErrors(draft, drops)
  }, [draft, drops])
  const hasErrors = errors.summary.length > 0

  const previewLabel = useMemo(
    () => (draft ? `${draft.dropNumber}: ${draft.name}` : ''),
    [draft],
  )

  const previewProducts = useMemo(() => {
    if (!draft) return []
    const map = new Map(catalog.map((p) => [p.id, p]))
    return draft.productIds
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter(adminProductIsPubliclyVisible)
      .map((p) => adminProductToLegacy(p, previewLabel))
  }, [catalog, draft, previewLabel])

  const previewLanding = useMemo(
    () =>
      draft
        ? composeLandingPageFromDrop(draft, websiteLayout, {
            editorActsPreview: true,
            editorPreviewHeroFallback: true,
          })
        : null,
    [draft, websiteLayout],
  )

  const landingContentJson = useMemo(
    () => (draft ? JSON.stringify(draft.landingContent) : '{}'),
    [draft],
  )

  const editorReady = Boolean(saved && draft && previewLanding)
  const isLiveOnStorefront = useDropLiveOnStorefront(
    draft?.id,
    Boolean(draft?.isActive),
  )
  const dropMediaUpload = useCallback(
    (role: CmsDropVisualAssetRole) =>
      draft ? { dropSlug: draft.slug, role } : undefined,
    [draft],
  )

  const split = useDropEditorXlPreviewSplit(dropEditorSplitRef, editorReady && tab === 'theme')
  const showThemePreview = tab === 'theme'
  const fillViewportEditor = tab === 'theme' || tab === 'landing'

  const tabWithErrors = useCallback(
    (id: TabId): boolean => {
      const prefixes: Record<TabId, string[]> = {
        basics: ['basics', 'visuals'],
        theme: ['theme'],
        landing: ['landing'],
        products: ['products'],
        seo: ['seo'],
      }
      const keys = prefixes[id]
      return Object.keys(errors.fields).some((k) =>
        keys.some((prefix) => k.startsWith(`${prefix}.`)),
      )
    },
    [errors.fields],
  )

  const attemptSave = useCallback(() => {
    if (hasErrors) {
      toast.error(`${errors.summary.length} issue(s) to fix before saving.`)
      const target = resolveFirstValidationTarget(errors)
      if (target) {
        setTab(target.tab)
        scrollToDropEditorField(target.fieldKey)
      }
      return
    }
    setConfirmSave(true)
  }, [errors, hasErrors])

  const dropToolbarActions = useMemo(() => {
    if (!editorReady || !draft) return null
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminTopbarChipButton
          type="button"
          aria-label="Preview full landing page"
          title="Open full landing preview in a modal"
          icon={<MonitorPlay size={14} />}
          onClick={() => setSitePreviewOpen(true)}
        >
          Preview site
        </AdminTopbarChipButton>
        <AdminTopbarChipButton
          type="button"
          disabled={activateToggleBusy}
          aria-label={
            isLiveOnStorefront
              ? 'Deactivate drop on storefront'
              : 'Activate drop on storefront'
          }
          title={
            isLiveOnStorefront
              ? 'Remove this drop from the live storefront'
              : 'Make this drop the live storefront campaign'
          }
          variant={isLiveOnStorefront ? 'success' : 'default'}
          icon={<Power size={14} />}
          onClick={() =>
            setConfirmActivateToggle(isLiveOnStorefront ? 'deactivate' : 'activate')
          }
        >
          {isLiveOnStorefront ? 'Deactivate' : 'Activate'}
        </AdminTopbarChipButton>
        <AdminTopbarChipButton
          type="button"
          aria-label="Reset drop"
          title="Discard unsaved changes and reset drop to defaults"
          icon={<RotateCcw size={14} />}
          onClick={() => setConfirmReset(true)}
        >
          Reset
        </AdminTopbarChipButton>
        <AdminTopbarChipButton
          type="button"
          aria-label="Delete drop"
          title="Delete this drop"
          icon={<Trash2 size={14} />}
          variant="destructive"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </AdminTopbarChipButton>
        <AdminTopbarChipButton
          type="button"
          aria-label={
            showSuccess ? 'Drop saved' : hasErrors ? 'Save blocked by validation errors' : 'Save drop'
          }
          title={
            hasErrors ? errors.summary.join('\n') : showSuccess ? 'Saved' : 'Save drop'
          }
          disabled={hasErrors}
          icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
          variant={hasErrors ? 'default' : 'primary'}
          onClick={attemptSave}
        >
          {showSuccess ? 'Saved' : 'Save'}
        </AdminTopbarChipButton>
      </div>
    )
  }, [
    activateToggleBusy,
    attemptSave,
    draft,
    editorReady,
    errors.summary,
    hasErrors,
    isLiveOnStorefront,
    showSuccess,
  ])

  useEffect(() => {
    if (!dropToolbarActions) {
      setPageActions(null)
      return
    }
    setPageActions(dropToolbarActions)
    return () => setPageActions(null)
  }, [dropToolbarActions, setPageActions])

  if (!saved || !draft || !previewLanding) {
    return (
      <AdminLayout title="Drop not found" description="This drop does not exist in storage.">
        <AdminCard title="Missing drop">
          <p className="text-sm text-[var(--color-text-muted)]">
            The editor could not resolve this drop id.
          </p>
          <Link
            to="/admin/drops"
            className="mt-4 inline-flex text-[var(--color-heading)] underline"
          >
            Back to drops
          </Link>
        </AdminCard>
      </AdminLayout>
    )
  }

  const tabDefs: Array<{ id: TabId; label: string }> = [
    { id: 'basics', label: 'Basics' },
    { id: 'theme', label: 'Theme' },
    { id: 'landing', label: 'Acts' },
    { id: 'products', label: 'Products' },
    { id: 'seo', label: 'SEO' },
  ]

  function toggleProduct(id: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const has = prev.productIds.includes(id)
      const productIds = has
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id]
      return { ...prev, productIds }
    })
  }

  function moveProduct(id: string, dir: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev
      const idx = prev.productIds.indexOf(id)
      if (idx === -1) return prev
      const next = [...prev.productIds]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { ...prev, productIds: next }
    })
  }

  function applyPreset(id: string) {
    const preset = DROP_THEME_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            theme: structuredClone(preset),
          }
        : prev,
    )
  }

  function createQuickProduct() {
    if (!draft) return
    const priceNum = Number.parseFloat(quickProductPrice)
    const qtyParsed = Number.parseInt(quickProductQuantity.trim(), 10)
    const quantity = Number.isFinite(qtyParsed) ? qtyParsed : 0

    const prepared = buildQuickCreateAdminProduct({
      catalog,
      linkToDropId: quickProductLinkDrop ? draft.id : null,
      name: quickProductName,
      explicitSlug: quickProductSlug,
      price: Number.isFinite(priceNum) ? priceNum : 0,
      currency: quickProductCurrency,
      category: quickProductCategory,
      shortDescription: quickProductShortDesc,
      description: quickProductDescription,
      status: quickProductStatus,
      isActive: quickProductIsActive,
      sourceType: quickProductSourceType,
      tags: quickProductTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      primaryImageUrl: quickProductImageUrl,
      colorName: quickProductColorName,
      colorHex: quickProductColorHex,
      sizesRaw: quickProductSizes,
      skuBase: quickProductSku,
      quantity,
      details: {
        fit: quickProductFit,
        fabric: quickProductFabric,
        gsm: quickProductGsm,
      },
      template: createNewAdminProduct(),
    })

    upsertAdminProduct(prepared)
    persistProductDropLinks(prepared)
    if (quickProductLinkDrop) {
      setDraft((prev) =>
        prev
          ? { ...prev, productIds: [...prev.productIds, prepared.id] }
          : prev,
      )
    }
    toast.success(
      quickProductLinkDrop
        ? 'Product saved and linked to this drop.'
        : 'Product saved to catalog.',
    )
    setQuickProductOpen(false)
  }

  const globalBrand = getGlobalBrandSettings()
  const emblemFallbackPreview =
    globalBrand.emblemFallbackUrl.trim() || undefined
  const wordmarkChainPreview =
    draft.visuals.logoImageUrl?.trim() ||
    draft.visuals.emblemImageUrl?.trim() ||
    globalBrand.emblemFallbackUrl.trim() ||
    ''
  const headerTitle = draft.name.trim() || 'Untitled'

  return (
    <AdminLayout
      layout="wide"
      title={headerTitle}
      description={
        <DropEditorHeaderMeta
          status={draft.status}
          isLive={isLiveOnStorefront}
          errorCount={errors.summary.length}
          errorSummary={errors.summary}
          onValidationClick={() => {
            if (!hasErrors) return
            const target = resolveFirstValidationTarget(errors)
            if (target) {
              setTab(target.tab)
              scrollToDropEditorField(target.fieldKey)
            }
          }}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          role="tablist"
          aria-label="Drop editor sections"
          className="mb-3 flex shrink-0 flex-wrap gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-1.5 backdrop-blur"
        >
          {tabDefs.map((t) => {
            const hasError = tabWithErrors(t.id)
            return (
              <AdminButton
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                type="button"
                variant="adminTabEditor"
                data-active={tab === t.id ? 'true' : 'false'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {hasError ? (
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-red-400"
                  />
                ) : null}
              </AdminButton>
            )
          })}
        </div>

        <div
          ref={dropEditorSplitRef}
          className={cn(
            'flex min-h-0 flex-1 flex-col gap-4 overscroll-x-contain lg:min-h-0 lg:gap-0 lg:overflow-hidden',
            fillViewportEditor && DROP_EDITOR_SPLIT_LG_MIN_H_CLASS,
            fillViewportEditor && 'lg:flex-row lg:items-stretch',
          )}
        >
        {showThemePreview ? (
        <section
          data-testid="drop-editor-preview-column"
          className={cn(
            'order-1 flex w-full min-h-0 flex-col lg:order-1 lg:h-full lg:shrink-0 lg:self-stretch',
            DROP_EDITOR_PREVIEW_PANE_MIN_H_CLASS,
            previewCollapsed && 'max-lg:hidden',
          )}
          style={
            split.isXl
              ? {
                  width: split.previewPx,
                  minWidth: 0,
                }
              : undefined
          }
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <AdminCard
              title={
                <span className="inline-flex items-center gap-2 text-sm">
                  <Eye size={15} aria-hidden="true" />
                  Live preview
                </span>
              }
              description={undefined}
              actions={
                <div className="lg:hidden">
                  <IconButton
                    type="button"
                    aria-expanded={!previewCollapsed}
                    aria-label={
                      previewCollapsed ? 'Show live preview' : 'Hide live preview'
                    }
                    title={
                      previewCollapsed ? 'Show live preview' : 'Hide live preview'
                    }
                    className="border-transparent bg-transparent hover:bg-[var(--color-surface-elevated)]"
                    onClick={() => setPreviewCollapsed((v) => !v)}
                  >
                    {previewCollapsed ? (
                      <Eye size={20} aria-hidden="true" />
                    ) : (
                      <EyeOff size={20} aria-hidden="true" />
                    )}
                  </IconButton>
                </div>
              }
              className="flex min-h-0 flex-1 flex-col !p-3 sm:!p-4 lg:h-full lg:max-h-none [&_header]:mb-2 [&_header]:sm:mb-3"
            >
              <DropEditorLivePreview
                landing={previewLanding}
                products={previewProducts}
                palette={draft.theme}
                emblemUrl={draft.visuals.emblemImageUrl}
                draftActs={draft.acts}
                belowXlCollapse={{
                  collapsed: previewCollapsed,
                  onToggle: () => setPreviewCollapsed((v) => !v),
                }}
              />
            </AdminCard>
          </div>
        </section>
        ) : null}

        {showThemePreview ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize live preview and builder columns"
          tabIndex={0}
          data-testid="drop-editor-xl-sash"
          className={cn(
            'hidden min-h-0 select-none touch-none lg:order-2 lg:flex',
            'cursor-col-resize',
            'self-stretch items-center justify-center px-2',
            'motion-safe:outline-none motion-safe:focus-visible:ring-2 motion-safe:focus-visible:ring-[var(--color-accent)]/45',
            split.isDragging && 'bg-[var(--color-accent)]/8',
          )}
          style={{ width: split.sashWidthPx, flexShrink: 0 }}
          onPointerDown={split.onSashPointerDown}
          onPointerMove={split.onSashPointerMove}
          onPointerUp={split.onSashPointerUp}
          onPointerCancel={split.onSashPointerCancel}
          onLostPointerCapture={split.onSashLostPointerCapture}
          onKeyDown={split.onSashKeyDown}
        >
          <span
            className="pointer-events-none h-16 w-px shrink-0 rounded-full bg-[var(--color-line)]"
            aria-hidden="true"
          />
        </div>
        ) : null}

        <section
          className={cn(
            'order-2 min-w-0 min-h-0 flex-1',
            showThemePreview ? 'lg:order-3 lg:overflow-y-auto lg:overscroll-contain lg:pr-1' : 'overflow-y-auto',
            tab === 'landing' && 'flex flex-col overflow-hidden',
          )}
        >
          {tab === 'basics' ? (
            <AdminCard
              className="h-auto min-h-0"
              title="Basics"
              description="Identity surfaced across admin and routing."
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <label
                  data-drop-field="basics.name"
                  className="text-xs text-[var(--color-text-muted)] lg:col-span-1"
                >
                  Drop name
                  <AdminInput
                    className={errors.fields['basics.name'] ? fieldErrorClass : undefined}
                    value={draft.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setDraft({ ...draft, name, title: name })
                    }}
                  />
                  <DropEditorFieldError message={errors.fields['basics.name']} />
                </label>
                <label className="text-xs text-[var(--color-text-muted)] lg:col-span-1">
                  Drop number
                  <AdminInput
                    value={draft.dropNumber}
                    onChange={(e) =>
                      setDraft({ ...draft, dropNumber: e.target.value })
                    }
                  />
                </label>
                <label
                  data-drop-field="basics.slug"
                  className="text-xs text-[var(--color-text-muted)] lg:col-span-1"
                >
                  Slug
                  <AdminInput
                    className={errors.fields['basics.slug'] ? fieldErrorClass : undefined}
                    value={draft.slug}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                  />
                  <DropEditorFieldError message={errors.fields['basics.slug']} />
                </label>
                <label className="text-xs text-[var(--color-text-muted)] lg:col-span-2">
                  Subtitle
                  <AdminInput
                    value={draft.subtitle}
                    onChange={(e) =>
                      setDraft({ ...draft, subtitle: e.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-[var(--color-text-muted)] lg:col-span-1">
                  <span className="block" id="drop-editor-basics-schedule-label">
                    Scheduled activation (optional)
                  </span>
                  <AdminDateTimeField
                    clear
                    aria-labelledby="drop-editor-basics-schedule-label"
                    className={
                      errors.fields['basics.scheduledActivationAt'] ||
                      errors.fields['basics.releaseDate']
                        ? fieldErrorClass
                        : undefined
                    }
                    error={Boolean(
                      errors.fields['basics.scheduledActivationAt'] ||
                        errors.fields['basics.releaseDate'],
                    )}
                    value={draft.scheduledActivationAt ?? draft.releaseDate}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        scheduledActivationAt: next,
                        releaseDate: next,
                      })
                    }
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <AdminButton
                      type="button"
                      variant="secondary"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        const next = defaultScheduleActivationIso(15)
                        setDraft({
                          ...draft,
                          scheduledActivationAt: next,
                          releaseDate: next,
                        })
                      }}
                    >
                      +15 min
                    </AdminButton>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        const next = defaultScheduleActivationIso(60)
                        setDraft({
                          ...draft,
                          scheduledActivationAt: next,
                          releaseDate: next,
                        })
                      }}
                    >
                      +1 hour
                    </AdminButton>
                  </div>
                  <p className="mt-2 text-[10px] leading-snug text-[var(--color-text-muted)]/90">
                    {scheduleActivationHint(
                      draft.scheduledActivationAt ?? draft.releaseDate,
                      draft.status,
                    )}
                  </p>
                  <DropEditorFieldError
                    message={
                      errors.fields['basics.scheduledActivationAt'] ??
                      errors.fields['basics.releaseDate']
                    }
                  />
                </label>
                <label className="md:col-span-3 text-xs text-[var(--color-text-muted)]">
                  Description
                  <AdminTextarea
                    className="min-h-[96px]"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="mt-8 space-y-4 border-t border-[var(--color-line)]/60 pt-6">
                <AdminMicroHeading as="h3">Campaign emblem</AdminMicroHeading>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Default mark for acts without their own asset. Upload act-specific media in the Acts builder.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <MediaPickerField
                    label="Drop emblem"
                    kind="image"
                    hint="Used across hero, manifesto, and as the act fallback."
                    value={draft.visuals.emblemImageUrl}
                    supabaseUpload={dropMediaUpload('emblem')}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, emblemImageUrl: next },
                      })
                    }
                    fallback="crest"
                    fallbackPreviewSrc={emblemFallbackPreview}
                  />
                  <MediaPickerField
                    label="Wordmark (optional)"
                    kind="image"
                    hint="Wide lockup — selectable as act fallback in the Acts builder."
                    value={draft.visuals.wordmarkImageUrl ?? ''}
                    supabaseUpload={dropMediaUpload('wordmark')}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        visuals: {
                          ...draft.visuals,
                          wordmarkImageUrl: next || undefined,
                        },
                      })
                    }
                    error={errors.fields['visuals.wordmarkImageUrl']}
                    fallback="wordmark"
                    fallbackPreviewSrc={wordmarkChainPreview}
                  />
                </div>
              </div>
            </AdminCard>
          ) : null}

          {tab === 'theme' ? (
            <AdminCard
              className="h-auto min-h-0 border-0 bg-transparent p-0 shadow-none [&_span[aria-hidden]]:hidden"
              title={undefined}
              description={undefined}
            >
              <DropThemePaletteCard
                theme={draft.theme}
                savedTheme={saved.theme}
                onApplyPreset={applyPreset}
                onThemeChange={(next) => setDraft({ ...draft, theme: next })}
              />
            </AdminCard>
          ) : null}

          {tab === 'landing' ? (
            <Suspense
              fallback={
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-8 text-sm text-[var(--color-text-muted)]">
                  Loading acts builder…
                </div>
              }
            >
              <DropActsBuilderPanel
                landingContentJson={landingContentJson}
                acts={draft.acts}
                landingActSequence={draft.landingActSequence}
                catalogProducts={catalog.map((c) => ({ id: c.id, name: c.name }))}
                previewLanding={previewLanding}
                previewProducts={previewProducts}
                palette={draft.theme}
                emblemUrl={draft.visuals.emblemImageUrl}
                wordmarkUrl={draft.visuals.wordmarkImageUrl ?? ''}
                dropSlug={draft.slug}
                fillViewport
                onChange={({ acts, landingActSequence }) =>
                  setDraft((prev) =>
                    prev ? { ...prev, acts, landingActSequence } : prev,
                  )
                }
              />
            </Suspense>
          ) : null}

          {tab === 'products' ? (
            <AdminCard
              className="h-auto min-h-0"
              title="Products in this drop"
              description="Card roster ties catalog rows to this campaign; quick-create saves locally and links bidirectionally."
            >
              <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickProductOpen(true)}
                >
                  <Plus size={14} className="me-1.5" aria-hidden="true" />
                  Quick create product
                </AdminButton>
                <Link
                  to="/admin/products/new"
                  className="text-xs uppercase tracking-[0.18em] text-[var(--color-heading)] underline-offset-4 hover:underline"
                >
                  Open full editor →
                </Link>
              </div>
              {/* Container queries: viewport `sm:` mis-sized the ~460px xl rail (two cramped columns). */}
              <div className="@container/drop-products min-w-0">
                <div className="grid min-w-0 grid-cols-1 gap-3 @min-[520px]/drop-products:grid-cols-2">
                  {catalog.length === 0 ? (
                    <p className="col-span-full text-xs text-[var(--color-text-muted)]">
                      No catalog rows yet — use Quick create or the full editor.
                    </p>
                  ) : null}
                  {catalog.map((p) => {
                    const checked = draft.productIds.includes(p.id)
                    const idx = draft.productIds.indexOf(p.id)
                    const preview = adminProductPrimaryPreviewImage(p)
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          '@container/drop-product-card flex min-w-0 flex-col gap-3 rounded-xl border p-3.5 transition',
                          '@min-[380px]/drop-product-card:flex-row @min-[380px]/drop-product-card:items-stretch @min-[380px]/drop-product-card:gap-3.5',
                          checked
                            ? 'border-[color:color-mix(in_srgb,var(--color-accent)_42%,var(--color-line))] bg-[var(--color-surface-elevated)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--anvl-bone)_10%,transparent)]'
                            : 'border-[var(--color-line)] bg-[var(--color-bg)]/35 hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_22%,var(--color-line))]',
                        )}
                      >
                        <div
                          className={cn(
                            'relative isolate w-full shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_8%,transparent)]',
                            'aspect-[5/4] max-h-[148px] @min-[380px]/drop-product-card:aspect-square @min-[380px]/drop-product-card:h-[7.25rem] @min-[380px]/drop-product-card:max-h-none @min-[380px]/drop-product-card:w-[7.25rem]',
                          )}
                        >
                          {preview ? (
                            <img
                              src={preview.src}
                              alt={preview.alt}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center px-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                              No image
                            </span>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                          <AdminCheckbox
                            className="min-w-0 flex-1 border-0 py-0"
                            checked={checked}
                            onChange={() => toggleProduct(p.id)}
                            label={
                              <span className="block line-clamp-2 text-pretty">
                                {p.name}
                              </span>
                            }
                            description={
                              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] leading-snug text-[var(--color-text-muted)]">
                                <span className="tabular-nums font-medium text-[var(--color-text)]">
                                  ${p.price}
                                </span>
                                <span className="inline-flex max-w-full shrink-0 items-center truncate rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-heading)]">
                                  {p.status}
                                </span>
                                {p.isActive ? (
                                  <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200/95">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-line)]/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                                    Hidden
                                  </span>
                                )}
                              </span>
                            }
                          />
                          {checked ? (
                            <div className="flex flex-wrap items-center gap-1 border-t border-[var(--color-line)]/55 pt-2 @min-[380px]/drop-product-card:mt-auto @min-[380px]/drop-product-card:border-t-0 @min-[380px]/drop-product-card:pt-0">
                              <AdminButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={idx <= 0}
                                onClick={() => moveProduct(p.id, -1)}
                                aria-label={`Move ${p.name} up`}
                              >
                                ↑
                              </AdminButton>
                              <AdminButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={idx === draft.productIds.length - 1}
                                onClick={() => moveProduct(p.id, 1)}
                                aria-label={`Move ${p.name} down`}
                              >
                                ↓
                              </AdminButton>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </AdminCard>
          ) : null}

          {tab === 'seo' ? (
            <AdminCard
              className="h-auto min-h-0"
              title="SEO & unfurls"
              description="Structured into core meta vs Open Graph so long-running drops stay legible in the editor."
            >
              <div className="space-y-8">
                <section className="rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-bg)]/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-heading)]">
                    Core metadata
                  </p>
                  <div className="mt-4 grid gap-4">
                    <label className="text-xs text-[var(--color-text-muted)]">
                      Title{' '}
                      <span className="ml-1 text-[10px] text-[var(--color-text-muted)]/70">
                        ({draft.seo.title.length}/70)
                      </span>
                      <AdminInput
                        className={errors.fields['seo.title'] ? fieldErrorClass : undefined}
                        value={draft.seo.title}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            seo: { ...draft.seo, title: e.target.value },
                          })
                        }
                      />
                      <DropEditorFieldError message={errors.fields['seo.title']} />
                    </label>
                    <label className="text-xs text-[var(--color-text-muted)]">
                      Description{' '}
                      <span className="ml-1 text-[10px] text-[var(--color-text-muted)]/70">
                        ({draft.seo.description.length}/200)
                      </span>
                      <AdminTextarea
                        className={cn(
                          'min-h-[96px]',
                          errors.fields['seo.description'] && fieldErrorClass,
                        )}
                        value={draft.seo.description}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            seo: { ...draft.seo, description: e.target.value },
                          })
                        }
                      />
                      <DropEditorFieldError message={errors.fields['seo.description']} />
                    </label>
                  </div>
                </section>

                <section className="rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-bg)]/30 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-heading)]">
                    Open Graph
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="md:col-span-2 text-xs text-[var(--color-text-muted)] lg:col-span-1">
                      OG title
                      <AdminInput
                        value={draft.seo.ogTitle ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            seo: { ...draft.seo, ogTitle: e.target.value },
                          })
                        }
                      />
                    </label>
                    <div className="md:col-span-2 lg:col-span-1" data-drop-field="seo.ogImage">
                      <MediaPickerField
                        label="OG image"
                        kind="image"
                        hint="Used by social unfurls. Optional."
                        value={draft.seo.ogImage ?? ''}
                        supabaseUpload={dropMediaUpload('og-image')}
                        onChange={(next) =>
                          setDraft({
                            ...draft,
                            seo: { ...draft.seo, ogImage: next || undefined },
                          })
                        }
                        fallback="none"
                        error={errors.fields['seo.ogImage']}
                      />
                    </div>
                    <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                      OG description
                      <AdminTextarea
                        className="min-h-[72px]"
                        value={draft.seo.ogDescription ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            seo: { ...draft.seo, ogDescription: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </section>
              </div>
            </AdminCard>
          ) : null}
        </section>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmSave}
        onClose={() => {
          if (!saveInFlight) setConfirmSave(false)
        }}
        title="Commit changes to storage?"
        confirmLabel="Save"
        confirmLoading={saveInFlight}
        footerBefore={
          <AdminCheckbox
            className="max-w-xl border border-[var(--color-line)]/80 bg-[var(--color-bg)]/25 px-3 py-2"
            checked={saveModalActivateAfterSave}
            onChange={(e) => setSaveModalActivateAfterSave(e.target.checked)}
            label="Activate this drop after saving"
            description="Makes this campaign active in the storefront and deactivates any other active drop."
            disabled={saveInFlight}
          />
        }
        onConfirm={() => {
          void (async () => {
            setSaveInFlight(true)
            try {
              const activate = saveModalActivateAfterSave
              saveDrop(draft, { makeActive: activate })
              setPersistedActivateAfterSave(activate)

              if (getSupabasePublicEnv()) {
                const flushed = await flushAdminCmsRemoteSync()
                if (!flushed.ok) {
                  toast.error(flushed.error)
                  return
                }
                const shouldPublish =
                  activate || isLiveOnStorefront || draft.isActive
                if (shouldPublish) {
                  const published = await publishStorefrontDropByClientId(
                    draft.id,
                  )
                  if (!published.ok) {
                    toast.error(published.error)
                    return
                  }
                  await rehydrateAdminCmsFromRemote()
                  await notifyStorefrontPublicationChanged()
                  toast.success('Drop saved and storefront updated.')
                } else {
                  toast.success('Drop saved.')
                }
                await notifyAdminDropsListChanged()
              } else {
                toast.success('Drop saved.')
              }

              flashSuccess()
              setConfirmSave(false)
              navigate({ to: '/admin/drops' })
            } finally {
              setSaveInFlight(false)
            }
          })()
        }}
      >
        {getSupabasePublicEnv()
          ? 'Saves the drop to Supabase. Live storefront updates when this drop is active (or you check activate below).'
          : 'Updates persist in this browser until Supabase is configured.'}
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmActivateToggle === 'activate'}
        onClose={() => setConfirmActivateToggle(null)}
        title="Make drop active?"
        confirmLabel="Activate"
        confirmDisabled={activateToggleBusy}
        onConfirm={() => {
          if (!draft || confirmActivateToggle !== 'activate') return
          setActiveMut.mutate(draft.id, {
            onSuccess: () => {
              toast.success('Active drop updated.')
              setConfirmActivateToggle(null)
            },
            onError: () => toast.error('Could not activate drop.'),
          })
        }}
      >
        <span className="font-medium text-[var(--color-text)]">{draft.name}</span> will power the
        public landing page and theme. The current active drop will be set to inactive. When
        Supabase is configured, activating also publishes the drop to the live storefront snapshot.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmActivateToggle === 'deactivate'}
        onClose={() => setConfirmActivateToggle(null)}
        title="Deactivate drop?"
        confirmLabel="Deactivate"
        confirmDisabled={activateToggleBusy}
        onConfirm={() => {
          if (!draft || confirmActivateToggle !== 'deactivate') return
          deactivateMut.mutate(draft.id, {
            onSuccess: () => {
              toast.success('Drop deactivated on storefront.')
              setConfirmActivateToggle(null)
            },
            onError: () => toast.error('Could not deactivate drop.'),
          })
        }}
      >
        <span className="font-medium text-[var(--color-text)]">{draft.name}</span> will no longer
        be the live storefront campaign. Visitors will not see this drop as active until you
        activate it again.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Discard unsaved changes?"
        confirmLabel="Reset"
        onConfirm={() => {
          void (async () => {
            const wasActive = draft.isActive
            const next = resetDropToDefaults(draft.id)
            if (next) {
              setDraft(next)
              if (wasActive && getSupabasePublicEnv()) {
                const published = await publishStorefrontDropByClientId(
                  next.id,
                )
                if (!published.ok) {
                  toast.error(published.error)
                } else {
                  await notifyStorefrontPublicationChanged()
                  toast.success('Drop reset and storefront updated.')
                }
              } else {
                toast.success('Drop reset to defaults.')
              }
            }
            setConfirmReset(false)
          })()
        }}
      >
        Restores landing defaults while keeping this drop&apos;s id and slug. Anything not saved is
        lost.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this drop?"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          deleteDrop(draft.id)
          toast.success('Drop removed.')
          setConfirmDelete(false)
          navigate({ to: '/admin/drops' })
        }}
      >
        Removes the drop locally. At least one drop always remains — defaults will respawn if needed.
      </AdminConfirmDialog>

      <Modal
        open={quickProductOpen}
        onClose={() => setQuickProductOpen(false)}
        title="Quick create product"
        className="flex max-h-[min(92vh,calc(100vh-2rem))] max-w-2xl min-h-0 flex-col overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <p className="shrink-0 text-sm text-[var(--color-text-muted)]">
            Saves to the local catalog. Toggle{' '}
            <strong className="font-medium text-[var(--color-text)]">Link this drop</strong> to
            sync roster + assignments — refine variants and PDP SEO in the full catalog editor anytime.
          </p>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <MediaPickerField
              label="Primary image"
              kind="image"
              hint="Embed a small asset or expand “paste URL” for hosted paths."
              value={quickProductImageUrl}
              onChange={setQuickProductImageUrl}
              fallback="none"
              className="rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-bg)]/35 p-3"
            />

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-[var(--color-text-muted)]">Name</span>
                <AdminInput
                  className="mt-0"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  placeholder="Compression tee — graphite"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Slug</span>
                <AdminInput
                  className="mt-0"
                  value={quickProductSlug}
                  onChange={(e) => setQuickProductSlug(e.target.value)}
                  placeholder="Auto from name if empty"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Category</span>
                <AdminInput
                  className="mt-0"
                  value={quickProductCategory}
                  onChange={(e) => setQuickProductCategory(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Price</span>
                <AdminInput
                  className="mt-0"
                  inputMode="decimal"
                  value={quickProductPrice}
                  onChange={(e) => setQuickProductPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Currency</span>
                <AdminSelect
                  value={quickProductCurrency}
                  onValueChange={setQuickProductCurrency}
                >
                  <AdminSelectTrigger aria-label="Currency">
                    <AdminSelectValue placeholder="Currency" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {QUICK_PRODUCT_CURRENCIES.map((c) => (
                      <AdminSelectItem key={c} value={c}>
                        {c}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Status</span>
                <AdminSelect
                  value={quickProductStatus}
                  onValueChange={(v) => setQuickProductStatus(v as ProductStatus)}
                >
                  <AdminSelectTrigger aria-label="Product status">
                    <AdminSelectValue placeholder="Status" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {QUICK_PRODUCT_STATUSES.map((s) => (
                      <AdminSelectItem key={s} value={s}>
                        {QUICK_PRODUCT_STATUS_LABEL[s]}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Listing origin</span>
                <AdminSelect
                  value={quickProductSourceType}
                  onValueChange={(v) =>
                    setQuickProductSourceType(v as ProductSourceType)
                  }
                >
                  <AdminSelectTrigger aria-label="Listing origin">
                    <AdminSelectValue placeholder="Origin" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    <AdminSelectItem value="drop">Drop piece</AdminSelectItem>
                    <AdminSelectItem value="individual">Individual</AdminSelectItem>
                  </AdminSelectContent>
                </AdminSelect>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">
                  SKU prefix <span className="font-normal">(optional)</span>
                </span>
                <AdminInput
                  className="mt-0"
                  value={quickProductSku}
                  onChange={(e) => setQuickProductSku(e.target.value)}
                  placeholder="OATH-TEE"
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Quantity <span className="font-normal">(stock per variant)</span>
                </span>
                <AdminInput
                  className="mt-0"
                  inputMode="numeric"
                  value={quickProductQuantity}
                  onChange={(e) => setQuickProductQuantity(e.target.value)}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs text-[var(--color-text-muted)]">Color name</span>
                <AdminInput
                  className="mt-0"
                  value={quickProductColorName}
                  onChange={(e) => setQuickProductColorName(e.target.value)}
                />
              </div>
              <div className="min-w-0 w-full shrink-0">
                <DebouncedColorField
                  debounceMs={96}
                  density="compact"
                  label="Color hex"
                  value={quickProductColorHex}
                  withAlpha={false}
                  allowEmpty={false}
                  onChange={(next) => setQuickProductColorHex(next)}
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Sizes <span className="font-normal">(comma-separated)</span>
                </span>
                <AdminInput
                  className="mt-0"
                  value={quickProductSizes}
                  onChange={(e) => setQuickProductSizes(e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Tags <span className="font-normal">(comma-separated)</span>
                </span>
                <AdminInput
                  className="mt-0"
                  value={quickProductTags}
                  onChange={(e) => setQuickProductTags(e.target.value)}
                  placeholder="limited, compression, …"
                />
              </div>
            </div>

            <AdminCheckbox
              checked={quickProductIsActive}
              onChange={(e) => setQuickProductIsActive(e.target.checked)}
              label="Active listing"
              description="Inactive / draft statuses still hide from the storefront roster regardless."
            />
            <AdminCheckbox
              checked={quickProductLinkDrop}
              onChange={(e) => setQuickProductLinkDrop(e.target.checked)}
              label="Link this drop"
              description={`Adds "${draft.name.trim() || 'this drop'}" to dropIds and appends to this roster when saved.`}
            />

            <label className="block text-xs text-[var(--color-text-muted)]">
              Short description
              <AdminTextarea
                className="min-h-[72px]"
                value={quickProductShortDesc}
                onChange={(e) => setQuickProductShortDesc(e.target.value)}
              />
            </label>
            <label className="block text-xs text-[var(--color-text-muted)]">
              Full description
              <AdminTextarea
                className="min-h-[100px]"
                value={quickProductDescription}
                onChange={(e) => setQuickProductDescription(e.target.value)}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-xs text-[var(--color-text-muted)]">
                Fit
                <AdminInput
                  value={quickProductFit}
                  onChange={(e) => setQuickProductFit(e.target.value)}
                />
              </label>
              <label className="block text-xs text-[var(--color-text-muted)]">
                Fabric
                <AdminInput
                  value={quickProductFabric}
                  onChange={(e) => setQuickProductFabric(e.target.value)}
                />
              </label>
              <label className="block text-xs text-[var(--color-text-muted)]">
                GSM
                <AdminInput
                  value={quickProductGsm}
                  onChange={(e) => setQuickProductGsm(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--color-line)] pt-4">
            <AdminButton variant="ghost" size="sm" onClick={() => setQuickProductOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton variant="primary" size="sm" onClick={createQuickProduct}>
              Save product
            </AdminButton>
          </div>
        </div>
      </Modal>

      <DropSitePreviewModal
        open={sitePreviewOpen}
        onClose={() => setSitePreviewOpen(false)}
        title={`Preview · ${headerTitle}`}
        landing={previewLanding}
        products={previewProducts}
        palette={draft.theme}
        emblemUrl={draft.visuals.emblemImageUrl}
        draftActs={draft.acts}
      />
    </AdminLayout>
  )
}
