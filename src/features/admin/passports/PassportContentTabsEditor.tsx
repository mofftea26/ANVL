import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Eye, User, Users } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { usePreviewHoverProps } from '@/features/admin/preview/usePreviewHoverProps'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import {
  openAdminPreview,
  requestPreviewRoute,
} from '@/features/admin/preview/adminPreviewStore'
import { previewFieldAnchorId } from '@/features/cms/preview'
import {
  readPassportContentFromStorage,
  savePassportContentAsync,
  subscribePassportContentChange,
} from '@/features/cms/passportContent/passportContent.settings'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  type PassportContentConfig,
  type PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'
import {
  buildPassportPreviewRoute,
  type PassportPreviewView,
} from '@/features/passport/lib/passportPreview'
import {
  CareStep,
  DetailsStep,
  FitStep,
  ForgeNotesStep,
  HotspotsStep,
  IdentityStep,
  MaterialStep,
  OriginStep,
  PieceStep,
  SpecsStep,
  type PassportPatch,
  type PassportStepProps,
} from './passportWizardSteps'

function useStoredPassportContent(): PassportContentConfig {
  return useSyncExternalStore(
    subscribePassportContentChange,
    () => readPassportContentFromStorage(),
    () => readPassportContentFromStorage(),
  )
}

interface PassportTab {
  key: string
  title: string
  blurb: string
  /** Storefront preview target this tab authors (bidirectional inspect anchor). */
  targetId: string
  body: (props: PassportStepProps) => React.ReactNode
}

const TABS: PassportTab[] = [
  { key: 'identity', title: 'Identity', blurb: 'Tagline under the product name and the authenticity note.', targetId: 'passport:identity', body: IdentityStep },
  { key: 'piece', title: 'The piece', blurb: 'Hero render (feeds the ember silhouette) and the gallery.', targetId: 'passport:piece', body: PieceStep },
  { key: 'material', title: 'Material', blurb: 'Fabric story + macro shot.', targetId: 'passport:material', body: MaterialStep },
  { key: 'specs', title: 'Specifications', blurb: 'Construction, fit, compression, stretch, breathability, use.', targetId: 'passport:specs', body: SpecsStep },
  { key: 'care', title: 'Care ritual', blurb: 'Care symbols and the numbered ritual steps.', targetId: 'passport:care', body: CareStep },
  { key: 'fit', title: 'Fit & sizing', blurb: 'Measurements, model fit, and the canonical size map.', targetId: 'passport:fit', body: FitStep },
  { key: 'hotspots', title: 'Design details', blurb: 'Pin markers on the render for customers to explore.', targetId: 'passport:piece', body: HotspotsStep },
  { key: 'forgeNotes', title: 'Forge notes', blurb: 'Development fact cards — revisions, testing, hidden details.', targetId: 'passport:forge-notes', body: ForgeNotesStep },
  { key: 'details', title: 'Details & story', blurb: 'Design facts, the story, and one forge fact.', targetId: 'passport:details', body: DetailsStep },
  { key: 'origin', title: 'Origin', blurb: 'Where and how this piece was forged.', targetId: 'passport:origin', body: OriginStep },
]

/**
 * `/admin/passports/content/$slug` — the per-product passport editor as a full
 * page with the sections as TABS (replacing the old modal wizard). Each tab
 * authors one passport section into `passport_content`; save publishes via the
 * shared CMS sync. Unsaved edits stream to the live preview, and the Guest /
 * Owner control forces the previewed passport into each surface.
 */
