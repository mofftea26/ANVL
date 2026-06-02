import type { CSSProperties, RefObject, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ActMediaBackdrop } from './ActMediaBackdrop'
import {
  ACT_CONTENT_CLASS,
  ACT_CONTENT_INNER_CLASS,
  actSectionClassName,
  type ActSectionSize,
} from './actPresetUtils'
import { ACT_RESPONSIVE_CLASS, ACT_RESPONSIVE_STYLE } from './actResponsiveTokens'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

type ActPresetShellProps = {
  rootRef?: RefObject<HTMLElement | null>
  row?: LandingAct
  contentImageKey?: string
  ariaLabel: string
  sectionSize?: ActSectionSize
  className?: string
  contentClassName?: string
  children: ReactNode
}

/** Standard act section wrapper with optional CMS media backdrop. */
export function ActPresetShell({
  rootRef,
  row,
  contentImageKey,
  ariaLabel,
  sectionSize = 'default',
  className = 'bg-[var(--color-bg)]',
  contentClassName,
  children,
}: ActPresetShellProps) {
  return (
    <section
      ref={rootRef}
      className={cn(actSectionClassName(sectionSize), ACT_RESPONSIVE_CLASS, className)}
      style={ACT_RESPONSIVE_STYLE as CSSProperties}
      aria-label={ariaLabel}
    >
      <div
        data-act-transition
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-[var(--color-bg)]/0 to-[var(--color-bg)]/20"
        aria-hidden
      />
      <ActMediaBackdrop row={row} contentImageKey={contentImageKey} />
      <div className={cn(ACT_CONTENT_CLASS, contentClassName)}>
        <div className={ACT_CONTENT_INNER_CLASS}>{children}</div>
      </div>
    </section>
  )
}
