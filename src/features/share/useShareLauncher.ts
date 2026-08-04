import { useCallback, useState } from 'react'
import { useArmoryShareQuery, useSetArmoryShareMutation } from '@/features/passport/hooks/useArmory'

/**
 * Opens the share sheet from anywhere, and takes care of the one piece of
 * server state sharing needs: the public armory handle.
 *
 * The first share both enables public sharing and mints the handle. That used
 * to gate the modal's very existence behind a mutation callback, which raced;
 * here the sheet opens immediately and shows its own "preparing" state until
 * the URL lands.
 */
export interface ShareLauncher {
  isOpen: boolean
  /** True while the handle is being minted. */
  isPreparing: boolean
  open: (init?: { featId?: string | null; pieceSlug?: string | null }) => void
  close: () => void
  /** Selection the sheet should start from. */
  initialFeatId: string | null
  initialPieceSlug: string | null
}

export function useShareLauncher(defaults?: { pieceSlug?: string | null }): ShareLauncher {
  const shareQuery = useArmoryShareQuery()
  const setShare = useSetArmoryShareMutation()
  const [isOpen, setIsOpen] = useState(false)
  const [initialFeatId, setInitialFeatId] = useState<string | null>(null)
  const [initialPieceSlug, setInitialPieceSlug] = useState<string | null>(
    defaults?.pieceSlug ?? null,
  )

  const open = useCallback<ShareLauncher['open']>(
    (init) => {
      setInitialFeatId(init?.featId ?? null)
      setInitialPieceSlug(init?.pieceSlug ?? defaults?.pieceSlug ?? null)
      setIsOpen(true)

      const share = shareQuery.data
      const alreadyShared = Boolean(share?.isPublic && share.handle)
      if (!alreadyShared && !setShare.isPending) setShare.mutate(true)
    },
    [defaults?.pieceSlug, setShare, shareQuery.data],
  )

  const close = useCallback(() => setIsOpen(false), [])

  return {
    isOpen,
    isPreparing: setShare.isPending,
    open,
    close,
    initialFeatId,
    initialPieceSlug,
  }
}
