import { useState } from 'react'
import { Check, Copy } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { buildShareCaption, buildShareTitle } from '../captions'
import { openAppOrWeb } from '../openTarget'
import { SendToGrid } from '../SendToGrid'
import { copyText, shareLink } from '../shareActions'
import { resolveShareRoute, type ShareTarget } from '../targets'
import type { ShareCapabilities, ShareContext } from '../types'

/**
 * The link tab — words and a URL, never pixels. Sharing here always goes to
 * the public armory: the passport token is the claim secret and must not
 * travel on a post.
 *
 * Nothing here is width-driven. `ShareModal` centres this tab at a 30rem
 * reading measure inside the 896px `lg` shell, so the URL field and the caption
 * box keep the same comfortable line length they have on a phone instead of
 * stretching into a single hairline of text across the dialog.
 */
export function ShareLinkTab({
  context,
  capabilities,
}: {
  context: ShareContext
  capabilities: ShareCapabilities
}) {
  const [copied, setCopied] = useState<'url' | 'caption' | null>(null)
  const caption = buildShareCaption(context)

  const copy = async (value: string, which: 'url' | 'caption') => {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(which)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const send = async (target: ShareTarget) => {
    const route = resolveShareRoute(target, capabilities, { url: context.url, caption })

    // The launch goes first and unawaited: WebKit's user activation does not
    // survive an await, and a custom scheme needs a top-level navigation, not
    // a popup. `openAppOrWeb` owns both rules for every call site.
    if (route.launch) {
      openAppOrWeb(route.launch, route.platform)
      return
    }

    // Link sharing has no file, so the OS-sheet route degrades to a link share.
    if (route.kind === 'os-share-file') {
      const shared = await shareLink({
        title: buildShareTitle(context),
        text: caption,
        url: context.url,
      })
      if (shared) return
    }
    await copy(route.message, 'caption')
  }

  return (
    <div>
      <label className="block">
        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
          Your public armory
        </span>
        <span className="mt-1 flex items-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] p-1.5">
          <input
            readOnly
            value={context.url}
            aria-label="Your public armory link"
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-[var(--color-text-muted)] outline-none"
          />
          <button
            type="button"
            onClick={() => void copy(context.url, 'url')}
            aria-label="Copy link"
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-heading)] motion-safe:transition-colors hover:bg-[var(--color-surface)]"
          >
            {copied === 'url' ? (
              <Check size={ICON_SIZE.md} aria-hidden="true" className="block text-[var(--color-success)]" />
            ) : (
              <Copy size={ICON_SIZE.md} aria-hidden="true" className="block" />
            )}
          </button>
        </span>
      </label>

      <label className="mt-4 block">
        <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">Caption</span>
        <span className="mt-1 flex items-start gap-2 rounded-xl bg-[var(--color-surface-elevated)] p-1.5">
          <textarea
            readOnly
            rows={2}
            value={caption}
            aria-label="Post caption"
            onFocus={(event) => event.currentTarget.select()}
            className="min-w-0 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] outline-none"
          />
          <button
            type="button"
            onClick={() => void copy(caption, 'caption')}
            aria-label="Copy caption"
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-heading)] motion-safe:transition-colors hover:bg-[var(--color-surface)]"
          >
            {copied === 'caption' ? (
              <Check size={ICON_SIZE.md} aria-hidden="true" className="block text-[var(--color-success)]" />
            ) : (
              <Copy size={ICON_SIZE.md} aria-hidden="true" className="block" />
            )}
          </button>
        </span>
      </label>

      <p className="anvl-micro mt-4 text-[10px] text-[var(--color-text-muted)]">Send the link to</p>
      <SendToGrid capabilities={capabilities} disabled={false} onPick={(t) => void send(t)} />

      <p className="anvl-micro mt-3 text-[10px] text-[var(--color-text-muted)]">
        Your passport link stays private — only your armory is shared.
      </p>
    </div>
  )
}
