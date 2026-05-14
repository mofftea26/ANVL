import { Link } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import type { DropStatus } from '@/features/admin/drops/drops.types'
import { Button } from '@/shared/components/ui/Button'
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

const STATUS_TABS: Array<{ id: DropsListStatusTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

function formatAdminDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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
  const activateTitleId = useId()
  const scheduleTitleId = useId()
  const archiveTitleId = useId()
  const deleteTitleId = useId()
  const [scheduleLocal, setScheduleLocal] = useState(() =>
    isoToDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
  )

  const rows = useMemo(
    () => filterRows(data ?? [], search, statusTab),
    [data, search, statusTab],
  )

  function openSchedule(row: AdminDropListItem) {
    const base =
      row.scheduledActivationAt && !Number.isNaN(new Date(row.scheduledActivationAt).getTime())
        ? row.scheduledActivationAt
        : new Date(Date.now() + 60 * 60 * 1000).toISOString()
    setScheduleLocal(isoToDatetimeLocalValue(base))
    setModal({ kind: 'schedule', id: row.id, label: row.title })
  }

  const busy =
    duplicateMut.isPending ||
    setActiveMut.isPending ||
    scheduleMut.isPending ||
    archiveMut.isPending ||
    deleteMut.isPending

  return (
    <>
      <AdminSectionHeader
        eyebrow="Drops"
        title="Campaign drops"
        description="Search, filter by status, and manage activation. Only one drop is live on the storefront at a time."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/drops/new"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline"
            >
              New drop
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] no-underline"
            >
              View site
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        }
      />

      <div className="space-y-4">
        <label className="block text-xs text-[var(--color-text-muted)]">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, internal name, slug, or drop #"
            className="mt-1 w-full max-w-md rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
            autoComplete="off"
          />
        </label>

        <div
          role="tablist"
          aria-label="Drop status"
          className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusTab === tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                'focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]',
                statusTab === tab.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)]'
                  : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isError ? (
          <AdminCard title="Could not load drops">
            <p className="text-sm text-[var(--color-text-muted)]">
              The CMS client failed to return the drops list.
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={() => void refetch()}>
              Retry
            </Button>
          </AdminCard>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading drops…</p>
        ) : null}

        {!isLoading && !isError ? (
          <>
            <div className="grid gap-3 md:hidden">
              {rows.map((row) => (
                <AdminCard
                  key={row.id}
                  title={`${row.dropNumber} · ${row.name}`}
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
                        <dd className="text-[var(--color-text)]">
                          {formatAdminDate(row.scheduledActivationAt)}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[10px] uppercase tracking-wider">Last edited</dt>
                        <dd className="text-[var(--color-text)]">{formatAdminDate(row.updatedAt)}</dd>
                      </div>
                    </dl>
                    <DropRowActions
                      row={row}
                      busy={busy}
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
                </AdminCard>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-[var(--color-line)] md:block">
              <table className="min-w-[960px] w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--color-surface)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Drop</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Release</th>
                    <th className="px-3 py-2 font-semibold">Scheduled</th>
                    <th className="px-3 py-2 font-semibold">Products</th>
                    <th className="px-3 py-2 font-semibold">Last edited</th>
                    <th className="px-3 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-t border-[var(--color-line)]',
                        row.isActive && 'bg-emerald-500/[0.06]',
                      )}
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="font-medium text-[var(--color-heading)]">{row.title}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {row.dropNumber} · {row.name} · /drop/{row.slug}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
                            statusBadgeClass(row.status, row.isActive),
                          )}
                        >
                          {row.isActive ? 'Live' : row.status}
                        </span>
                        {row.isActive ? (
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                            Active on site
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-[var(--color-text)]">
                        {formatAdminDate(row.releaseDate)}
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-[var(--color-text)]">
                        {formatAdminDate(row.scheduledActivationAt)}
                      </td>
                      <td className="px-3 py-3 align-top text-xs tabular-nums">{row.productCount}</td>
                      <td className="px-3 py-3 align-top text-xs text-[var(--color-text)]">
                        {formatAdminDate(row.updatedAt)}
                      </td>
                      <td className="px-3 py-3 align-top text-right">
                        <DropRowActions
                          row={row}
                          busy={busy}
                          compact
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No drops match this filter.</p>
            ) : null}
          </>
        ) : null}
      </div>

      <Modal
        open={modal?.kind === 'activate'}
        onClose={() => setModal(null)}
        aria-labelledby={activateTitleId}
      >
        <div className="space-y-4">
          <h3 id={activateTitleId} className="anvl-heading text-xl font-normal">
            Make drop active?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> will power
            the public landing page and theme. The current active drop will be set to inactive.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal?.kind === 'schedule'}
        onClose={() => setModal(null)}
        aria-labelledby={scheduleTitleId}
      >
        <div className="space-y-4">
          <h3 id={scheduleTitleId} className="anvl-heading text-xl font-normal">
            Schedule activation
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Set a planned activation time for{' '}
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span>. This does
            not auto-publish yet; it records intent in the CMS.
          </p>
          <label className="block text-xs text-[var(--color-text-muted)]">
            Activation (local time)
            <input
              type="datetime-local"
              value={scheduleLocal}
              onChange={(e) => setScheduleLocal(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={busy || !scheduleLocal}
              onClick={() => {
                if (modal?.kind !== 'schedule' || !scheduleLocal) return
                const iso = localInputToIso(scheduleLocal)
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
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal?.kind === 'archive'}
        onClose={() => setModal(null)}
        aria-labelledby={archiveTitleId}
      >
        <div className="space-y-4">
          <h3 id={archiveTitleId} className="anvl-heading text-xl font-normal">
            Archive drop?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> will be
            hidden from activation and scheduling.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal?.kind === 'delete'}
        onClose={() => setModal(null)}
        aria-labelledby={deleteTitleId}
      >
        <div className="space-y-4">
          <h3 id={deleteTitleId} className="anvl-heading text-xl font-normal">
            Delete drop?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            This removes{' '}
            <span className="font-medium text-[var(--color-text)]">{modal?.label}</span> from local
            storage. If it was the only drop, a fresh default drop is recreated.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function DropRowActions({
  row,
  busy,
  compact,
  onActivate,
  onSchedule,
  onArchive,
  onDelete,
  onDuplicate,
}: {
  row: AdminDropListItem
  busy: boolean
  compact?: boolean
  onActivate: () => void
  onSchedule: () => void
  onArchive: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const canActivate = !row.isActive && row.status !== 'archived'
  const wrap = compact ? 'flex flex-wrap justify-end gap-1' : 'flex flex-wrap gap-2'

  return (
    <div className={wrap}>
      <Link
        to="/admin/drops/$dropId"
        params={{ dropId: row.id }}
        className="inline-flex h-9 items-center rounded-md border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
      >
        Edit
      </Link>
      <a
        href={`/drop/${row.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center rounded-md border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
      >
        Preview
      </a>
      <Button type="button" size="sm" disabled={busy} onClick={onDuplicate}>
        Duplicate
      </Button>
      {canActivate ? (
        <Button type="button" size="sm" disabled={busy} onClick={onActivate}>
          Set active
        </Button>
      ) : null}
      {row.status !== 'archived' ? (
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onSchedule}>
          Schedule
        </Button>
      ) : null}
      {row.status !== 'archived' ? (
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onArchive}>
          Archive
        </Button>
      ) : null}
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onDelete}>
        Delete
      </Button>
    </div>
  )
}
