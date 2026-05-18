import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Column,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Plus } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminButton, adminButtonVariants } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { DropStatus } from '@/features/drops/drop.types'
import { coerceToDate } from '@/features/admin/lib/adminDateTime'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import {
  useAdminDropsListQuery,
  useArchiveAdminDropMutation,
  useDeleteAdminDropMutation,
  useDuplicateAdminDropMutation,
  useScheduleAdminDropMutation,
  useSetActiveAdminDropMutation,
} from '@/features/admin/drops/useAdminDropsListQuery'
import {
  type DropsListStatusTab,
  useDropsListUiStore,
} from '@/features/admin/drops/dropsListUi.store'
import { DropRowOverflowMenu } from '@/features/admin/drops/DropRowOverflowMenu'

const STATUS_TABS: Array<{ id: DropsListStatusTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
]

const STATUS_SORT_RANK: Record<DropStatus, number> = {
  draft: 10,
  scheduled: 20,
  inactive: 30,
  active: 40,
  archived: 50,
}

function formatAdminDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function parseOptionalTime(iso?: string): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

function compareDropStatus(a: AdminDropListItem, b: AdminDropListItem): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
  return STATUS_SORT_RANK[a.status] - STATUS_SORT_RANK[b.status]
}

function statusBadgeClass(status: DropStatus, isActive: boolean) {
  if (isActive) {
    return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
  }
  switch (status) {
    case 'draft':
      return 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'
    case 'scheduled':
      return 'border-amber-400/40 bg-amber-400/10 text-amber-100'
    case 'archived':
      return 'border-zinc-600 bg-zinc-900/40 text-zinc-400'
    case 'inactive':
      return 'border-[var(--color-line)] text-[var(--color-text-muted)]'
    case 'active':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
    default:
      return 'border-[var(--color-line)] text-[var(--color-text-muted)]'
  }
}

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

function DropsSortHeader({
  column,
  label,
}: {
  column: Column<AdminDropListItem, unknown>
  label: string
}) {
  const sorted = column.getIsSorted()
  const SortIcon =
    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <AdminButton
      type="button"
      variant="ghost"
      size="compact"
      className={cn(
        '-ml-2 h-9 gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
        'text-[var(--color-text-muted)] hover:bg-[var(--color-chip)] hover:text-[var(--color-text)]',
      )}
      onClick={column.getToggleSortingHandler()}
    >
      <span>{label}</span>
      <SortIcon
        className={cn('size-3 shrink-0', sorted ? 'opacity-90' : 'opacity-35')}
        aria-hidden
      />
    </AdminButton>
  )
}

type ModalMode =
  | { kind: 'activate'; id: string; label: string }
  | { kind: 'archive'; id: string; label: string }
  | { kind: 'delete'; id: string; label: string }
  | { kind: 'schedule'; id: string; label: string }

