import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, LayoutDashboard, Medal, QrCode, Shield } from '@/shared/icons'
import { useArmoryFeatsQuery } from '@/features/passport/hooks/useArmory'
import { useOwnedPassportsQuery } from '@/features/passport/hooks/usePassport'
import type { ArmoryCatalogEntry } from '@/features/passport/lib/armory'
import {
  buildChallengeContext,
  evaluateChallenges,
} from '@/features/passport/lib/challenges'
import { computeForgeLevel, nextForgeMilestone } from '@/features/passport/lib/forgeXp'
import {
  computeDropCompletion,
  deriveArmoryBadges,
  deriveArmoryRank,
} from '@/features/passport/lib/ranks'
import { useCustomerProfileQuery } from '@/features/storefront-account/publicAccount.core'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import { accountCardBg } from '@/features/storefront-account/account/accountCardBg'
import { cn } from '@/shared/lib/cn'
import { ArmoryChallenges } from './armory/ArmoryChallenges'
import { ArmoryHonor } from './armory/ArmoryHonor'
import { ArmoryOverlay } from './armory/ArmoryOverlay'
import { ArmoryShareButton } from './armory/ArmoryShareButton'
import {
  ARMORY_VIEWS,
  ArmoryCollectionView,
  ArmoryGridView,
  ArmoryTimelineView,
  ArmoryVaultView,
  type ArmoryViewKey,
} from './armory/ArmoryViews'
import { CollectionCrest } from './armory/CollectionCrest'
import { ForgeProgress } from './armory/ForgeProgress'
import { RankLadderModal } from './armory/RankLadderModal'

