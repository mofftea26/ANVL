import { ShareButton } from '@/features/share/ShareButton'

/**
 * Share THIS piece, from its own passport. One icon opens the share sheet with
 * the piece already fixed as the subject — there is nothing to pick but which
 * feat rides along.
 *
 * Every link the sheet produces points at the owner's PUBLIC ARMORY, never at
 * the passport URL: the token is the claim secret and must not travel.
 */
export function PassportShareSection({
  productSlug,
  imageUrl,
}: {
  productSlug: string
  imageUrl: string | null
}) {
  return (
    <div className="flex items-center gap-4">
      <ShareButton
        pieceSlug={productSlug}
        pieceImageUrl={imageUrl}
        label="Share this piece"
      />
      <p className="anvl-micro text-[10px] leading-relaxed text-[var(--color-text-muted)]">
        Post the piece, your link, or its QR — your passport link stays private.
      </p>
    </div>
  )
}
