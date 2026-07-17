import { useState } from 'react'
import { Share2 } from 'lucide-react'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import {
  useArmoryShareQuery,
  useSetArmoryShareMutation,
} from '@/features/passport/hooks/useArmory'
import { BRAND } from '@/shared/constants/brand'
import { cn } from '@/shared/lib/cn'
import { ArmoryShareModal } from './ArmoryShareModal'

/**
 * The share control for the owner's Armory — the "write" side's gateway to the
 * public "read" side. Flip the switch to mint (once) a non-guessable handle and
 * expose a read-only /armory/$handle page; flip it off to hide it again. The
 * handle survives toggling, so a shared link revives rather than rotting.
 * Once public, "Share" opens the full share sheet (copy, socials, story image).
 */
export function ArmoryShareCard({
  ownerName,
  rank,
  pieceCount,
}: {
  ownerName: string
  rank: ArmoryRank
  pieceCount: number
}) {
  const shareQuery = useArmoryShareQuery()
  const setShare = useSetArmoryShareMutation()
  const [modalOpen, setModalOpen] = useState(false)

  const share = shareQuery.data
  const isPublic = share?.isPublic ?? false
  const url =
    isPublic && share?.handle ? `${BRAND.canonicalBaseUrl}/armory/${share.handle}` : null

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
        <>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-on-highlight)]"
          >
            <Share2 size={14} aria-hidden="true" /> Share
          </button>
          <ArmoryShareModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            url={url}
            ownerName={ownerName}
            rankTitle={rank.title}
            rankEmblemSrc={rank.emblemSrc}
            pieceCount={pieceCount}
          />
        </>
      ) : null}
    </section>
  )
}
