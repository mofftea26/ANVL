import type { ReactNode } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'

import { ArrowRight, Check, Circle, Info } from '@/shared/icons'
import { Button } from '@/shared/components/ui/Button'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

export type SetupStepState = 'done' | 'todo' | 'info'

export interface SetupStepLink {
  label: string
  to: string
  /** Optional deep-link search params (e.g. assets `page`/`slot`, passports `tab`). */
  search?: Record<string, string>
}

interface SetupStepBodyProps {
  /** What this step accomplishes — one or two plain sentences. */
  intro: ReactNode
  /** Live completion state derived from the local CMS working copies. */
  status?: { state: SetupStepState; label: string }
  /** The step's inline editing form — a real, saveable working copy. */
  children?: ReactNode
  /** Small secondary "fine-tune in the full editor" deep links. */
  links?: SetupStepLink[]
  /** Closes the hosting wizard so navigation lands on an unobstructed editor. */
  onNavigate: () => void
}

const STATE_ICON = { done: Check, todo: Circle, info: Info } as const

const STATE_CLASS: Record<SetupStepState, string> = {
  done: 'border-[color-mix(in_srgb,var(--color-success)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] text-[var(--color-success)]',
  todo: 'border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]',
  info: 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-highlight)]',
}

/** Live status chip — done / pending / informational. */
export function SetupStatusPill({
  state,
  label,
}: {
  state: SetupStepState
  label: string
}) {
  const IconComponent = STATE_ICON[state]
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        STATE_CLASS[state],
      )}
    >
      <IconComponent size={ICON_SIZE.xs} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{label}</span>
      <span className="sr-only">
        {state === 'done' ? ' — done' : state === 'todo' ? ' — pending' : ''}
      </span>
    </span>
  )
}

/**
 * Standard body for one setup-wizard step: what it accomplishes, its live
 * completion state, the step's INLINE editing form (a real working copy with
 * its own Save), and small secondary deep links into the full editors for
 * fine-tuning. The wizard is a place to finish setup, not just launch editors.
 */
export function SetupStepBody({ intro, status, children, links, onNavigate }: SetupStepBodyProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--color-text)]">{intro}</p>
      {status ? (
        <div>
          <SetupStatusPill state={status.state} label={status.label} />
        </div>
      ) : null}
      {children ? (
        <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-4">
          {children}
        </div>
      ) : null}
      {links && links.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-line)]/60 pt-3">
          {links.map((link) => (
            <Link
              key={`${link.to}:${link.label}`}
              {...({ to: link.to, search: link.search } as LinkProps)}
              onClick={onNavigate}
              className="focus-ring inline-flex items-center gap-1 rounded text-xs text-[var(--color-text-muted)] underline-offset-2 transition-colors hover:text-[var(--color-highlight)] hover:underline"
            >
              {link.label}
              <ArrowRight size={ICON_SIZE.xs} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface SetupSaveRowProps {
  onSave: () => void
  saving: boolean
  /** True right after a successful save (until the next edit). */
  saved?: boolean
  /** True when there are unsaved edits — shown as an explicit hint. */
  dirty?: boolean
  label?: string
  disabled?: boolean
}

/**
 * Per-step Save action with explicit dirty/saved feedback. Saving a CMS blob
 * IS publishing (local write + Supabase mirror), so the label says so.
 */
export function SetupSaveRow({
  onSave,
  saving,
  saved = false,
  dirty = false,
  label = 'Save',
  disabled = false,
}: SetupSaveRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <Button
        type="button"
        variant="primary"
        size="sm"
        density="compact"
        loading={saving}
        disabled={disabled || saving}
        onClick={onSave}
      >
        {saved && !dirty ? <Check size={ICON_SIZE.sm} aria-hidden="true" /> : null}
        {saving ? 'Saving…' : saved && !dirty ? 'Saved' : label}
      </Button>
      {dirty ? (
        <span className="text-[11px] text-[var(--color-text-muted)]">Unsaved changes</span>
      ) : null}
    </div>
  )
}
