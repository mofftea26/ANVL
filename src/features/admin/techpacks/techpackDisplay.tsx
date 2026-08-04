import { cn } from '@/shared/lib/cn'
import type { TechpackIssueSeverity } from '@/features/techpacks/schema/techpack.zod'
import type { TechpackStatus } from './techpacks.service'

/**
 * Shared presentation atoms for the techpack admin — status pills, severity
 * pills, byte formatting. Extracted so the list, the detail panel and the
 * review queue cannot drift into three different vocabularies for the same
 * five states.
 *
 * Colour comes only from `--color-*` tokens, and no pill relies on colour
 * alone: every one carries its label as text.
 */

const STATUS_COPY: Record<TechpackStatus, string> = {
  draft: 'Draft',
  parsed: 'Parsed',
  reviewed: 'Reviewed',
  imported: 'Imported',
  failed: 'Failed',
}

const STATUS_TONE: Record<TechpackStatus, string> = {
  draft: 'border-[var(--color-line)] text-[var(--color-text-muted)]',
  parsed:
    'border-[color-mix(in_oklab,var(--color-highlight)_45%,transparent)] text-[var(--color-highlight)]',
  reviewed:
    'border-[color-mix(in_oklab,var(--color-success)_45%,transparent)] text-[var(--color-success)]',
  imported:
    'border-[color-mix(in_oklab,var(--color-success)_60%,transparent)] text-[var(--color-success)]',
  failed:
    'border-[color-mix(in_oklab,var(--color-danger)_50%,transparent)] text-[var(--color-danger)]',
}

const PILL_BASE =
  'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em]'

export function TechpackStatusPill({ status }: { status: TechpackStatus }) {
  return <span className={cn(PILL_BASE, STATUS_TONE[status])}>{STATUS_COPY[status]}</span>
}

export function TechpackFinalPill() {
  return (
    <span
      className={cn(
        PILL_BASE,
        'border-[color-mix(in_oklab,var(--color-highlight)_60%,transparent)] text-[var(--color-highlight)]',
      )}
      title="The pack of record for this product"
    >
      Final
    </span>
  )
}

const SEVERITY_TONE: Record<TechpackIssueSeverity, string> = {
  error:
    'border-[color-mix(in_oklab,var(--color-danger)_50%,transparent)] text-[var(--color-danger)]',
  warn: 'border-[color-mix(in_oklab,var(--color-warning)_50%,transparent)] text-[var(--color-warning)]',
  info: 'border-[var(--color-line)] text-[var(--color-text-muted)]',
}

export function TechpackSeverityPill({ severity }: { severity: TechpackIssueSeverity }) {
  return <span className={cn(PILL_BASE, SEVERITY_TONE[severity])}>{severity}</span>
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}
