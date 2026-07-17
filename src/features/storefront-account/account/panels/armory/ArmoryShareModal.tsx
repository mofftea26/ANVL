import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, ImagePlus, Share2, X } from 'lucide-react'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import {
  generateShareImage,
  HUD_TEMPLATES,
  isHudTemplate,
  SHARE_FORMATS,
  SHARE_TARGETS,
  SHARE_TEMPLATES,
  type HudTemplateKey,
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

/** Preview frame aspect per format (w/h). */
const FORMAT_ASPECT: Record<ShareFormatKey, string> = {
  story: 'aspect-[9/16]',
  post: 'aspect-[4/5]',
  square: 'aspect-square',
}

/** Mini gradient swatches so templates read at a glance. */
const TEMPLATE_SWATCH: Record<ShareTemplateKey | HudTemplateKey, string> = {
  forge: 'bg-[linear-gradient(160deg,#1D1F21_0%,#0B0B0C_70%)]',
  champagne: 'bg-[linear-gradient(160deg,#2A2118_0%,#0B0B0C_70%)]',
  stealth: 'bg-[#0B0B0C]',
  'hud-modern': 'bg-[linear-gradient(90deg,#C5A56A_0%,#C5A56A_18%,#1D1F21_18%)]',
  'hud-minimal': 'bg-[#141416]',
  'hud-premium': 'bg-[#141416] ring-1 ring-inset ring-[#C5A56A]/60',
  'hud-luxe': 'bg-[#141416] ring-2 ring-inset ring-[#C5A56A]',
  'hud-game': 'bg-[conic-gradient(from_45deg,#C5A56A_0deg,#C5A56A_40deg,#141416_40deg)]',
  'hud-jarvis': 'bg-[radial-gradient(circle_at_center,#C5A56A_0%,#C5A56A_18%,#141416_20%)]',
}

export interface SharePiece {
  slug: string
  name: string
  image?: string
  wearCount: number
}

/**
 * The share sheet, preview-first: the image regenerates live as you switch
 * subject (armory / piece / feat), format (story / post / square), template,
 * or drop in a gallery/camera photo — then download it, share the file, or
 * fire a social intent. Mobile-first single column; the preview leads.
 */
export function ArmoryShareModal({
  open,
  onClose,
  url,
  ownerName,
  rank,
  pieces,
  feats,
  memberSince,
  initialSubjectKey = 'armory',
}: {
  open: boolean
  onClose: () => void
  url: string
  ownerName: string
  rank: ArmoryRank
  pieces: SharePiece[]
  feats: ArmoryFeat[]
  memberSince: string | null
  /** Preselect a subject (e.g. `piece:<slug>` when opened from a passport). */
  initialSubjectKey?: string
}) {
  const [copied, setCopied] = useState(false)
  const [subjectKey, setSubjectKey] = useState(initialSubjectKey)

  // Re-arm the preset each time the sheet opens (it can be reopened for a
  // different piece from the same mount).
  useEffect(() => {
    if (open) setSubjectKey(initialSubjectKey)
  }, [open, initialSubjectKey])
  const [format, setFormat] = useState<ShareFormatKey>('story')
  const [template, setTemplate] = useState<ShareTemplateKey | HudTemplateKey>('forge')
  const [background, setBackground] = useState<string | null>(null)
  const [result, setResult] = useState<{ dataUrl: string; blob: Blob | null } | null>(null)
  const [rendering, setRendering] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const text = `${ownerName}'s ANVL armory — ${rank.title}.`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

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

  // Live preview: regenerate (debounced) whenever an option changes.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRendering(true)
    const timer = window.setTimeout(() => {
      void generateShareImage({
        format,
        template,
        subject: buildSubject(),
        ownerName,
        url,
        backgroundDataUrl: background,
        stats: {
          rankTitle: rank.title,
          pieceCount: pieces.length,
          featCount: feats.length,
          latestFeat: feats[0]
            ? { title: feats[0].title, achievedOn: feats[0].achievedOn }
            : null,
          totalWears: pieces.reduce((sum, p) => sum + p.wearCount, 0),
          memberSince,
        },
      })
        .then((r) => {
          if (!cancelled) setResult(r)
        })
        .finally(() => {
          if (!cancelled) setRendering(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // buildSubject is derived from these deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subjectKey, format, template, background, ownerName, url])

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

  const shareImage = async () => {
    if (!result?.blob) return
    const file = new File([result.blob], 'anvl-armory.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'My ANVL Armory', text })
        return
      } catch {
        /* dismissed */
      }
    }
    await nativeShare()
  }

  const appClick = async (href: string | null) => {
    if (href) {
      window.open(href, '_blank', 'noopener')
      return
    }
    if (canNativeShare) {
      await shareImage()
      return
    }
    await copy()
  }

  const pickBackground = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBackground(typeof reader.result === 'string' ? reader.result : null)
      // A photo backdrop switches the template set to the HUD styles.
      if (!isHudTemplate(template)) setTemplate('hud-modern')
    }
    reader.readAsDataURL(file)
  }

  const removeBackground = () => {
    setBackground(null)
    if (isHudTemplate(template)) setTemplate('forge')
  }

  // With a photo, templates are HUD overlays; without, the brand backdrops.
  const templateChoices = background ? HUD_TEMPLATES : SHARE_TEMPLATES

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-label="Share your armory"
      className="max-h-[92svh] w-full max-w-md overflow-y-auto p-0 sm:max-w-lg"
    >
      {/* Header ----------------------------------------------------------- */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[var(--color-surface)] px-5 pb-3 pt-4">
        <h2 className="anvl-heading text-xl text-[var(--color-heading)]">Share</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring grid h-10 w-10 place-items-center rounded-full text-[var(--color-text-muted)] motion-safe:transition-colors hover:text-[var(--color-text)]"
        >
          <X size={18} aria-hidden="true" className="block" />
        </button>
      </div>

      <div className="px-5 pb-5">
        {/* Live preview --------------------------------------------------- */}
        <div className="flex justify-center rounded-2xl bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] p-4">
          <div
            className={cn(
              'relative max-h-[38svh] overflow-hidden rounded-xl shadow-[0_16px_50px_-14px_rgba(0,0,0,0.8)]',
              FORMAT_ASPECT[format],
            )}
          >
            {result ? (
              <img
                src={result.dataUrl}
                alt="Share image preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="h-full min-h-[10rem] w-[10rem] bg-[var(--color-surface-elevated)]" />
            )}
            {rendering ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 animate-pulse bg-[color-mix(in_oklab,var(--color-bg)_45%,transparent)]"
              />
            ) : null}
          </div>
        </div>

        {/* Format --------------------------------------------------------- */}
        <div role="radiogroup" aria-label="Image format" className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-[var(--color-surface-elevated)] p-1">
          {SHARE_FORMATS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={format === f.key}
              onClick={() => setFormat(f.key)}
              className={cn(
                'focus-ring rounded-full py-2 text-[10px] font-semibold uppercase tracking-[0.12em] motion-safe:transition-colors',
                format === f.key
                  ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                  : 'text-[var(--color-text-muted)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Template + photo ------------------------------------------------ */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {templateChoices.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={template === t.key}
              onClick={() => setTemplate(t.key)}
              className={cn(
                'focus-ring flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors',
                template === t.key
                  ? 'bg-[var(--color-surface-elevated)] text-[var(--color-heading)] ring-1 ring-[var(--color-highlight-bright)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-5 w-5 rounded-full', TEMPLATE_SWATCH[t.key])}
              />
              {t.label}
            </button>
          ))}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickBackground(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => (background ? removeBackground() : fileRef.current?.click())}
            className={cn(
              'focus-ring ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] motion-safe:transition-colors',
              background
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-heading)] ring-1 ring-[var(--color-highlight-bright)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            <ImagePlus size={13} aria-hidden="true" />
            {background ? 'Photo ✕' : 'Photo'}
          </button>
        </div>

        {/* Subject ---------------------------------------------------------- */}
        <select
          value={subjectKey}
          onChange={(e) => setSubjectKey(e.target.value)}
          aria-label="What to share"
          className="focus-ring mt-3 w-full rounded-xl border-0 bg-[var(--color-surface-elevated)] px-3 py-2.5 text-base text-[var(--color-heading)] md:text-sm"
        >
          <option value="armory">My armory — {rank.title}</option>
          {pieces.length > 0 ? (
            <optgroup label="A piece">
              {pieces.map((p) => (
                <option key={p.slug} value={`piece:${p.slug}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
          {feats.length > 0 ? (
            <optgroup label="A feat">
              {feats.map((f) => (
                <option key={f.id} value={`feat:${f.id}`}>
                  {f.title}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>

        {/* Actions ---------------------------------------------------------- */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={result?.dataUrl}
            download="anvl-armory.png"
            aria-disabled={!result}
            className={cn(
              'focus-ring flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)] no-underline',
              !result && 'pointer-events-none opacity-50',
            )}
          >
            <Download size={15} aria-hidden="true" /> Download
          </a>
          <button
            type="button"
            onClick={() => void (canNativeShare ? shareImage() : copy())}
            className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-heading)]"
          >
            <Share2 size={15} aria-hidden="true" />
            {canNativeShare ? 'Share' : copied ? 'Copied' : 'Copy link'}
          </button>
        </div>

        {/* Apps -------------------------------------------------------------- */}
        <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1 [mask-image:linear-gradient(90deg,black_calc(100%-18px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SHARE_TARGETS.map((t) => {
            const IconCmp = TARGET_ICONS[t.key]
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => void appClick(t.href(url, text))}
                aria-label={`Share on ${t.label}`}
                title={t.label}
                className="focus-ring grid h-12 w-12 shrink-0 snap-start place-items-center rounded-full bg-[var(--color-surface-elevated)] motion-safe:transition-transform hover:-translate-y-0.5"
              >
                <IconCmp className="block h-5 w-5" style={{ color: t.tint }} />
              </button>
            )
          })}
        </div>

        {/* Link row ----------------------------------------------------------- */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] p-1.5">
          <input
            readOnly
            value={url}
            aria-label="Your public armory link"
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-[var(--color-text-muted)] outline-none"
          />
          <button
            type="button"
            onClick={copy}
            aria-label="Copy link"
            className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-heading)] motion-safe:transition-colors hover:bg-[var(--color-surface)]"
          >
            {copied ? (
              <Check size={15} aria-hidden="true" className="block text-[var(--color-success)]" />
            ) : (
              <Copy size={15} aria-hidden="true" className="block" />
            )}
          </button>
        </div>

      </div>
    </Modal>
  )
}
