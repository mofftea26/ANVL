import type { ReactElement } from 'react'
import { Share2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { describeShareTarget, SHARE_TARGETS, type ShareTarget } from './targets'
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
  type ShareIconProps,
} from './socialIcons'
import type { ShareCapabilities, SharePlatformKey } from './types'

/** "More" wears the generic sheet glyph, from the shared icon seam. */
function SystemShareIcon({ size = ICON_SIZE.lg, className }: ShareIconProps): ReactElement {
  return <Share2 size={size} className={className} aria-hidden="true" />
}

/** One glyph per platform — the four Instagram tiles deliberately share one. */
const PLATFORM_ICONS: Record<SharePlatformKey, (props: ShareIconProps) => ReactElement> = {
  instagram: InstagramIcon,
  whatsapp: WhatsAppIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  telegram: TelegramIcon,
  discord: DiscordIcon,
  system: SystemShareIcon,
}

/**
 * The send-to row. Every tile is live on every device — what changes is the
 * route behind it, resolved at tap time. The label under each tile is a
 * promise the routing has to keep.
 *
 * Layout: a wrapping grid, not a scroller. Eleven destinations in a fixed-width
 * scroll row is what put "WhatsApp" and "Telegram" on top of each other; here
 * every label owns a full grid cell, centred, and wraps rather than bleeding
 * into its neighbour. The glyph disc is 44px and the whole cell is the tap
 * target, so touch stays comfortably above the 44px floor.
 *
 * Colour comes from theme tokens only — the vendor brand tints that used to be
 * piped in through a `style` prop are gone, and the monochrome row reads far
 * more ANVL than a rainbow of logos anyway.
 */
export function SendToGrid({
  capabilities,
  disabled,
  onPick,
}: {
  capabilities: ShareCapabilities
  disabled: boolean
  onPick: (target: ShareTarget) => void
}) {
  return (
    <ul className="mt-3 grid list-none grid-cols-4 gap-x-1 gap-y-2 p-0 sm:grid-cols-6">
      {SHARE_TARGETS.map((target) => {
        const Icon = PLATFORM_ICONS[target.platform]
        return (
          <li key={target.key} className="min-w-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(target)}
              aria-label={`Share to ${target.title}`}
              title={describeShareTarget(target, capabilities)}
              className={cn(
                'focus-ring group flex w-full flex-col items-center rounded-xl px-0.5 py-2',
                'motion-safe:transition-transform hover:-translate-y-0.5 disabled:opacity-40',
                'disabled:hover:translate-y-0',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-full',
                  'bg-[var(--color-surface-elevated)] text-[var(--color-heading)]',
                  'motion-safe:transition-colors group-hover:text-[var(--color-highlight-bright)]',
                )}
              >
                <Icon size={ICON_SIZE.lg} className="block" />
              </span>
              <span className="mt-1.5 w-full text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.06em] text-[var(--color-text-muted)] [overflow-wrap:anywhere]">
                {target.label}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
