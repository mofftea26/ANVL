import { useState } from 'react'
import { Share2 } from '@/shared/icons'
import type { ArmoryRank } from '@/features/passport/lib/ranks'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import {
  useArmoryShareQuery,
  useSetArmoryShareMutation,
} from '@/features/passport/hooks/useArmory'
import { BRAND } from '@/shared/constants/brand'
import { ArmoryShareModal, type SharePiece } from './ArmoryShareModal'

/**
 * The armory's share entry point — one icon button at the top of the panel.
 * First tap enables public sharing (mints the handle) and opens the share
 * sheet in one move; after that it opens directly. "Stop sharing" lives inside
 * the sheet, so there's no switch cluttering the panel.
 */
export function ArmoryShareButton({
  ownerName,
  rank,
  pieces,
  feats,
  memberSince,
}: {
  ownerName: string
  rank: ArmoryRank
  pieces: SharePiece[]
  feats: ArmoryFeat[]
  memberSince: string | null
}) {
  const shareQuery = useArmoryShareQuery()
  const setShare = useSetArmoryShareMutation()
  const [open, setOpen] = useState(false)

  const share = shareQuery.data
  const url =
    share?.isPublic && share.handle ? `${BRAND.canonicalBaseUrl}/armory/${share.handle}` : null

  const openSheet = () => {
    if (url) {
      setOpen(true)
      return
    }
    // Not shared yet — enable (mints the handle) and open in one move.
    setShare.mutate(true, { onSuccess: (result) => result && setOpen(true) })
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        disabled={setShare.isPending || shareQuery.isLoading}
        aria-label="Share your armory"
        title="Share your armory"
        className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[color-mix(in_oklab,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_10%,var(--color-surface))] text-[var(--color-heading)] motion-safe:transition-colors hover:border-[var(--color-highlight-bright)] hover:bg-[color-mix(in_oklab,var(--color-highlight)_18%,var(--color-surface))] disabled:opacity-50"
      >
        <Share2 size={19} aria-hidden="true" className="block" />
      </button>
      {url ? (
        <ArmoryShareModal
          open={open}
          onClose={() => setOpen(false)}
          url={url}
          ownerName={ownerName}
          rank={rank}
          pieces={pieces}
          feats={feats}
          memberSince={memberSince}
        />
      ) : null}
    </>
  )
}
