import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Medal, QrCode } from 'lucide-react'
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
import { ArmoryFeats } from './armory/ArmoryFeats'
import { ArmoryHonor } from './armory/ArmoryHonor'
import { ArmoryShareCard } from './armory/ArmoryShareCard'
import {
  ARMORY_VIEWS,
  ArmoryCollectionView,
  ArmoryGridView,
  ArmoryLoadoutView,
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

  const completion = computeDropCompletion(owned, catalog)
  const rank = deriveArmoryRank(owned.length, completion)
  const badges = deriveArmoryBadges(owned.length, completion)
  const forge = computeForgeLevel({ owned, featCount, completion })
  const milestone = nextForgeMilestone({ claimCount: owned.length, completion, forge })
  const challenges = evaluateChallenges(
    buildChallengeContext({ owned, featCount, completion }),
  )
  const honorPinned = owned.filter((p) => p.featuredSlot !== null).length
  // Distinct pieces the owner can attach a feat to.
  const featPieces = Array.from(
    new Map(owned.map((p) => [p.productSlug, p.productName])).entries(),
  ).map(([slug, name]) => ({ slug, name }))
  const profileQuery = useCustomerProfileQuery()
  const ownerName =
    [profileQuery.data?.firstName, profileQuery.data?.lastName].filter(Boolean).join(' ') ||
    'ANVL Athlete'

  return (
    <div className="space-y-4">
      {/* Forge progress — the live XP loop ----------------------------- */}
      <ForgeProgress forge={forge} milestone={milestone} />

      {/* Standing ------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Rank" icon={<Medal size={15} />}>
          <button
            type="button"
            onClick={() => setRankOpen(true)}
            aria-label="View ranks and badges"
            className="focus-ring group -m-1 mt-0 block w-full rounded-lg p-1 text-left"
          >
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
          </button>
        </AccountBentoCard>

        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Crest" icon={<Medal size={15} />}>
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
          icon={<Award size={15} />}
          className="col-span-2 sm:col-span-1"
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
          icon={<QrCode size={15} />}
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

          <div
            role="tablist"
            aria-label="Armory views"
            className="flex gap-1 overflow-x-auto rounded-full border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {ARMORY_VIEWS.map((v) => {
              const active = v.key === view
              return (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  title={v.blurb}
                  onClick={() => setView(v.key)}
                  className={cn(
                    'focus-ring shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] motion-safe:transition-colors',
                    active
                      ? 'bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  )}
                >
                  {v.label}
                </button>
              )
            })}
          </div>

          <div className="pt-1">
            {view === 'grid' ? <ArmoryGridView owned={owned} catalog={catalog} /> : null}
            {view === 'vault' ? <ArmoryVaultView owned={owned} catalog={catalog} /> : null}
            {view === 'collection' ? (
              <ArmoryCollectionView owned={owned} catalog={catalog} />
            ) : null}
            {view === 'timeline' ? <ArmoryTimelineView owned={owned} catalog={catalog} /> : null}
            {view === 'loadout' ? <ArmoryLoadoutView owned={owned} catalog={catalog} /> : null}
          </div>

          <ArmoryChallenges challenges={challenges} />
          <ArmoryFeats pieces={featPieces} />
          <ArmoryShareCard ownerName={ownerName} rank={rank} pieceCount={owned.length} />
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
