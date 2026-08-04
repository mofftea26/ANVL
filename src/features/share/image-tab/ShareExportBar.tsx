import { Download, Share2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { ShareCapabilities } from '../types'

/**
 * The pinned bottom zone — always in the thumb arc, never scrolled away.
 *
 * It holds ONLY what has to be reachable at all times: the primary action and
 * the two messages that explain why it might not work. The send-to grid lives
 * in the scrolling zone (see `ShareSendPanel`); pinning it too left the middle
 * of the sheet 16px tall on a 390×844 phone.
 *
 * The primary action is capability-aware. On a phone that supports
 * `navigator.share({ files })`, sharing IS the action: it is the only route
 * that puts a real PNG into Instagram or WhatsApp, so it gets the gradient
 * button and Download becomes a 44px companion. Everywhere else the saved file
 * is the only thing that can travel, so Download leads alone. Previously
 * Download was always primary and the one-tap path was an icon in a scroller.
 *
 * From `lg` the tab mounts this INSIDE the controls column instead of across
 * the sheet, so the horizontal padding and the safe-area inset — both of which
 * exist for a full-bleed phone sheet — come off and the rule above it becomes
 * the foot of that column. See {@link ShareImageTab} for why it moves.
 */
export function ShareExportBar({
  capabilities,
  ready,
  failed,
  hint,
  onPrimary,
  onDownload,
}: {
  capabilities: ShareCapabilities
  ready: boolean
  failed: boolean
  hint: string | null
  onPrimary: () => void
  onDownload: () => void
}) {
  const canShareFiles = capabilities.canShareFiles

  return (
    <div
      className={cn(
        'shrink-0 border-t border-[var(--color-line)] bg-[var(--color-surface)]',
        'px-5 pt-3 pb-[max(env(safe-area-inset-bottom),0.875rem)]',
        'lg:px-0 lg:pb-0 lg:pt-4',
      )}
    >
      {failed ? (
        // A tainted canvas used to present as a dead button and eleven dead
        // tiles with no explanation. Adding a photo is a genuine workaround —
        // the user's own file is same-origin, so it never taints.
        <p
          role="alert"
          className={cn(
            'mb-2 rounded-lg border-l-2 border-[var(--color-danger)] px-3 py-2 text-[11px]',
            'bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] text-[var(--color-text)]',
          )}
        >
          This piece&rsquo;s artwork can&rsquo;t be exported. Add your own photo to build the image.
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          disabled={!ready}
          onClick={onPrimary}
          className={canShareFiles ? 'flex-1' : 'w-full'}
        >
          {canShareFiles ? (
            <Share2 size={ICON_SIZE.md} aria-hidden="true" />
          ) : (
            <Download size={ICON_SIZE.md} aria-hidden="true" />
          )}
          {canShareFiles ? 'Share image' : 'Save image'}
        </Button>
        {canShareFiles ? (
          <Button
            variant="secondary"
            size="icon"
            aria-label="Save image"
            disabled={!ready}
            onClick={onDownload}
          >
            <Download size={ICON_SIZE.md} aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {hint ? (
        <p
          role="status"
          className={cn(
            'mt-2 rounded-lg border-l-2 border-[var(--color-highlight)] px-3 py-2 text-[11px]',
            'bg-[var(--color-surface-elevated)] text-[var(--color-text)]',
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