export function PassportContentTabsEditor({ productSlug }: { productSlug: string }) {
  const setPageActions = useAdminPageActions()
  const stored = useStoredPassportContent()
  const { config, setConfig, isDirty, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'passport-content',
    stored,
    saveAsync: savePassportContentAsync,
    successMessage: 'Passport content saved.',
    errorFallbackMessage: 'Could not save passport content.',
  })
  usePushPreviewDraft('passportContent', config)

  const productsQuery = useAdminProductCatalogQuery()
  const mediaQuery = useMediaAssetsQuery()
  const products = productsQuery.data?.items ?? []
  const mediaAssets = mediaQuery.data ?? []
  const product = products.find((p) => p.slug === productSlug) ?? null

  const [activeKey, setActiveKey] = useState(TABS[0]!.key)
  const [previewView, setPreviewView] = useState<PassportPreviewView>('owner')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const current: PassportProductContent = useMemo(
    () => config[productSlug] ?? structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT),
    [config, productSlug],
  )

  const setCurrent: Dispatch<SetStateAction<PassportProductContent>> = useCallback(
    (updater) => {
      setConfig((prev) => {
        const prevCurrent = prev[productSlug] ?? structuredClone(DEFAULT_PASSPORT_PRODUCT_CONTENT)
        const next = typeof updater === 'function' ? updater(prevCurrent) : updater
        return { ...prev, [productSlug]: next }
      })
    },
    [productSlug, setConfig],
  )

  const patch: PassportPatch = useCallback(
    (key, value) =>
      setCurrent((prev) => ({ ...prev, [key]: { ...prev[key], ...value } })),
    [setCurrent],
  )

  // Keep the preview panel pointed at THIS product's passport in the chosen
  // surface — consumed whenever the panel opens (topbar or the button below).
  useEffect(() => {
    requestPreviewRoute(buildPassportPreviewRoute(productSlug, previewView))
  }, [productSlug, previewView])

  const openPreview = useCallback(
    (view: PassportPreviewView) => {
      setPreviewView(view)
      requestPreviewRoute(buildPassportPreviewRoute(productSlug, view))
      openAdminPreview()
    },
    [productSlug],
  )

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save passport"
      />
    ),
    [save, saving, showSuccess, isDirty],
  )
  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === activeKey))
  const activeTab = TABS[activeIndex]!

  // Stable DOM id per tab. The first tab authoring a given preview target owns
  // that target's inspect anchor (`previewFieldAnchorId`); tabs that share a
  // target (piece + design details → passport:piece) fall back to a plain id so
  // no anchor id is ever duplicated.
  const tabDomIds = useMemo(() => {
    const seen = new Set<string>()
    return TABS.map((t) => {
      if (!seen.has(t.targetId)) {
        seen.add(t.targetId)
        return previewFieldAnchorId(t.targetId)
      }
      return `passport-tab-${t.key}`
    })
  }, [])

  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const nextIndex = (activeIndex + delta + TABS.length) % TABS.length
    setActiveKey(TABS[nextIndex]!.key)
    tabRefs.current[nextIndex]?.focus()
  }

  const rail = (
    <AdminRailPanel
      title="Live preview"
      icon={<Eye size={16} aria-hidden="true" />}
      description="See this passport with your unsaved edits, in both surfaces."
    >
      <div
        role="group"
        aria-label="Preview surface"
        className="mt-2 grid grid-cols-2 gap-2"
      >
        <button
          type="button"
          aria-pressed={previewView === 'guest'}
          onClick={() => openPreview('guest')}
          className={cn(
            'focus-ring flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
            previewView === 'guest'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
              : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
          )}
        >
          <Users size={ICON_SIZE.sm} aria-hidden="true" />
          Guest view
        </button>
        <button
          type="button"
          aria-pressed={previewView === 'owner'}
          onClick={() => openPreview('owner')}
          className={cn(
            'focus-ring flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
            previewView === 'owner'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
              : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
          )}
        >
          <User size={ICON_SIZE.sm} aria-hidden="true" />
          Owner view
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Guest = the public authenticity view; Owner = the full dossier.</li>
        <li>Hover a tab to ring its section in the preview; inspect to jump back.</li>
        <li>Blank fields fall back to PDP content, then the product&rsquo;s own data.</li>
      </ul>
    </AdminRailPanel>
  )

  if (productsQuery.isLoading) {
    return (
      <AdminWorkspace asideLabel="Passport preview" aside={rail}>
        <AdminLoadingState message="Loading product…" />
      </AdminWorkspace>
    )
  }

  return (
    <AdminWorkspace asideLabel="Passport preview" aside={rail}>
      <div className="space-y-6" data-testid="passport-content-editor">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/admin/passports"
              search={{ tab: 'content' }}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs text-[var(--color-text-muted)] no-underline transition-colors hover:text-[var(--color-text)]"
            >
              <ArrowLeft size={ICON_SIZE.sm} aria-hidden="true" />
              Back to products
            </Link>
            <h2 className="anvl-heading mt-1 truncate text-lg font-normal text-[var(--color-heading)]">
              {product?.name ?? productSlug}
            </h2>
          </div>
        </div>

        {/* Section tabs — free switching, no forced next/back. */}
        <div
          role="tablist"
          aria-label="Passport sections"
          onKeyDown={onTabKeyDown}
          className="flex flex-wrap gap-1 border-b border-[var(--color-line)] pb-px"
        >
          {TABS.map((tab, index) => (
            <PassportTabButton
              key={tab.key}
              tab={tab}
              domId={tabDomIds[index]!}
              active={tab.key === activeKey}
              onSelect={() => setActiveKey(tab.key)}
              buttonRef={(el) => {
                tabRefs.current[index] = el
              }}
            />
          ))}
        </div>

        <section
          role="tabpanel"
          id={`passport-tabpanel-${activeTab.key}`}
          aria-labelledby={tabDomIds[activeIndex]}
          tabIndex={0}
          className="space-y-4"
        >
          <p className="text-xs text-[var(--color-text-muted)]">{activeTab.blurb}</p>
          <activeTab.body
            draft={current}
            patch={patch}
            setDraft={setCurrent}
            mediaAssets={mediaAssets}
            productSlug={productSlug}
          />
        </section>
      </div>
    </AdminWorkspace>
  )
}

/** One tab — its own component so `usePreviewHoverProps` isn't called in a loop. */
function PassportTabButton({
  tab,
  domId,
  active,
  onSelect,
  buttonRef,
}: {
  tab: PassportTab
  /** Stable id — the inspect anchor for the tab owning this target, else plain. */
  domId: string
  active: boolean
  onSelect: () => void
  buttonRef: (el: HTMLButtonElement | null) => void
}) {
  const hover = usePreviewHoverProps({ kind: 'content-field', id: tab.targetId })
  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={domId}
      aria-selected={active}
      aria-controls={`passport-tabpanel-${tab.key}`}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      {...hover}
      className={cn(
        'focus-ring -mb-px rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors',
        active
          ? 'border-[var(--color-accent)] text-[var(--color-text)]'
          : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {tab.title}
    </button>
  )
}
