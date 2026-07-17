import { useRef, useState } from 'react'
import { Check, Copy, Download, ImagePlus, Share2, Sparkles } from 'lucide-react'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import {
  generateShareImage,
  SHARE_FORMATS,
  SHARE_TARGETS,
  SHARE_TEMPLATES,
  type ShareFormatKey,
  type ShareSubject,
  type ShareTemplateKey,
} from './armoryShare'
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
  TikTokIcon,
  WhatsAppIcon,
  XIcon,
} from './socialIcons'

const TARGET_ICONS = {
  whatsapp: WhatsAppIcon,
  facebook: FacebookIcon,
  x: XIcon,
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  discord: DiscordIcon,
} as const

export interface SharePiece {
  slug: string
  name: string
  image?: string
  wearCount: number
}

/**
 * The Armory share sheet: copy the link, fire the native sheet (mobile — every
 * installed app), jump into web intents (real brand logos), or open the image
 * studio — pick a subject (armory / a piece / a feat), a format (story / post
 * / square), a template, and optionally a gallery or camera photo as the
 * backdrop — then download or share the generated image.
 */
export function ArmoryShareModal({
  open,
  onClose,
  url,
  ownerName,
  rank,
  pieces,
  feats,
  onStopSharing,
}: {
  open: boolean
  onClose: () => void
  url: string
  ownerName: string
  rank: ArmoryRank
  pieces: SharePiece[]
  feats: ArmoryFeat[]
  onStopSharing: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  // Image studio state.
  const [subjectKey, setSubjectKey] = useState('armory')
  const [format, setFormat] = useState<ShareFormatKey>('story')
  const [template, setTemplate] = useState<ShareTemplateKey>('forge')
  const [background, setBackground] = useState<string | null>(null)
  const [result, setResult] = useState<{ dataUrl: string; blob: Blob | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const text = `${ownerName}'s ANVL armory — ${rank.title}.`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard denied — the field is selectable */
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: 'My ANVL Armory', text, url })
    } catch {
      /* dismissed */
    }
  }

  const buildSubject = (): ShareSubject => {
    if (subjectKey.startsWith('piece:')) {
      const piece = pieces.find((p) => p.slug === subjectKey.slice(6))
      if (piece) {
        return {
          kind: 'piece',
          pieceName: piece.name,
          imageSrc: piece.image,
          wearCount: piece.wearCount,
        }
      }
    }
    if (subjectKey.startsWith('feat:')) {
      const feat = feats.find((f) => f.id === subjectKey.slice(5))
      if (feat) {
        return {
          kind: 'feat',
          featTitle: feat.title,
          achievedOn: feat.achievedOn,
          pieceName: pieces.find((p) => p.slug === feat.productSlug)?.name,
        }
      }
    }
    return {
      kind: 'armory',
      rankTitle: rank.title,
      rankEmblemSrc: rank.emblemSrc,
      pieceCount: pieces.length,
      featCount: feats.length,
    }
  }

  const generate = async () => {
    setBusy(true)
    try {
      setResult(
        await generateShareImage({
          format,
          template,
          subject: buildSubject(),
          ownerName,
          url,
          backgroundDataUrl: background,
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const pickBackground = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBackground(typeof reader.result === 'string' ? reader.result : null)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }

  const shareImage = async () => {
    if (!result?.blob) return
    const file = new File([result.blob], 'anvl-armory.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My ANVL Armory', text })
      } catch {
        /* dismissed */
      }
    }
  }

  const appClick = async (label: string, href: string | null) => {
    if (href) {
      window.open(href, '_blank', 'noopener')
      return
    }
    // No web intent (Instagram/TikTok/Discord): native sheet when we have it,
    // otherwise copy the link and steer to the image studio.
    if (canNativeShare) {
      await nativeShare()
      return
    }
    await copy()
    setHint(`Link copied — create an image below and post it in ${label}.`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share your armory"
      className="max-h-[85svh] max-w-lg overflow-y-auto"
    >
      {/* Link row -------------------------------------------------------- */}
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

      {canNativeShare ? (
        <button
          type="button"
          onClick={nativeShare}
          className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--color-heading)]"
        >
          <Share2 size={16} aria-hidden="true" /> Share…
        </button>
      ) : null}

      {/* Apps ------------------------------------------------------------- */}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {SHARE_TARGETS.map((t) => {
          const IconCmp = TARGET_ICONS[t.key]
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => void appClick(t.label, t.href(url, text))}
              aria-label={`Share on ${t.label}`}
              className="focus-ring flex flex-col items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-1 py-3 motion-safe:transition-colors hover:border-[var(--color-highlight-bright)]"
            >
              <IconCmp className="h-5 w-5" style={{ color: t.tint }} />
              <span className="anvl-micro text-[8px] text-[var(--color-text)]">{t.label}</span>
            </button>
          )
        })}
      </div>
      {hint ? (
        <p className="anvl-micro mt-2 text-[10px] text-[var(--color-highlight-bright)]">{hint}</p>
      ) : null}

      {/* Image studio ------------------------------------------------------ */}
      <div className="mt-5 rounded-xl border border-[color-mix(in_oklab,var(--color-highlight)_30%,var(--color-line))] bg-[var(--color-surface)] p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
          <Sparkles size={15} aria-hidden="true" className="text-[var(--color-highlight-bright)]" />
          Create a share image
        </p>
        <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
          Story, post or message — your armory, a piece, or a feat.
        </p>

        {/* Subject */}
        <label htmlFor="share-subject" className="anvl-micro mt-3 block text-[10px] text-[var(--color-text-muted)]">
          Subject
        </label>
        <select
          id="share-subject"
          value={subjectKey}
          onChange={(e) => {
            setSubjectKey(e.target.value)
            setResult(null)
          }}
          className="focus-ring mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-3 py-2 text-base text-[var(--color-heading)] md:text-sm"
        >
          <option value="armory">Your armory — {rank.title}</option>
          {pieces.length > 0 ? (
            <optgroup label="Pieces">
              {pieces.map((p) => (
                <option key={p.slug} value={`piece:${p.slug}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {feats.length > 0 ? (
            <optgroup label="Feats">
              {feats.map((f) => (
                <option key={f.id} value={`feat:${f.id}`}>
                  {f.title}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>

        {/* Format + template */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {SHARE_FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={format === f.key}
              onClick={() => {
                setFormat(f.key)
                setResult(null)
              }}
              className={cn(
                'focus-ring rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors',
                format === f.key
                  ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                  : 'border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {f.label}
            </button>
          ))}
          <span aria-hidden="true" className="mx-1 h-4 w-px bg-[var(--color-line)]" />
          {SHARE_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={template === t.key}
              onClick={() => {
                setTemplate(t.key)
                setResult(null)
              }}
              className={cn(
                'focus-ring rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors',
                template === t.key
                  ? 'border border-[var(--color-highlight-bright)] text-[var(--color-heading)]'
                  : 'border border-[var(--color-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Background */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickBackground(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] hover:border-[var(--color-highlight-bright)]"
          >
            <ImagePlus size={13} aria-hidden="true" />
            {background ? 'Change photo' : 'Use your photo'}
          </button>
          {background ? (
            <button
              type="button"
              onClick={() => {
                setBackground(null)
                setResult(null)
              }}
              className="focus-ring anvl-micro rounded px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Remove photo
            </button>
          ) : (
            <span className="anvl-micro text-[9px] text-[var(--color-text-muted)]">
              Gallery or camera — used as the backdrop.
            </span>
          )}
        </div>

        {/* Generate + result */}
        {result ? (
          <div className="mt-3 flex items-end gap-3">
            <img
              src={result.dataUrl}
              alt="Share image preview"
              className="max-h-44 w-auto rounded-lg border border-[var(--color-line)]"
            />
            <div className="flex flex-col gap-2">
              <a
                href={result.dataUrl}
                download="anvl-armory.png"
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-on-highlight)] no-underline"
              >
                <Download size={13} aria-hidden="true" /> Download
              </a>
              {canNativeShare && result.blob ? (
                <button
                  type="button"
                  onClick={shareImage}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]"
                >
                  <Share2 size={13} aria-hidden="true" /> Share image
                </button>
              ) : null}
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="focus-ring anvl-micro rounded px-2 py-1 text-left text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="focus-ring mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)] disabled:opacity-50"
          >
            <Sparkles size={13} aria-hidden="true" />
            {busy ? 'Forging…' : 'Generate image'}
          </button>
        )}
      </div>

      {/* Stop sharing ------------------------------------------------------ */}
      <button
        type="button"
        onClick={onStopSharing}
        className="focus-ring anvl-micro mt-4 rounded px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-destructive)]"
      >
        Stop sharing — make my armory private
      </button>
    </Modal>
  )
}
