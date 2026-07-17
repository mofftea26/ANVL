import { useQuery } from '@tanstack/react-query'
import { Download, Inbox, RefreshCw, Users } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui/Button'
import {
  fetchComingSoonSubscribers,
  subscribersToCsv,
} from './comingSoonSubscribers.service'

const QUERY_KEY = ['admin', 'coming-soon-subscribers'] as const

function formatWhen(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Early-access inbox — the live `coming_soon_subscribers` list (admin-only
 * RLS read) with a count, newest-first roll, and one-click CSV export for
 * whatever email tool eventually takes over.
 */
export function ComingSoonSubscribersPanel() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchComingSoonSubscribers,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const subscribers = query.data?.ok ? query.data.subscribers : []

  const exportCsv = () => {
    const blob = new Blob([subscribersToCsv(subscribers)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anvl-early-access-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
          <Users size={ICON_SIZE.sm} aria-hidden="true" />
          Early-access subscribers
          <span className="rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-xs font-medium normal-case tracking-normal text-[var(--color-text-muted)]">
            {query.isPending ? '…' : subscribers.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            aria-label="Refresh subscribers"
          >
            <RefreshCw
              size={ICON_SIZE.sm}
              className={query.isFetching ? 'animate-spin' : undefined}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            onClick={exportCsv}
            disabled={subscribers.length === 0}
          >
            <Download size={ICON_SIZE.sm} />
            Export CSV
          </Button>
        </div>
      </div>

      {query.isPending ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading the list…</p>
      ) : query.data && !query.data.ok ? (
        <p className="text-sm text-[var(--color-danger)]">{query.data.error}</p>
      ) : subscribers.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--color-line)] px-4 py-5 text-sm text-[var(--color-text-muted)]">
          <Inbox size={ICON_SIZE.md} aria-hidden="true" />
          No signups yet — they land here the moment someone joins from the
          reveal page.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto rounded-xl border border-[var(--color-line)]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface)]">
              <tr className="border-b border-[var(--color-line)] text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                <th scope="col" className="px-4 py-2.5 font-medium">Email</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-line)] last:border-b-0"
                >
                  <td className="px-4 py-2.5 text-[var(--color-text)]">{s.email}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-text-muted)]">
                    {formatWhen(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