/** Catalog for the Armory's views — light, cached, storefront-safe. */
function useArmoryCatalogQuery() {
  return useQuery({
    queryKey: ['storefrontAccount', 'armory-catalog'],
    queryFn: async (): Promise<ArmoryCatalogEntry[]> => {
      const { runtimeClients } = await import('@/app/config/runtime')
      const catalog = await runtimeClients.commerce.getShopListingCatalog()
      return catalog.items.map((p) => ({
        slug: p.slug,
        name: p.name,
        dropName: p.dropName,
        image: p.images[0]?.src,
        category: p.shop?.category,
      }))
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * The Armory — every physical piece the athlete has registered via its product
 * passport: rank, badges, and the collection itself through five views (grid,
 * vault, collection, timeline, loadout — all shaped by `passport/lib/armory`).
 */
export function ArmoryPanel() {
  const passportsQuery = useOwnedPassportsQuery()
  const catalogQuery = useArmoryCatalogQuery()
  const featsQuery = useArmoryFeatsQuery()
  const owned = passportsQuery.data ?? []
  const catalog = catalogQuery.data ?? []
  const featCount = featsQuery.data?.length ?? 0
  const [view, setView] = useState<ArmoryViewKey>('grid')
  const [rankOpen, setRankOpen] = useState(false)
  const [overlay, setOverlay] = useState<'collection' | 'timeline' | 'challenges' | null>(null)

  const completion = computeDropCompletion(owned, catalog)
  const rank = deriveArmoryRank(owned.length, completion)
  const badges = deriveArmoryBadges(owned.length, completion)
  const forge = computeForgeLevel({ owned, featCount, completion })
  const milestone = nextForgeMilestone({ claimCount: owned.length, completion, forge })
  const challenges = evaluateChallenges(
    buildChallengeContext({ owned, featCount, completion }),
  )
  const honorPinned = owned.filter((p) => p.featuredSlot !== null).length
  // Distinct pieces for the share studio (image from the catalog).
  const catalogBySlug = new Map(catalog.map((c) => [c.slug, c]))
  const sharePieces = Array.from(
    new Map(owned.map((p) => [p.productSlug, p])).values(),
  ).map((p) => ({
    slug: p.productSlug,
    name: p.productName,
    image: catalogBySlug.get(p.productSlug)?.image,
    wearCount: p.wearCount,
  }))
  const profileQuery = useCustomerProfileQuery()
  const ownerName =
    [profileQuery.data?.firstName, profileQuery.data?.lastName].filter(Boolean).join(' ') ||
    'ANVL Athlete'

  return (
    <div className="space-y-4">
      {/* Header row — view toggle + share live up here, out of the layout. */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="anvl-heading text-xl text-[var(--color-heading)]">The Armory</h2>
        <div className="flex items-center gap-2">
          {owned.length > 0 ? (
            <div
              role="tablist"
              aria-label="Armory view"
              className="flex rounded-full bg-[var(--color-surface-elevated)] p-1"
            >
              {ARMORY_VIEWS.map((v) => {
                const ViewIcon = v.key === 'grid' ? LayoutDashboard : Shield
                const active = v.key === view
                return (
                  <button
                    key={v.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`${v.label} view — ${v.blurb}`}
                    title={v.label}
                    onClick={() => setView(v.key)}
                    className={cn(
                      'focus-ring grid h-9 w-9 place-items-center rounded-full motion-safe:transition-colors',
                      active
                        ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                    )}
                  >
                    <ViewIcon size={17} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          ) : null}
          <ArmoryShareButton
          ownerName={ownerName}
          rank={rank}
          pieces={sharePieces}
          feats={featsQuery.data ?? []}
          memberSince={
            owned.length > 0
              ? (owned
                  .map((p) => p.claimedAt)
                  .filter((d): d is string => Boolean(d))
                  .sort()[0] ?? null)
              : null
          }
          />
        </div>
      </div>

      {/* Forge progress — the live XP loop ----------------------------- */}
      <ForgeProgress forge={forge} milestone={milestone} />

      {/* Standing (stacks full-width on phones so nothing clips) -------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Rank" icon={<Medal size={17} />}>
          <div className="mt-1 flex items-center gap-3">
            <img
              src={rank.emblemSrc}
              alt={`${rank.title} rank emblem`}
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]"
            />
            <div className="min-w-0">
              <p className="anvl-heading truncate text-2xl text-[var(--color-heading)]">
                {rank.title}
              </p>
              <span
                className="mt-1 inline-flex items-center gap-1"
                aria-label={`Level ${rank.level} of 3`}
              >
                {[1, 2, 3].map((pip) => (
                  <span
                    key={pip}
                    aria-hidden="true"
                    className={
                      pip <= rank.level
                        ? 'h-1.5 w-4 rounded-full bg-[var(--color-highlight-bright)]'
                        : 'h-1.5 w-4 rounded-full bg-[var(--color-surface-elevated)]'
                    }
                  />
                ))}
              </span>
            </div>
          </div>
          <p className="anvl-micro mt-2 text-[var(--color-highlight-bright)] opacity-0 motion-safe:transition-opacity group-hover:opacity-100">
            View ranks &amp; badges →
          </p>
          {/* Stretched hit-area: the WHOLE card opens the rank ladder. */}
          <button
            type="button"
            onClick={() => setRankOpen(true)}
            aria-label="View ranks and badges"
            className="focus-ring absolute inset-0 z-20 rounded-2xl"
          />
        </AccountBentoCard>

        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Crest" icon={<Medal size={17} />}>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-16 w-16 shrink-0">
              <CollectionCrest
                registrations={owned.length}
                fullDrops={completion.filter((d) => d.total > 0 && d.claimed >= d.total).length}
                honorPinned={honorPinned}
                level={forge.level}
              />
            </div>
            <div className="min-w-0">
              <p className="anvl-heading text-3xl leading-none text-[var(--color-heading)]">
                {owned.length}
              </p>
              <p className="anvl-micro text-[var(--color-text-muted)]">
                {owned.length === 1 ? 'piece forged' : 'pieces forged'}
              </p>
            </div>
          </div>
        </AccountBentoCard>

        <AccountBentoCard
          bg={accountCardBg('steel')}
          eyebrow="Badges"
          icon={<Award size={17} />}
        >
          {badges.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <li
                  key={b.key}
                  title={b.description}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-elevated)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text)]"
                >
                  {b.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
              None yet — register a piece to earn your first.
            </p>
          )}
        </AccountBentoCard>
      </div>

      {/* The collection -------------------------------------------------- */}
      {passportsQuery.isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Opening the armory…</p>
      ) : owned.length === 0 ? (
        <AccountBentoCard
          bg={accountCardBg('carbon')}
          eyebrow="Empty armory"
          icon={<QrCode size={17} />}
          className="items-start"
        >
          <p className="mt-1 max-w-md text-sm text-[var(--color-text-muted)]">
            Every ANVL piece ships with a passport card. Scan its QR code to register the
            piece to your name — it appears here, permanently yours.
          </p>
        </AccountBentoCard>
      ) : (
        <>
          <ArmoryHonor owned={owned} catalog={catalog} />

          {/* Collection · Timeline · Challenges — bento cards → overlays. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <AccountBentoCard bg={accountCardBg('carbon')} eyebrow="Collection">
              <p className="anvl-heading mt-1 text-2xl text-[var(--color-heading)]">
                {completion.reduce((sum, d) => sum + d.claimed, 0)}
                <span className="text-[var(--color-text-muted)]">
                  {' '}
                  / {completion.reduce((sum, d) => sum + d.total, 0)}
                </span>
              </p>
              <p className="anvl-micro text-[var(--color-text-muted)]">
                pieces across {completion.length}{' '}
                {completion.length === 1 ? 'drop' : 'drops'}
              </p>
              <button
                type="button"
                onClick={() => setOverlay('collection')}
                aria-label="Open the collection"
                className="focus-ring absolute inset-0 z-20 rounded-2xl"
              />
            </AccountBentoCard>

            <AccountBentoCard bg={accountCardBg('steel')} eyebrow="Timeline">
              <p className="anvl-heading mt-1 truncate text-2xl text-[var(--color-heading)]">
                {owned.length}
              </p>
              <p className="anvl-micro truncate text-[var(--color-text-muted)]">
                {owned[0]?.claimedAt
                  ? `latest · ${new Date(owned[0].claimedAt).toLocaleDateString()}`
                  : 'registrations'}
              </p>
              <button
                type="button"
                onClick={() => setOverlay('timeline')}
                aria-label="Open the timeline"
                className="focus-ring absolute inset-0 z-20 rounded-2xl"
              />
            </AccountBentoCard>

            {/* Challenges — the most-progressed open goal fronts the card. */}
            <AccountBentoCard
              bg={accountCardBg('ember')}
              eyebrow="Challenges"
              className="col-span-2 sm:col-span-1"
            >
              {(() => {
                const next = challenges.find((c) => !c.complete)
                const done = challenges.filter((c) => c.complete).length
                if (!next) {
                  return (
                    <p className="anvl-heading mt-1 text-lg text-[var(--color-heading)]">
                      All {challenges.length} forged
                    </p>
                  )
                }
                return (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-[var(--color-heading)]">
                      {next.title}
                    </p>
                    <div
                      aria-hidden="true"
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)]"
                        style={{ width: `${Math.round(next.progress * 100)}%` }}
                      />
                    </div>
                    <p className="anvl-micro mt-1.5 text-[9px] text-[var(--color-text-muted)]">
                      {next.current} / {next.target} · {done} of {challenges.length} forged
                    </p>
                  </>
                )
              })()}
              <button
                type="button"
                onClick={() => setOverlay('challenges')}
                aria-label="Open the challenges"
                className="focus-ring absolute inset-0 z-20 rounded-2xl"
              />
            </AccountBentoCard>
          </div>

          <div className="pt-1">
            {view === 'grid' ? <ArmoryGridView owned={owned} catalog={catalog} /> : null}
            {view === 'vault' ? <ArmoryVaultView owned={owned} catalog={catalog} /> : null}
          </div>

          <ArmoryOverlay
            open={overlay === 'challenges'}
            onClose={() => setOverlay(null)}
            title="Challenges"
          >
            <ArmoryChallenges challenges={challenges} />
          </ArmoryOverlay>
          <ArmoryOverlay
            open={overlay === 'collection'}
            onClose={() => setOverlay(null)}
            title="The Collection"
          >
            <ArmoryCollectionView owned={owned} catalog={catalog} />
          </ArmoryOverlay>
          <ArmoryOverlay
            open={overlay === 'timeline'}
            onClose={() => setOverlay(null)}
            title="Timeline"
          >
            <ArmoryTimelineView owned={owned} catalog={catalog} />
          </ArmoryOverlay>
        </>
      )}

      <RankLadderModal
        open={rankOpen}
        onClose={() => setRankOpen(false)}
        rank={rank}
        earnedBadges={badges}
      />
    </div>
  )
}