export function DropsAdminList() {
  const { data, isLoading, isError, refetch } = useAdminDropsListQuery()
  const search = useDropsListUiStore((s) => s.search)
  const statusTab = useDropsListUiStore((s) => s.statusTab)
  const setSearch = useDropsListUiStore((s) => s.setSearch)
  const setStatusTab = useDropsListUiStore((s) => s.setStatusTab)

  const duplicateMut = useDuplicateAdminDropMutation()
  const setActiveMut = useSetActiveAdminDropMutation()
  const scheduleMut = useScheduleAdminDropMutation()
  const archiveMut = useArchiveAdminDropMutation()
  const deleteMut = useDeleteAdminDropMutation()

  const [modal, setModal] = useState<ModalMode | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }])
  const activateTitleId = useId()
  const scheduleTitleId = useId()
  const scheduleFieldLabelId = useId()
  const archiveTitleId = useId()
  const deleteTitleId = useId()
  const searchFieldId = useId()
  const [scheduleIso, setScheduleIso] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  )

  const rows = useMemo(
    () => filterRows(data ?? [], search, statusTab),
    [data, search, statusTab],
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
    archiveMut.isPending ||
    deleteMut.isPending

  const columns = useMemo<ColumnDef<AdminDropListItem>[]>(
    () => [
      {
        id: 'actions',
        enableSorting: false,
        enableResizing: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-start">
            <DropRowOverflowMenu
              row={row.original}
              busy={busy}
              className="border-[var(--color-line)] bg-[var(--color-bg)]/60 hover:bg-[var(--color-surface-elevated)]"
              onActivate={() =>
                setModal({ kind: 'activate', id: row.original.id, label: row.original.title })
              }
              onSchedule={() => openSchedule(row.original)}
              onArchive={() =>
                setModal({ kind: 'archive', id: row.original.id, label: row.original.title })
              }
              onDelete={() =>
                setModal({ kind: 'delete', id: row.original.id, label: row.original.title })
              }
              onDuplicate={() => {
                duplicateMut.mutate(row.original.id, {
                  onSuccess: () => toast.success('Drop duplicated as draft.'),
                  onError: () => toast.error('Duplicate failed.'),
                })
              }}
            />
          </div>
        ),
        size: 56,
        minSize: 56,
        maxSize: 72,
      },
      {
        id: 'campaign',
        accessorKey: 'title',
        header: ({ column }) => <DropsSortHeader column={column} label="Campaign" />,
        cell: ({ row }) => (
          <div className="min-w-[140px] space-y-1 pr-2">
            <div className="font-semibold leading-snug text-[var(--color-heading)]">{row.original.title}</div>
            <div className="text-[11px] text-[var(--color-text-muted)]">
              {row.original.dropNumber} · {row.original.name}
            </div>
          </div>
        ),
        size: 280,
        minSize: 200,
      },
      {
        accessorKey: 'slug',
        header: ({ column }) => <DropsSortHeader column={column} label="Slug" />,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-[var(--color-text-muted)]">/{row.original.slug}</span>
        ),
        size: 140,
        minSize: 96,
      },
      {
        id: 'status',
        accessorFn: (r) => r.status,
        sortingFn: (a, b) => compareDropStatus(a.original, b.original),
        header: ({ column }) => <DropsSortHeader column={column} label="Status" />,
        cell: ({ row }) => (
          <div className="space-y-1">
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                statusBadgeClass(row.original.status, row.original.isActive),
              )}
            >
              {row.original.isActive ? 'Live' : row.original.status}
            </span>
            {row.original.isActive ? (
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Active on site
              </div>
            ) : null}
          </div>
        ),
        size: 152,
        minSize: 120,
      },
      {
        id: 'releaseDate',
        accessorFn: (r) => parseOptionalTime(r.releaseDate),
        header: ({ column }) => <DropsSortHeader column={column} label="Release" />,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-[var(--color-text)]">{formatAdminDate(row.original.releaseDate)}</span>
        ),
        size: 168,
        minSize: 132,
      },
      {
        id: 'scheduledActivationAt',
        accessorFn: (r) => parseOptionalTime(r.scheduledActivationAt),
        header: ({ column }) => <DropsSortHeader column={column} label="Scheduled" />,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-[var(--color-text)]">
            {formatAdminDate(row.original.scheduledActivationAt)}
          </span>
        ),
        size: 168,
        minSize: 132,
      },
      {
        accessorKey: 'productCount',
        header: ({ column }) => <DropsSortHeader column={column} label="Products" />,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-[var(--color-text)]">{row.original.productCount}</span>
        ),
        size: 104,
        minSize: 88,
      },
      {
        id: 'updatedAt',
        accessorFn: (r) => parseOptionalTime(r.updatedAt),
        header: ({ column }) => <DropsSortHeader column={column} label="Last edited" />,
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-[var(--color-text)]">{formatAdminDate(row.original.updatedAt)}</span>
        ),
        size: 176,
        minSize: 140,
      },
    ],
    [busy, duplicateMut, openSchedule],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: {
      minSize: 72,
      size: 140,
    },
  })

  function clearListFilters() {
    setSearch('')
    setStatusTab('all')
  }

  return (
    <>
      <div className="min-w-0 space-y-5">
        <div className="min-w-0 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-soft)]/40 px-3 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
            <div className="min-w-0 flex-1 space-y-2">
              <label
                htmlFor={searchFieldId}
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
              >
                Search drops
              </label>
              <input
                id={searchFieldId}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, internal name, slug, or drop #"
                className="focus-ring w-full max-w-xl rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                autoComplete="off"
              />
              <p className="max-w-xl text-xs leading-relaxed text-[var(--color-text-muted)]">
                Search and filter below; manage lifecycle from each row&apos;s overflow menu (⋯).
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to="/admin/drops/new"
                aria-label="Create new drop"
                title="Create new drop"
                className={cn(
                  'focus-ring relative inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg px-0 no-underline',
                  'border border-[color-mix(in_oklab,var(--color-accent)_48%,transparent)]',
                  'bg-[var(--color-surface)] text-[var(--color-heading)]',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.26),0_2px_8px_-2px_rgba(0,0,0,0.48)]',
                  'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-accent)]',
                  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-1px_0_rgba(0,0,0,0.26),0_12px_28px_-14px_rgba(0,0,0,0.6)]',
                  'active:border-[color-mix(in_oklab,var(--color-accent)_65%,transparent)] active:bg-[var(--color-surface)] active:text-[var(--color-heading)]',
                  'active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.38)]',
                )}
              >
                <Plus className="size-[18px]" aria-hidden />
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  adminButtonVariants({ variant: 'secondary', size: 'md' }),
                  'focus-ring inline-flex h-10 shrink-0 gap-2 px-4 no-underline',
                )}
              >
                View site
                <ExternalLink size={14} aria-hidden />
              </a>
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
        </div>

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

        {isLoading ? <p className="text-sm text-[var(--color-text-muted)]">Loading drops…</p> : null}

        {!isLoading && !isError && totalDrops === 0 ? (
          <AdminCard
            title="No drops yet"
            description="Create your first campaign drop to configure the landing story, palette, and catalog slice."
          >
            <Link
              to="/admin/drops/new"
              className={cn(
                adminButtonVariants({ variant: 'primary', size: 'md' }),
                'focus-ring inline-flex no-underline',
              )}
            >
              Create a drop
            </Link>
          </AdminCard>
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

            {rows.length === 0 ? null : (
              <>
                <div className="grid gap-3 md:hidden">
                  {table.getRowModel().rows.map((tableRow) => {
                    const row = tableRow.original
                    return (
                    <AdminCard
                      key={row.id}
                      title={
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 leading-snug">
                            {row.dropNumber} · {row.name}
                          </span>
                          <DropRowOverflowMenu
                            row={row}
                            busy={busy}
                            className="border-[var(--color-line)] bg-[var(--color-bg)]/70 hover:bg-[var(--color-surface-elevated)]"
                            onActivate={() =>
                              setModal({ kind: 'activate', id: row.id, label: row.title })
                            }
                            onSchedule={() => openSchedule(row)}
                            onArchive={() =>
                              setModal({ kind: 'archive', id: row.id, label: row.title })
                            }
                            onDelete={() =>
                              setModal({ kind: 'delete', id: row.id, label: row.title })
                            }
                            onDuplicate={() => {
                              duplicateMut.mutate(row.id, {
                                onSuccess: () => toast.success('Drop duplicated as draft.'),
                                onError: () => toast.error('Duplicate failed.'),
                              })
                            }}
                          />
                        </div>
                      }
                      description={
                        <span className="text-[var(--color-text-muted)]">
                          /drop/{row.slug} · {row.productCount} products
                        </span>
                      }
                    >
                      <div className="space-y-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                              statusBadgeClass(row.status, row.isActive),
                            )}
                          >
                            {row.isActive ? 'Live (active)' : row.status}
                          </span>
                          {row.isActive ? (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                              Storefront drop
                            </span>
                          ) : null}
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                          <div>
                            <dt className="text-[10px] uppercase tracking-wider">Release</dt>
                            <dd className="text-[var(--color-text)]">{formatAdminDate(row.releaseDate)}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] uppercase tracking-wider">Scheduled</dt>
                            <dd className="text-[var(--color-text)]">{formatAdminDate(row.scheduledActivationAt)}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-[10px] uppercase tracking-wider">Last edited</dt>
                            <dd className="text-[var(--color-text)]">{formatAdminDate(row.updatedAt)}</dd>
                          </div>
                        </dl>
                      </div>
                    </AdminCard>
                    )
                  })}
                </div>

                <div className="hidden min-w-0 md:block">
                  <div className="max-w-full overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] shadow-[inset_0_1px_0_rgba(231,228,223,0.04)]">
                    <table
                      className="border-collapse text-left text-sm"
                      style={{ width: table.getTotalSize() }}
                    >
                      <thead className="sticky top-0 z-10 bg-[color-mix(in_oklab,var(--color-surface)_94%,transparent)] text-[var(--color-text-muted)] backdrop-blur-sm supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-surface)_82%,transparent)]">
                        {table.getHeaderGroups().map((hg) => (
                          <tr key={hg.id} className="border-b border-[var(--color-line)]">
                            {hg.headers.map((header) => (
                              <th
                                key={header.id}
                                colSpan={header.colSpan}
                                className="relative px-3 py-2 text-left align-bottom text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{ width: header.getSize() }}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanResize() ? (
                                  <div
                                    aria-hidden
                                    onMouseDown={header.getResizeHandler()}
                                    onTouchStart={header.getResizeHandler()}
                                    className={cn(
                                      'absolute right-0 top-0 z-20 h-full w-2 translate-x-1/2 cursor-col-resize touch-none select-none rounded-sm bg-transparent',
                                      'hover:bg-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]',
                                    )}
                                  />
                                ) : null}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row, idx) => (
                          <tr
                            key={row.id}
                            className={cn(
                              'border-t border-[var(--color-line)] transition-colors',
                              idx % 2 === 1 && 'bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)]',
                              row.original.isActive &&
                                'bg-[color-mix(in_oklab,rgb(16_185_129)_12%,transparent)]',
                            )}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className="px-3 py-2.5 align-middle"
                                style={{ width: cell.column.getSize() }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>

      <Modal open={modal?.kind === 'activate'} onClose={() => setModal(null)} aria-labelledby={activateTitleId}>
        <div className="space-y-4">
          <h3 id={activateTitleId} className="anvl-heading text-xl font-normal">
            Make drop active?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> will power the public landing page and theme.
            The current active drop will be set to inactive.
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
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
              Activate
            </AdminButton>
          </div>
        </div>
      </Modal>

      <Modal open={modal?.kind === 'schedule'} onClose={() => setModal(null)} aria-labelledby={scheduleTitleId}>
        <div className="space-y-4">
          <h3 id={scheduleTitleId} className="anvl-heading text-xl font-normal">
            Schedule activation
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Set a planned activation time for{' '}
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span>. This does not auto-publish yet; it records intent in the CMS.
          </p>
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
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={
                busy ||
                !coerceToDate(scheduleIso)
              }
              onClick={() => {
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
              Save schedule
            </AdminButton>
          </div>
        </div>
      </Modal>

      <Modal open={modal?.kind === 'archive'} onClose={() => setModal(null)} aria-labelledby={archiveTitleId}>
        <div className="space-y-4">
          <h3 id={archiveTitleId} className="anvl-heading text-xl font-normal">
            Archive drop?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> will be hidden from activation and scheduling.
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
                if (modal?.kind !== 'archive') return
                archiveMut.mutate(modal.id, {
                  onSuccess: () => {
                    toast.success('Drop archived.')
                    setModal(null)
                  },
                  onError: () => toast.error('Archive failed.'),
                })
              }}
            >
              Archive
            </AdminButton>
          </div>
        </div>
      </Modal>

      <Modal open={modal?.kind === 'delete'} onClose={() => setModal(null)} aria-labelledby={deleteTitleId}>
        <div className="space-y-4">
          <h3 id={deleteTitleId} className="anvl-heading text-xl font-normal">
            Delete drop?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            This removes <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> from local storage.
            If it was the only drop, a fresh default drop is recreated.
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
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
              Delete
            </AdminButton>
          </div>
        </div>
      </Modal>
    </>
  )
}
