import { Plus } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { processDueScheduledDropsRemote } from '@/features/admin/cmsRemote/adminCmsProcessScheduledDrops'
import { rehydrateAdminCmsFromRemote } from '@/features/admin/cmsRemote/rehydrateAdminCmsFromRemote'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'
import {
  AdminEmptyState,
} from '@/features/admin/components/AdminEmptyState'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { coerceToDate } from '@/features/admin/lib/adminDateTime'
import {
  useAdminDropsListQuery,
  useDeleteAdminDropMutation,
  useDuplicateAdminDropMutation,
  useScheduleAdminDropMutation,
  useSetActiveAdminDropMutation,
} from '@/features/admin/drops/useAdminDropsListQuery'
import { DropSitePreviewModal } from '@/features/admin/drops/DropSitePreviewModal'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { useWebsiteLayout } from '@/features/admin/website-layout/useWebsiteLayout'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getDropById } from '@/features/admin/drops/drops.service'
import {
  type DropsListStatusTab,
  useDropsListUiStore,
} from '@/features/admin/drops/dropsListUi.store'
import { DropAdminListCard } from '@/features/admin/drops/DropAdminListCard'
import {
  DROPS_LIST_SORT_OPTIONS,
  sortDropListRows,
  type DropsListSortKey,
} from '@/features/admin/drops/dropsListSort'

const STATUS_TABS: Array<{ id: DropsListStatusTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active', label: 'Active' },
]

function filterRows(
  rows: AdminDropListItem[],
  search: string,
  tab: DropsListStatusTab,
): AdminDropListItem[] {
  const q = search.trim().toLowerCase()
  return rows.filter((row) => {
    if (tab !== 'all' && row.status !== tab) return false
    if (!q) return true
    return (
      row.title.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.slug.toLowerCase().includes(q) ||
      row.dropNumber.toLowerCase().includes(q)
    )
  })
}

type ModalMode =
  | { kind: 'activate'; id: string; label: string }
  | { kind: 'delete'; id: string; label: string }
  | { kind: 'schedule'; id: string; label: string }

