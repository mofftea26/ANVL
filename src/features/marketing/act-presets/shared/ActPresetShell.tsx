import type { RefObject, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ActMediaBackdrop } from './ActMediaBackdrop'
import {
  ACT_CONTENT_CLASS,
  ACT_SECTION_CLASS,
} from './actPresetUtils'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

type ActPresetShellProps = {
  rootRef?: RefObject<HTMLElement | null>
  row?: LandingAct
  contentImageKey?: string
  ariaLabel: string
  className?: string
  contentClassName?: string
  children: ReactNode
}

/** Standard act section wrapper — one viewport height with optional CMS media backdrop. */
export function ActPresetShell({
  rootRef,
  row,
  contentImageKey,
  ariaLabel,
  className = 'bg-[var(--color-bg)]',
  contentClassName,
  children,
}: ActPresetShellProps) {
  return (
    <section
      ref={rootRef}
      className={cn(ACT_SECTION_CLASS, className)}
      aria-label={ariaLabel}
    >
      <ActMediaBackdrop row={row} contentImageKey={contentImageKey} />
      <div className={cn(ACT_CONTENT_CLASS, contentClassName)}>{children}</div>
    </section>
  )
}
