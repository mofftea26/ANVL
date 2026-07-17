import { useState } from 'react'
import { Download, Share2, Sparkles } from 'lucide-react'
import {
  generateShareImage,
} from '@/features/storefront-account/account/panels/armory/armoryShare'
import {
  FacebookIcon,
  TelegramIcon,
  WhatsAppIcon,
  XIcon,
} from '@/features/storefront-account/account/panels/armory/socialIcons'
import { BRAND } from '@/shared/constants/brand'
import { useOwnedPassportsQuery } from '../hooks/usePassport'

/**
 * Share THIS piece to social — from the passport itself. Links always point
 * at the SHOP product page (never the passport URL: the token is the claim
 * secret and must not travel). The image generator renders the piece card.
 */
export function PassportShareSection({
  productSlug,
  productName,
  ownerName,
  imageUrl,
}: {
  productSlug: string
  productName: string
  ownerName: string
  imageUrl: string | null
}) {
  const ownedQuery = useOwnedPassportsQuery()
  const wearCount =
    (ownedQuery.data ?? []).find((p) => p.productSlug === productSlug)?.wearCount ?? 0
  const [result, setResult] = useState<{ dataUrl: string; blob: Blob | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const url = `${BRAND.canonicalBaseUrl}/shop/${productSlug}`
  const text = `${productName} — forged by ${ownerName} at ANVL.`
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const intents = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      tint: '#25D366',
      Icon: WhatsAppIcon,
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      tint: '#1877F2',
      Icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      key: 'x',
      label: 'X',
      tint: '#E7E4DF',
      Icon: XIcon,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      tint: '#26A5E4',
      Icon: TelegramIcon,
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
  ]

  const generate = async () => {
    setBusy(true)
    try {
      setResult(
        await generateShareImage({
          format: 'story',
          template: 'forge',
          subject: {
            kind: 'piece',
            pieceName: productName,
            imageSrc: imageUrl ?? undefined,
            wearCount,
          },
          ownerName,
          url,
        }),
      )
    } finally {
      setBusy(false)
    }
  }

  const shareImage = async () => {
    if (!result?.blob) return
    const file = new File([result.blob], 'anvl-piece.png', { type: 'image/png' })
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: productName, text })
        return
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.share({ title: productName, text, url })
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {intents.map(({ key, label, tint, Icon, href }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share on ${label}`}
            title={label}
            className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-[var(--color-surface-elevated)] motion-safe:transition-transform hover:-translate-y-0.5"
          >
            <Icon className="block h-5 w-5" style={{ color: tint }} />
          </a>
        ))}
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void shareImage()}
            aria-label="Share…"
            title="Share…"
            className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-[var(--color-surface-elevated)] text-[var(--color-heading)] motion-safe:transition-transform hover:-translate-y-0.5"
          >
            <Share2 size={17} aria-hidden="true" className="block" />
          </button>
        ) : null}
      </div>
      <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
        Links point at the product page — your passport stays private.
      </p>

      {result ? (
        <div className="flex items-end gap-3">
          <img
            src={result.dataUrl}
            alt="Share image preview"
            className="max-h-44 w-auto rounded-lg shadow-[0_14px_44px_-12px_rgba(0,0,0,0.8)]"
          />
          <div className="flex flex-col gap-2">
            <a
              href={result.dataUrl}
              download="anvl-piece.png"
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--color-on-highlight)] no-underline"
            >
              <Download size={13} aria-hidden="true" /> Download
            </a>
            {canNativeShare ? (
              <button
                type="button"
                onClick={() => void shareImage()}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)]"
              >
                <Share2 size={13} aria-hidden="true" /> Share image
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)] disabled:opacity-50"
        >
          <Sparkles size={13} aria-hidden="true" />
          {busy ? 'Forging…' : 'Create a share image'}
        </button>
      )}
    </div>
  )
}