export function DropsAdminList() {
  const { data, isLoading, isError, refetch } = useAdminDropsListQuery()
  const websiteLayout = useWebsiteLayout()
  const catalog = useAdminProductsList()
  const search = useDropsListUiStore((s) => s.search)
  const statusTab = useDropsListUiStore((s) => s.statusTab)
  const setSearch = useDropsListUiStore((s) => s.setSearch)
  const setStatusTab = useDropsListUiStore((s) => s.setStatusTab)

  const duplicateMut = useDuplicateAdminDropMutation()
  const setActiveMut = useSetActiveAdminDropMutation()
  const scheduleMut = useScheduleAdminDropMutation()
  const deleteMut = useDeleteAdminDropMutation()

  const [modal, setModal] = useState<ModalMode | null>(null)
  const [previewDropId, setPreviewDropId] = useState<string | null>(null)
  const [processingDue, setProcessingDue] = useState(false)
  const [sortKey, setSortKey] = useState<DropsListSortKey>('updatedAt:desc')
  const scheduleFieldLabelId = useId()
  const searchFieldId = useId()
  const sortFieldId = useId()
  const [scheduleIso, setScheduleIso] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  )

  const filteredRows = useMemo(
    () => filterRows(data ?? [], search, statusTab),
    [data, search, statusTab],
  )

  const rows = useMemo(
    () => sortDropListRows(filteredRows, sortKey),
    [filteredRows, sortKey],
  )

  const totalDrops = data?.length ?? 0
  const filtersActive = search.trim() !== '' || statusTab !== 'all'

  const openSchedule = useCallback((row: AdminDropListItem) => {
    const base =
      row.scheduledActivationAt && !Number.isNaN(new Date(row.scheduledActivationAt).getTime())
        ? row.scheduledActivationAt
        : new Date(Date.now() + 60 * 60 * 1000).toISOString()
    setScheduleIso(base)
    setModal({ kind: 'schedule', id: row.id, label: row.title })
  }, [])

  const busy =
    duplicateMut.isPending ||
    setActiveMut.isPending ||
    scheduleMut.isPending ||
    deleteMut.isPending ||
    processingDue

  const runDueSchedules = useCallback(async () => {
    setProcessingDue(true)
    try {
      const result = await processDueScheduledDropsRemote()
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (result.processedCount === 0) {
        toast.message('No due scheduled drops', {
          description:
            'Nothing is scheduled with an activation time in the past. Check the date on each drop — promotion uses the database scheduler every ~2 minutes, not Edge Function invocations.',
        })
      } else {
        toast.success(
          result.processedCount === 1
            ? `Activated ${result.slugs[0] ?? '1 drop'}.`
            : `Activated ${result.processedCount} drops.`,
        )
      }
      await rehydrateAdminCmsFromRemote()
      await refetch()
    } finally {
      setProcessingDue(false)
    }
  }, [refetch])

  const previewDrop = previewDropId ? getDropById(previewDropId) : null
  const previewLanding = previewDrop
    ? composeLandingPageFromDrop(previewDrop, websiteLayout, {
        editorActsPreview: true,
        editorPreviewHeroFallback: true,
      })
    : null
  const previewProducts = useMemo(() => {
    if (!previewDrop) return []
    const map = new Map(catalog.map((p) => [p.id, p]))
    const label = `${previewDrop.dropNumber}: ${previewDrop.name}`
    return previewDrop.productIds
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter(adminProductIsPubliclyVisible)
      .map((p) => adminProductToLegacy(p, label))
  }, [catalog, previewDrop])

  function clearListFilters() {
    setSearch('')
    setStatusTab('all')
  }

  return (
    <>
      <div className="min-w-0 space-y-5">
        <AdminPanel>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
            <AdminFormField
              label="Search drops"
              htmlFor={searchFieldId}
              labelStyle="micro"
              className="min-w-0 flex-1"
              hint="Search and filter below; manage lifecycle from each card's overflow menu (⋯)."
            >
              <AdminInput
                id={searchFieldId}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, internal name, slug, or drop #"
                className="max-w-xl"
                autoComplete="off"
              />
            </AdminFormField>
            <div className="flex shrink-0 flex-wrap items-end gap-3">
              <AdminFormField
                label="Sort by"
                htmlFor={sortFieldId}
                labelStyle="micro"
                className="min-w-[12rem]"
              >
                <AdminSelect value={sortKey} onValueChange={(v) => setSortKey(v as DropsListSortKey)}>
                  <AdminSelectTrigger id={sortFieldId} aria-label="Sort drops">
                    <AdminSelectValue />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {DROPS_LIST_SORT_OPTIONS.map((opt) => (
                      <AdminSelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </AdminFormField>
              <div className="flex flex-wrap items-center gap-2 pb-0.5">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runDueSchedules()}
                >
                  Run due schedules
                </AdminButton>
                <AdminForgedLink
                  to="/admin/drops/new"
                  variant="icon"
                  aria-label="Create new drop"
                  title="Create new drop"
                >
                  <Plus className="size-[18px]" aria-hidden />
                </AdminForgedLink>
              </div>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Drop status filters"
            className="mt-5 flex flex-wrap gap-1 border-t border-[var(--color-line)] pt-4 [-webkit-overflow-scrolling:touch]"
          >
            {STATUS_TABS.map((tab) => (
              <AdminButton
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusTab === tab.id}
                variant="adminTabList"
                data-active={statusTab === tab.id ? 'true' : 'false'}
                onClick={() => setStatusTab(tab.id)}
              >
                {tab.label}
              </AdminButton>
            ))}
          </div>
        </AdminPanel>

        {isError ? (
          <AdminCard title="Could not load drops">
            <p className="text-sm text-[var(--color-text-muted)]">
              The CMS client failed to return the drops list.
            </p>
            <AdminButton type="button" size="sm" className="mt-3" onClick={() => void refetch()}>
              Retry
            </AdminButton>
          </AdminCard>
        ) : null}

        {isLoading ? <AdminLoadingState message="Loading drops…" /> : null}

        {!isLoading && !isError && totalDrops === 0 ? (
          <AdminEmptyState
            title="No drops yet"
            description="Create your first campaign drop to configure the landing story, palette, and catalog slice."
            actionTo="/admin/drops/new"
            actionLabel="Create a drop"
          />
        ) : null}

        {!isLoading && !isError && totalDrops > 0 ? (
          <>
            {rows.length === 0 ? (
              <AdminCard
                title="Nothing matches"
                description="Try another status tab or clear search to see every drop again."
              >
                {filtersActive ? (
                  <AdminButton type="button" size="sm" variant="secondary" onClick={clearListFilters}>
                    Clear filters
                  </AdminButton>
                ) : null}
              </AdminCard>
            ) : null}

            {rows.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {rows.map((row) => (
                  <DropAdminListCard
                    key={row.id}
                    row={row}
                    busy={busy}
                    onActivate={() =>
                      setModal({ kind: 'activate', id: row.id, label: row.title })
                    }
                    onSchedule={() => openSchedule(row)}
                    onDelete={() =>
                      setModal({ kind: 'delete', id: row.id, label: row.title })
                    }
                    onDuplicate={() => {
                      duplicateMut.mutate(row.id, {
                        onSuccess: () => toast.success('Drop duplicated.'),
                        onError: () => toast.error('Duplicate failed.'),
                      })
                    }}
                    onPreview={() => setPreviewDropId(row.id)}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <AdminConfirmDialog
        open={modal?.kind === 'activate'}
        onClose={() => setModal(null)}
        title="Make drop active?"
        confirmLabel="Activate"
        confirmDisabled={busy}
        onConfirm={() => {
          if (modal?.kind !== 'activate') return
          setActiveMut.mutate(modal.id, {
            onSuccess: () => {
              toast.success('Active drop updated.')
              setModal(null)
            },
            onError: () => toast.error('Could not activate drop.'),
          })
        }}
      >
        <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> will power the
        public landing page and theme. The current active drop will be set to inactive. When
        Supabase is configured, activating also publishes the drop to the live storefront snapshot.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={modal?.kind === 'schedule'}
        onClose={() => setModal(null)}
        title="Schedule activation"
        confirmLabel="Save schedule"
        confirmDisabled={busy || !coerceToDate(scheduleIso)}
        footerBefore={
          <label className="block text-xs text-[var(--color-text-muted)]">
            <span className="mb-1 block" id={scheduleFieldLabelId}>
              Activation (local time — stored as UTC ISO in CMS)
            </span>
            <AdminDateTimeField
              aria-labelledby={scheduleFieldLabelId}
              disabled={busy}
              value={scheduleIso}
              onChange={(next) => {
                if (next) setScheduleIso(next)
              }}
            />
          </label>
        }
        onConfirm={() => {
          if (modal?.kind !== 'schedule' || !coerceToDate(scheduleIso)) return
          const iso = scheduleIso
          scheduleMut.mutate(
            { id: modal.id, activationIso: iso },
            {
              onSuccess: () => {
                toast.success('Schedule saved.')
                setModal(null)
              },
              onError: () => toast.error('Could not save schedule.'),
            },
          )
        }}
      >
        Set a planned activation time for{' '}
        <span className="font-medium text-[var(--color-text)]">{modal?.label}</span>. This does not
        auto-publish yet; it records intent in the CMS.
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={modal?.kind === 'delete'}
        onClose={() => setModal(null)}
        title="Delete drop?"
        confirmLabel="Delete"
        confirmDisabled={busy}
        onConfirm={() => {
          if (modal?.kind !== 'delete') return
          deleteMut.mutate(modal.id, {
            onSuccess: () => {
              toast.success('Drop deleted.')
              setModal(null)
            },
            onError: () => toast.error('Delete failed.'),
          })
        }}
      >
        This removes <span className="font-medium text-[var(--color-text)]">{modal?.label}</span>{' '}
        from local storage. If it was the only drop, a fresh default drop is recreated.
      </AdminConfirmDialog>

      {previewDrop && previewLanding ? (
        <DropSitePreviewModal
          open={previewDropId !== null}
          onClose={() => setPreviewDropId(null)}
          title={`Preview · ${previewDrop.name}`}
          landing={previewLanding}
          products={previewProducts}
          palette={previewDrop.theme}
          emblemUrl={previewDrop.visuals.emblemImageUrl}
          draftActs={previewDrop.acts}
        />
      ) : null}
    </>
  )
}
