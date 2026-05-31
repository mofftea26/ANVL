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
  onDelete: () => void
  onDuplicate: () => void
  onPreview: () => void
}

export function DropAdminListCard({
  row,
  busy,
  onActivate,
  onSchedule,
  onDelete,
  onDuplicate,
  onPreview,
}: DropAdminListCardProps) {
  const emblemUrl = row.emblemImageUrl?.trim()
  const themeAccent = row.themeAccent?.trim()

  return (
    <section
      data-testid="drop-admin-list-card"
      data-drop-id={row.id}
      className={cn(
        'group/drop-card relative isolate flex h-full flex-col overflow-hidden rounded-2xl',
        'border border-[var(--color-line)] bg-[var(--color-surface)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_48px_-32px_rgba(0,0,0,0.78)]',
        'motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-reduce:transition-none',
        'hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_30%,transparent)]',
        'motion-reduce:hover:translate-y-0',
        row.isActive &&
          'border-[color:color-mix(in_srgb,rgb(16_185_129)_34%,var(--color-line))] bg-[color-mix(in_oklab,rgb(16_185_129)_9%,var(--color-surface))]',
      )}
    >
      {themeAccent ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-90"
          style={{
            background: `radial-gradient(ellipse 110% 75% at 100% -10%, color-mix(in srgb, ${themeAccent} 24%, transparent) 0%, transparent 55%), linear-gradient(160deg, color-mix(in srgb, ${themeAccent} 8%, transparent) 0%, transparent 45%)`,
          }}
        />
      ) : null}

      {emblemUrl ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(62%,12rem)] overflow-hidden"
        >
          <div
            className={cn(
              'absolute inset-0',
              'bg-[linear-gradient(to_left,var(--color-surface)_12%,color-mix(in_oklab,var(--color-surface)_68%,transparent)_46%,transparent_100%)]',
              row.isActive &&
                'bg-[linear-gradient(to_left,color-mix(in_oklab,rgb(16_185_129)_14%,var(--color-surface))_12%,color-mix(in_oklab,var(--color-surface)_68%,transparent)_46%,transparent_100%)]',
            )}
          />
          <img
            src={emblemUrl}
            alt=""
            decoding="async"
            className={cn(
              'absolute -right-3 top-1/2 h-[min(10rem,90%)] w-auto max-w-none -translate-y-1/2 object-contain object-right',
              'opacity-[0.14] motion-safe:blur-[0.35px] motion-reduce:blur-0',
              'motion-safe:transition-[opacity,transform] motion-safe:duration-500',
              'group-hover/drop-card:opacity-[0.24] motion-reduce:group-hover/drop-card:opacity-[0.14]',
            )}
          />
        </div>
      ) : null}

      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit]',
          'ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_12%,transparent)]',
          'bg-[linear-gradient(155deg,color-mix(in_srgb,var(--anvl-bone)_10%,transparent)_0%,transparent_38%)]',
        )}
      />

      <div className="relative z-[1] flex flex-1 flex-col p-5 sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2 pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge
                tone={dropStatusBadgeTone(row.status, row.isActive)}
                size="default"
              >
                {dropStatusBadgeLabel(row.status, row.isActive)}
              </AdminStatusBadge>
              <span className="anvl-micro rounded-full border border-[var(--color-line)]/70 bg-[var(--color-bg)]/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Drop {row.dropNumber}
              </span>
            </div>
            <h2 className="anvl-heading text-lg font-normal leading-tight tracking-[0.02em] text-[var(--color-heading)] sm:text-xl">
              <span className="line-clamp-2">{row.name}</span>
            </h2>
            <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
              <span className="font-mono text-[12px] text-[var(--color-text)]/90">
                /drop/{row.slug}
              </span>
              <span aria-hidden className="mx-1.5 opacity-40">
                ·
              </span>
              <span>
                {row.productCount} piece{row.productCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <DropRowOverflowMenu
            row={row}
            busy={busy}
            className="border-[var(--color-line)] bg-[var(--color-bg)]/80 hover:bg-[var(--color-surface-elevated)]"
            onActivate={onActivate}
            onSchedule={onSchedule}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPreview={onPreview}
          />
        </header>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--color-line)]/60 pt-4 text-xs">
          <div>
            <dt className="anvl-micro text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Release
            </dt>
            <dd className="mt-1 text-sm text-[var(--color-text)]">
              {formatAdminDropDate(row.releaseDate)}
            </dd>
          </div>
          <div>
            <dt className="anvl-micro text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Scheduled
            </dt>
            <dd className="mt-1 text-sm text-[var(--color-text)]">
              {formatAdminDropDate(row.scheduledActivationAt)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="anvl-micro text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Last edited
            </dt>
            <dd className="mt-1 text-sm text-[var(--color-text)]">
              {formatAdminDropDate(row.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
