import { useState } from 'react'
import { Images, Share2 } from 'lucide-react'
import { ArmoryShareModal } from '@/features/storefront-account/account/panels/armory/ArmoryShareModal'
import {
  FacebookIcon,
  TelegramIcon,
  WhatsAppIcon,
  XIcon,
} from '@/features/storefront-account/account/panels/armory/socialIcons'
import { useArmoryFeatsQuery } from '../hooks/useArmory'
import { useOwnedPassportsQuery } from '../hooks/usePassport'
import { deriveArmoryRank } from '../lib/ranks'
import { BRAND } from '@/shared/constants/brand'

/**
 * Share THIS piece to social — from the passport itself. Links always point
 * at the SHOP product page (never the passport URL: the token is the claim
 * secret and must not travel). "Create a share image" opens the full share
 * studio (formats, templates, gallery/camera photo + HUD overlays) preset to
 * this piece — so the owner can post themselves wearing it.
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
  const featsQuery = useArmoryFeatsQuery()
  const owned = ownedQuery.data ?? []
  const [studioOpen, setStudioOpen] = useState(false)

  const wearCount = owned.find((p) => p.productSlug === productSlug)?.wearCount ?? 0
  const rank = deriveArmoryRank(owned.length, [])
  const memberSince =
    owned
      .map((p) => p.claimedAt)
      .filter((d): d is string => Boolean(d))
      .sort()[0] ?? null

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

  const nativeShare = async () => {
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
            onClick={() => void nativeShare()}
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

      <button
        type="button"
        onClick={() => setStudioOpen(true)}
        className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)]"
      >
        <Images size={14} aria-hidden="true" />
        Create a share image
      </button>

      {/* The full studio, preset to this piece — formats, templates, and a
          gallery/camera photo with the HUD overlays. */}
      <ArmoryShareModal
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        url={url}
        ownerName={ownerName}
        rank={rank}
        pieces={[{ slug: productSlug, name: productName, image: imageUrl ?? undefined, wearCount }]}
        feats={featsQuery.data ?? []}
        memberSince={memberSince}
        initialSubjectKey={`piece:${productSlug}`}
      />
    </div>
  )
}
