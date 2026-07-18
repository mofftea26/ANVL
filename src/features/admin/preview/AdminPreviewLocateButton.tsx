import { Crosshair } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import type { PreviewTarget } from '@/features/cms/preview'

import { requestPreviewFocus } from './adminPreviewStore'

interface AdminPreviewLocateButtonProps {
  target: PreviewTarget
  className?: string
}

/**
 * "Where is this on the site?" — asks the live preview to scroll to and ring
 * the element carrying this target id. Opens the preview panel if closed
 * (the shell listens for focus requests).
 */
export function AdminPreviewLocateButton({ target, className }: AdminPreviewLocateButtonProps) {
  return (
    <button
      type="button"
      title="Locate in live preview"
      aria-label={`Locate ${target.id} in the live preview`}
      onClick={() => requestPreviewFocus(target)}
      className={cn(
        'focus-ring inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-line)]/70 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]',
        className,
      )}
    >
      <Crosshair size={ICON_SIZE.sm} aria-hidden />
    </button>
  )
}
