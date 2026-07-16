import { useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import {
  useArmoryShareQuery,
  useSetArmoryShareMutation,
} from '@/features/passport/hooks/useArmory'
import { BRAND } from '@/shared/constants/brand'
import { cn } from '@/shared/lib/cn'

/**
 * The share control for the owner's Armory — the "write" side's gateway to the
 * public "read" side. Flip the switch to mint (once) a non-guessable handle and
 * expose a read-only /armory/$handle page; flip it off to hide it again. The
 * handle survives toggling, so a shared link revives rather than rotting.
 */
export function ArmoryShareCard() {
  const shareQuery = useArmoryShareQuery()
  const setShare = useSetArmoryShareMutation()
  const [copied, setCopied] = useState(false)

  const share = shareQuery.data
  const isPublic = share?.isPublic ?? false
  const url =
    isPublic && share?.handle ? `${BRAND.canonicalBaseUrl}/armory/${share.handle}` : null

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard denied — the field is selectable as a fallback */
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Share2 size={16} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          <div>
            <h3 className="anvl-heading text-lg text-[var(--color-heading)]">Share your armory</h3>
            <p className="anvl-micro mt-0.5 text-[var(--color-text-muted)]">
              A public, read-only page of your collection, honors and public feats.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label="Make my armory public"
          disabled={setShare.isPending || shareQuery.isLoading}
          onClick={() => setShare.mutate(!isPublic)}
          className="focus-ring mt-1 shrink-0 disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={cn(
              'relative block h-6 w-11 rounded-full motion-safe:transition-colors',
              isPublic ? 'bg-[var(--color-highlight-bright)]' : 'bg-[var(--color-surface-elevated)]',
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-4 w-4 rounded-full bg-[var(--color-heading)] motion-safe:transition-transform',
                isPublic ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </span>
        </button>
      </div>

      {url ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-2">
          <input
            readOnly
            value={url}
            aria-label="Your public armory link"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[var(--color-text)] outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-on-highlight)]"
          >
            {copied ? (
              <>
                <Check size={13} aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy size={13} aria-hidden="true" /> Copy
              </>
            )}
          </button>
        </div>
      ) : null}
    </section>
  )
}
