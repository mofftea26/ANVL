import {
  AdminStatusBadge,
  dropStatusBadgeLabel,
  dropStatusBadgeTone,
} from '@/features/admin/components/AdminStatusBadge'
import { formatAdminDropDate } from '@/features/admin/drops/dropsListFormat'
import { DropRowOverflowMenu } from '@/features/admin/drops/DropRowOverflowMenu'
import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { cn } from '@/shared/lib/cn'

export type DropAdminListCardProps = {
  row: AdminDropListItem
  busy: boolean
  onActivate: () => void
  onSchedule: () => void
  onArchive: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function DropAdminListCard({
  row,
  busy,
  onActivate,
  onSchedule,
  onArchive,
  onDelete,
  onDuplicate,
}: DropAdminListCardProps) {
  const emblemUrl = row.emblemImageUrl?.trim()
  const themeAccent = row.themeAccent?.trim()

  return (
    <section
      data-testid="drop-admin-list-card"
      data-drop-id={row.id}
      className={cn(
        'group/drop-card relative isolate overflow-hidden rounded-2xl',
        'border border-[var(--color-line)] bg-[var(--color-surface)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.04),0_20px_56px_-36px_rgba(0,0,0,0.82)]',
        'motion-safe:transition-[box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-reduce:transition-none',
        'hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_28%,transparent)]',
        row.isActive &&
          'border-[color:color-mix(in_srgb,rgb(16_185_129)_32%,var(--color-line))] bg-[color-mix(in_oklab,rgb(16_185_129)_8%,var(--color-surface))]',
      )}
    >
      {themeAccent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80"
          style={{
            background: `radial-gradient(ellipse 120% 80% at 100% 0%, color-mix(in srgb, ${themeAccent} 22%, transparent) 0%, transparent 58%), linear-gradient(135deg, color-mix(in srgb, ${themeAccent} 10%, transparent) 0%, transparent 42%)`,
          }}
        />
      ) : null}

      {emblemUrl ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(58%,11rem)] overflow-hidden"
        >
          <div
            className={cn(
              'absolute inset-0',
              'bg-[linear-gradient(to_left,var(--color-surface)_18%,color-mix(in_oklab,var(--color-surface)_72%,transparent)_48%,transparent_100%)]',
              row.isActive &&
                'bg-[linear-gradient(to_left,color-mix(in_oklab,rgb(16_185_129)_12%,var(--color-surface))_18%,color-mix(in_oklab,var(--color-surface)_72%,transparent)_48%,transparent_100%)]',
            )}
          />
          <img
            src={emblemUrl}
            alt=""
            decoding="async"
            className={cn(
              'absolute -right-2 top-1/2 h-[min(9.5rem,88%)] w-auto max-w-none -translate-y-1/2 object-contain object-right',
              'opacity-[0.16] motion-safe:blur-[0.4px] motion-reduce:blur-0',
              'motion-safe:transition-[opacity,transform] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
              'motion-reduce:transition-none',
              'group-hover/drop-card:opacity-[0.22] motion-reduce:group-hover/drop-card:opacity-[0.16]',
            )}
          />
        </div>
      ) : null}

      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit]',
          'ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_10%,transparent)]',
          'bg-[linear-gradient(145deg,color-mix(in_srgb,var(--anvl-bone)_12%,transparent)_0%,transparent_40%)]',
          'opacity-90',
        )}
      />

      <div className="relative z-[1] p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1 pr-2">
            <h2 className="anvl-heading text-base font-normal leading-snug tracking-[0.04em] text-[var(--color-heading)]">
              <span className="block truncate">
                {row.dropNumber} · {row.name}
              </span>
            </h2>
            <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              <span className="font-mono text-[12px]">/drop/{row.slug}</span>
              <span aria-hidden className="mx-1.5 opacity-50">
                ·
              </span>
              <span>
                {row.productCount} product{row.productCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <DropRowOverflowMenu
            row={row}
            busy={busy}
            className="border-[var(--color-line)] bg-[var(--color-bg)]/70 hover:bg-[var(--color-surface-elevated)]"
            onActivate={onActivate}
            onSchedule={onSchedule}
            onArchive={onArchive}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </header>

        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge
              tone={dropStatusBadgeTone(row.status, row.isActive)}
              size="default"
            >
              {dropStatusBadgeLabel(row.status, row.isActive)}
            </AdminStatusBadge>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
            <div>
              <dt className="text-[10px] uppercase tracking-wider">Release</dt>
              <dd className="text-[var(--color-text)]">{formatAdminDropDate(row.releaseDate)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider">Scheduled</dt>
              <dd className="text-[var(--color-text)]">
                {formatAdminDropDate(row.scheduledActivationAt)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] uppercase tracking-wider">Last edited</dt>
              <dd className="text-[var(--color-text)]">{formatAdminDropDate(row.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
