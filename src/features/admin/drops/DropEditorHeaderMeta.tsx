import { AlertCircle } from 'lucide-react'
import type { DropStatus } from '@/features/admin/drops/drops.types'
import {
  dropStatusBadgeLabel,
  dropStatusBadgeTone,
} from '@/features/admin/components/AdminStatusBadge'
import { cn } from '@/shared/lib/cn'

type DropEditorHeaderMetaProps = {
  status: DropStatus
  isLive: boolean
  errorCount: number
  errorSummary: string[]
  onValidationClick?: () => void
}

const toneDotClass: Record<
  ReturnType<typeof dropStatusBadgeTone>,
  string
> = {
  neutral: 'bg-zinc-400',
  live: 'bg-emerald-400',
  scheduled: 'bg-amber-400',
  archived: 'bg-zinc-500',
  success: 'bg-emerald-400',
  danger: 'bg-red-400',
  accent: 'bg-[var(--color-accent)]',
}

/** Compact status + validation row for the drop editor title area. */
export function DropEditorHeaderMeta({
  status,
  isLive,
  errorCount,
  errorSummary,
  onValidationClick,
}: DropEditorHeaderMetaProps) {
  const tone = dropStatusBadgeTone(status, isLive)
  const label = dropStatusBadgeLabel(status, isLive)

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)]/80',
          'bg-[var(--color-bg)]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
          isLive ? 'text-emerald-200/95' : 'text-[var(--color-text-muted)]',
        )}
      >
        <span
          className={cn('size-1.5 shrink-0 rounded-full', toneDotClass[tone])}
          aria-hidden
        />
        {label}
      </span>
      {errorCount > 0 ? (
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-red-500/35 bg-red-500/10',
            'px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-200/95',
            'transition hover:border-red-400/50 hover:bg-red-500/15',
          )}
          title={errorSummary.join('\n')}
          onClick={onValidationClick}
        >
          <AlertCircle size={11} aria-hidden />
          {errorCount} issue{errorCount === 1 ? '' : 's'}
        </button>
      ) : null}
    </span>
  )
}
