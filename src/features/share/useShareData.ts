import { useArmoryCatalogQuery } from '@/features/passport/hooks/useArmoryCatalog'
import { useArmoryFeatsQuery, useArmoryShareQuery } from '@/features/passport/hooks/useArmory'
import { useGamificationRules } from '@/features/passport/hooks/useGamificationRules'
import { useOwnedPassportsQuery } from '@/features/passport/hooks/usePassport'
import { estimateForgeXpFromCounts } from '@/features/passport/lib/forgeXp'
import { computeDropCompletion, deriveArmoryRank } from '@/features/passport/lib/ranks'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { BRAND } from '@/shared/constants/brand'
import type { ShareContext, ShareFeat, ShareOwner, SharePiece, ShareStats } from './types'

/**
 * Everything a share surface needs, gathered once from the queries that
 * already exist. Assembling the final {@link ShareContext} is a separate pure
 * function so the piece/feat selection inside the sheet stays testable.
 */

export interface ShareData {
  /** Null until the owner's armory handle has been minted. */
  url: string | null
  owner: ShareOwner
  stats: ShareStats
  pieces: SharePiece[]
  feats: ArmoryFeat[]
  isLoading: boolean
}

export function useShareData(): ShareData {
  const ownedQuery = useOwnedPassportsQuery()
  const catalogQuery = useArmoryCatalogQuery()
  const featsQuery = useArmoryFeatsQuery()
  const shareQuery = useArmoryShareQuery()
  const profileQuery = useCustomerProfileQuery()
  const rules = useGamificationRules()

  const owned = ownedQuery.data ?? []
  const catalog = catalogQuery.data ?? []
  const feats = featsQuery.data ?? []

  const catalogBySlug = new Map(catalog.map((entry) => [entry.slug, entry]))
  // One entry per distinct piece — a second unit of the same product is the
  // same piece as far as a share is concerned.
  const pieces: SharePiece[] = Array.from(
    new Map(owned.map((passport) => [passport.productSlug, passport])).values(),
  ).map((passport) => ({
    slug: passport.productSlug,
    name: passport.productName,
    imageUrl: catalogBySlug.get(passport.productSlug)?.image ?? null,
    wearCount: passport.wearCount,
  }))

  const completion = computeDropCompletion(owned, catalog)
  // Feats are not loaded on the share surface, so XP is estimated from the
  // counts this hook does hold. It can only under-state, never over-state,
  // which keeps a shared card from ever claiming a rank the owner lacks.
  const rank = deriveArmoryRank(
    owned.length,
    completion,
    rules,
    estimateForgeXpFromCounts(
      {
        registrations: owned.length,
        wears: owned.reduce((sum, p) => sum + p.wearCount, 0),
        fullDrops: completion.filter((d) => d.total > 0 && d.claimed >= d.total).length,
      },
      rules.settings,
    ),
  )

  const share = shareQuery.data
  const url =
    share?.isPublic && share.handle ? `${BRAND.canonicalBaseUrl}/armory/${share.handle}` : null

  const name =
    [profileQuery.data?.firstName, profileQuery.data?.lastName].filter(Boolean).join(' ') ||
    'ANVL Athlete'

  const memberSince =
    owned
      .map((passport) => passport.claimedAt)
      .filter((claimedAt): claimedAt is string => Boolean(claimedAt))
      .sort()[0] ?? null

  return {
    url,
    owner: {
      name,
      rankTitle: rank.title,
      rankEmblemSrc: rank.emblemSrc,
      memberSince,
    },
    stats: {
      pieceCount: owned.length,
      featCount: feats.length,
      totalWears: owned.reduce((sum, passport) => sum + passport.wearCount, 0),
    },
    pieces,
    feats,
    isLoading:
      ownedQuery.isLoading || catalogQuery.isLoading || featsQuery.isLoading || shareQuery.isLoading,
  }
}

/** The feats a given piece can carry. No piece means the whole log. */
export function featsForPiece(feats: readonly ArmoryFeat[], pieceSlug: string | null): ShareFeat[] {
  return feats
    .filter((feat) => (pieceSlug ? feat.productSlug === pieceSlug : true))
    .map((feat) => ({ id: feat.id, title: feat.title, achievedOn: feat.achievedOn }))
}

/**
 * Fold the raw data plus the sheet's current selection into one context.
 * `pieceImageUrl` lets a passport override the catalog thumbnail with its own
 * hero render, which is better art.
 */
export function buildShareContext(input: {
  data: ShareData
  pieceSlug: string | null
  featId: string | null
  pieceImageUrl?: string | null
}): ShareContext | null {
  const { data, pieceSlug, featId, pieceImageUrl } = input
  if (!data.url) return null

  const found = pieceSlug ? (data.pieces.find((piece) => piece.slug === pieceSlug) ?? null) : null
  const piece = found
    ? { ...found, imageUrl: pieceImageUrl ?? found.imageUrl }
    : null

  const feat = featId
    ? (featsForPiece(data.feats, null).find((candidate) => candidate.id === featId) ?? null)
    : null

  return { url: data.url, owner: data.owner, stats: data.stats, piece, feat }
}
