import { useState } from 'react'
import { Check, Copy, Download, Instagram, Share2, Sparkles } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal'
import {
  generateArmoryStoryImage,
  NATIVE_ONLY_APPS,
  SHARE_TARGETS,
} from './armoryShare'

/**
 * The share sheet for a public armory. Copy the link, fire the native share
 * sheet (mobile — lists every installed app incl. Instagram/TikTok/Discord),
 * jump straight into the web share intents that support one, or generate a
 * premium Instagram-story image to post.
 */
export function ArmoryShareModal({
  open,
  onClose,
  url,
  ownerName,
  rankTitle,
  rankEmblemSrc,
  pieceCount,
}: {
  open: boolean
  onClose: () => void
  url: string
  ownerName: string
  rankTitle: string
  rankEmblemSrc: string
  pieceCount: number
}) {
  const [copied, setCopied] = useState(false)
  const [story, setStory] = useState<{ dataUrl: string; blob: Blob | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const text = `${ownerName}'s ANVL armory — ${rankTitle}, ${pieceCount} ${
    pieceCount === 1 ? 'piece' : 'pieces'
  } forged.`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard denied */
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'My ANVL Armory', text, url })
    } catch {
      /* user dismissed */
    }
  }

  const makeStory = async () => {
    setBusy(true)
    try {
      const result = await generateArmoryStoryImage({
        ownerName,
        rankTitle,
        rankEmblemSrc,
        pieceCount,
        url,
      })
      setStory(result)
    } finally {
      setBusy(false)
    }
  }

  const shareStoryImage = async () => {
    if (!story?.blob) return
    const file = new File([story.blob], 'anvl-armory.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My ANVL Armory', text })
      } catch {
        /* dismissed */
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share your armory" className="max-w-lg">
      {/* Copy link */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-2">
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
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Native share (mobile lists every installed app) */}
      {canNativeShare ? (
        <button
          type="button"
          onClick={nativeShare}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)]"
        >
          <Share2 size={16} aria-hidden="true" /> Share…
        </button>
      ) : null}

      {/* Web-intent apps */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {SHARE_TARGETS.map((t) => {
          const href = t.href(url, text)
          if (!href) return null
          return (
            <a
              key={t.key}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="focus-ring flex flex-col items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-3 no-underline motion-safe:transition-colors hover:border-[var(--color-highlight-bright)]"
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: t.tint }}
              />
              <span className="anvl-micro text-[9px] text-[var(--color-text)]">{t.label}</span>
            </a>
          )
        })}
      </div>

      {/* Instagram story template */}
      <div className="mt-5 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface)] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
          <Instagram size={15} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          Post it as a story
        </p>
        <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
          {NATIVE_ONLY_APPS.join(', ')} don&apos;t take web links — generate a story image and
          post it, with your link in the sticker.
        </p>

        {story ? (
          <div className="mt-3 flex items-end gap-3">
            <img
              src={story.dataUrl}
              alt="Your armory story preview"
              className="h-40 w-auto rounded-lg border border-[var(--color-line)]"
            />
            <div className="flex flex-col gap-2">
              <a
                href={story.dataUrl}
                download="anvl-armory-story.png"
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-on-highlight)] no-underline"
              >
                <Download size={13} aria-hidden="true" /> Download
              </a>
              {canNativeShare && story.blob ? (
                <button
                  type="button"
                  onClick={shareStoryImage}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]"
                >
                  <Share2 size={13} aria-hidden="true" /> Share image
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={makeStory}
            disabled={busy}
            className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-heading)] disabled:opacity-50"
          >
            <Sparkles size={13} aria-hidden="true" />
            {busy ? 'Forging…' : 'Create story image'}
          </button>
        )}
      </div>
    </Modal>
  )
}
