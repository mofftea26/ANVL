import type { ReactNode } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'

import { Check, Circle, Info } from '@/shared/icons'
import { adminForgedCtaLinkClass } from '@/features/admin/components/adminForgedLinkStyles'
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
  /** Trivial inline control (a single select / button) when one exists. */
  control?: ReactNode
  /** Deep links into the real editors. */
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
 * completion state, an optional trivial inline control, and prominent
 * "Open editor" deep links that close the wizard on navigate. Deliberately a
 * guided launcher — never a re-implementation of the editor it points at.
 */
export function SetupStepBody({ intro, status, control, links, onNavigate }: SetupStepBodyProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--color-text)]">{intro}</p>
      {status ? (
        <div>
          <SetupStatusPill state={status.state} label={status.label} />
        </div>
      ) : null}
      {control ? (
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-3">
          {control}
        </div>
      ) : null}
      {links && links.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)]/60 pt-3">
          {links.map((link) => (
            <Link
              key={`${link.to}:${link.label}`}
              {...({ to: link.to, search: link.search } as LinkProps)}
              onClick={onNavigate}
              className={adminForgedCtaLinkClass}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
