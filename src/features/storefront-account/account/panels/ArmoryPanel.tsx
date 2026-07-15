import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Award, Medal, QrCode, Shield, Swords } from 'lucide-react'
import { useOwnedPassportsQuery } from '@/features/passport/hooks/usePassport'
import {
  computeDropCompletion,
  deriveArmoryBadges,
  deriveArmoryRank,
} from '@/features/passport/lib/ranks'
import { AuthenticityPlate } from '@/features/passport/components/AuthenticityPlate'
import { AccountBentoCard } from '@/features/storefront-account/account/AccountBentoCard'
import {
  accountCardBg,
  type AccountCardBgKey,
} from '@/features/storefront-account/account/accountCardBg'

const BG_CYCLE: AccountCardBgKey[] = ['carbon', 'steel', 'stone', 'smoke', 'gold', 'ember']

/** Catalog slugs/drops for completion math — light, cached, storefront-safe. */
function useArmoryCatalogQuery() {
  return useQuery({
    queryKey: ['storefrontAccount', 'armory-catalog'],
    queryFn: async () => {
      const { runtimeClients } = await import('@/app/config/runtime')
      const catalog = await runtimeClients.commerce.getShopListingCatalog()
      return catalog.items.map((p) => ({ slug: p.slug, dropName: p.dropName }))
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * The Armory — every physical piece the athlete has claimed via its product
 * passport, plus derived rank, badges, and drop completion.
 */
export function ArmoryPanel() {
  const passportsQuery = useOwnedPassportsQuery()
  const catalogQuery = useArmoryCatalogQuery()
  const owned = passportsQuery.data ?? []
  const catalog = catalogQuery.data ?? []

  const completion = computeDropCompletion(owned, catalog)
  const rank = deriveArmoryRank(owned.length, completion)
  const badges = deriveArmoryBadges(owned.length, completion)
  const startedDrops = completion.filter((d) => d.claimed > 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <AccountBentoCard bg={accountCardBg('ember')} eyebrow="Rank" icon={<Medal size={15} />}>
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
          <p className="anvl-micro mt-2 text-[var(--color-text-muted)]">{rank.description}</p>
        </AccountBentoCard>
        <AccountBentoCard bg={accountCardBg('gold')} eyebrow="Forged" icon={<Swords size={15} />}>
          <p className="anvl-heading mt-1 text-3xl text-[var(--color-heading)]">{owned.length}</p>
          <p className="anvl-micro text-[var(--color-text-muted)]">
            {owned.length === 1 ? 'piece claimed' : 'pieces claimed'}
          </p>
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
              None yet — claim a piece to earn your first.
            </p>
          )}
        </AccountBentoCard>
      </div>

      {startedDrops.length > 0 ? (
        <AccountBentoCard bg={accountCardBg('smoke')} eyebrow="Drop completion" icon={<Shield size={15} />}>
          <ul className="mt-2 space-y-3">
            {startedDrops.map((d) => (
              <li key={d.dropName}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text)]">{d.dropName}</span>
                  <span className="anvl-micro text-[var(--color-text-muted)]">
                    {d.claimed} of {d.total} forged
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={d.claimed}
                  aria-valuemin={0}
                  aria-valuemax={d.total}
                  aria-label={`${d.dropName} completion`}
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-elevated)]"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-highlight)] to-[var(--color-highlight-bright)] transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.round((d.claimed / Math.max(1, d.total)) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </AccountBentoCard>
      ) : null}

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
            Every ANVL piece ships with a passport card. Scan its QR code to forge the
            piece to your name — it appears here, permanently yours.
          </p>
        </AccountBentoCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {owned.map((p, i) => (
            <AccountBentoCard
              key={p.id}
              bg={accountCardBg(BG_CYCLE[i % BG_CYCLE.length]!)}
              eyebrow={p.productName}
              icon={<QrCode size={15} />}
            >
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <AuthenticityPlate editionTotal={p.editionTotal} size="sm" />
                {p.claimedColor ? (
                  <span className="anvl-micro text-[var(--color-text-muted)]">{p.claimedColor}</span>
                ) : null}
                {p.claimedSize ? (
                  <span className="anvl-micro text-[var(--color-text-muted)]">· {p.claimedSize}</span>
                ) : null}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-2">
                <span className="anvl-micro text-[var(--color-text-muted)]">
                  Forged{' '}
                  {p.claimedAt ? new Date(p.claimedAt).toLocaleDateString() : ''}
                </span>
                <Link
                  to="/p/$token"
                  params={{ token: p.token }}
                  className="focus-ring anvl-micro text-[var(--color-highlight-bright)] underline-offset-4 hover:underline"
                >
                  Open passport
                </Link>
              </div>
            </AccountBentoCard>
          ))}
        </div>
      )}
    </div>
  )
}
