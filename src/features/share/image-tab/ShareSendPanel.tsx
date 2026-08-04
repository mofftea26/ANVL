import { SendToGrid } from '../SendToGrid'
import type { ShareTarget } from '../targets'
import type { ShareCapabilities } from '../types'

/**
 * The eleven destinations, in the SCROLLING zone rather than the pinned bar.
 *
 * Measured: eleven tiles wrap to three rows and cost ~280px. Pinned alongside
 * the primary action that left the middle region 16px tall on a 390×844 phone
 * — the choices the sheet exists to offer had nowhere to live. Only the primary
 * action is genuinely thumb-critical, so only it stays pinned; browsing to a
 * specific app is a deliberate, two-handed act and can scroll.
 */
export function ShareSendPanel({
  capabilities,
  disabled,
  onSend,
}: {
  capabilities: ShareCapabilities
  disabled: boolean
  onSend: (target: ShareTarget) => void
}) {
  return (
    <div className="mt-5">
      <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">Send straight to</p>
      <SendToGrid capabilities={capabilities} disabled={disabled} onPick={onSend} />
    </div>
  )
}
