import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deriveArmoryRank,
  buildRankLadder,
  rankEmblemSrc,
} from '@/features/passport/lib/ranks'
import {
  DEFAULT_GAMIFICATION_RULES,
  type GamificationRules,
} from '@/features/passport/schemas/gamification.schema'
import { createRank, deleteRank } from '../gamification.service'

/**
 * Fake Supabase client covering exactly the chains the rank service uses:
 *  - from('gamification_ranks').select('key, sort_order')
 *  - from('gamification_ranks').select('key', { count, head })
 *  - from(...).insert(rows)
 *  - from(...).delete().eq(...)
 */
interface FakeState {
  ranks: Array<{ key: string; sort_order: number }>
  inserts: Array<{ table: string; rows: unknown }>
  deletes: Array<{ table: string; key: string }>
  insertError: { message: string } | null
}

const state: FakeState = { ranks: [], inserts: [], deletes: [], insertError: null }

vi.mock('@/features/admin/auth/adminSupabaseBrowserClient', () => ({
  getAdminSupabaseBrowserClient: () => ({
    from: (table: string) => ({
      select: (_columns: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          return Promise.resolve({ count: state.ranks.length, error: null })
        }
        return Promise.resolve({ data: state.ranks, error: null })
      },
      insert: (rows: unknown) => {
        if (state.insertError && table === 'gamification_rank_levels') {
          return Promise.resolve({ error: state.insertError })
        }
        state.inserts.push({ table, rows })
        return Promise.resolve({ error: null })
      },
      delete: () => ({
        eq: (_column: string, key: string) => {
          state.deletes.push({ table, key })
          state.ranks = state.ranks.filter((r) => r.key !== key)
          return Promise.resolve({ error: null })
        },
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}))

describe('createRank / deleteRank', () => {
  beforeEach(() => {
    state.ranks = [
      { key: 'initiate', sort_order: 0 },
      { key: 'forged', sort_order: 1 },
      { key: 'oathbound', sort_order: 2 },
      { key: 'warlord', sort_order: 3 },
    ]
    state.inserts = []
    state.deletes = []
    state.insertError = null
  })

  it('creates a rank with a slug key, appended sort order, and three level rows', async () => {
    const res = await createRank({ name: 'Iron Titan' })
    expect(res).toEqual({ ok: true, data: 'iron-titan' })

    const rankInsert = state.inserts.find((i) => i.table === 'gamification_ranks')
    expect(rankInsert?.rows).toMatchObject({
      key: 'iron-titan',
      name: 'Iron Titan',
      sort_order: 4,
    })

    const levelInsert = state.inserts.find((i) => i.table === 'gamification_rank_levels')
    const levels = levelInsert?.rows as Array<Record<string, unknown>>
    expect(levels).toHaveLength(3)
    expect(levels.map((l) => l.level)).toEqual([1, 2, 3])
    // Thresholds start EMPTY (admin sets real ones in the editor).
    expect(levels.every((l) => l.min_registrations === null && l.min_full_drops === null)).toBe(
      true,
    )
  })

  it('de-duplicates a colliding slug key', async () => {
    state.ranks.push({ key: 'titan', sort_order: 4 })
    const res = await createRank({ name: 'Titan' })
    expect(res).toEqual({ ok: true, data: 'titan-2' })
  })

  it('rolls the rank row back when the level insert fails', async () => {
    state.insertError = { message: 'levels kaput' }
    const res = await createRank({ name: 'Doomed' })
    expect(res.ok).toBe(false)
    expect(state.deletes).toContainEqual({ table: 'gamification_ranks', key: 'doomed' })
  })

  it('deletes a rank but refuses to delete the last one', async () => {
    const res = await deleteRank('warlord')
    expect(res.ok).toBe(true)
    expect(state.deletes).toContainEqual({ table: 'gamification_ranks', key: 'warlord' })

    state.ranks = [{ key: 'initiate', sort_order: 0 }]
    const last = await deleteRank('initiate')
    expect(last.ok).toBe(false)
    if (!last.ok) expect(last.error).toMatch(/last/i)
  })
})

describe('rank derivation with a 5-rank ladder (count-agnostic)', () => {
  const fiveRankRules: GamificationRules = {
    ...DEFAULT_GAMIFICATION_RULES,
    ranks: [
      ...DEFAULT_GAMIFICATION_RULES.ranks,
      {
        key: 'titan',
        // Above every seeded rank (Anvilborn is 7) so it stays the top rung.
        sortOrder: 8,
        name: 'Titan',
        description: 'Beyond the warlords.',
        emblemUrl: null,
        rewardTitle: '',
        rewardDescription: '',
        rewardStatus: 'none',
        // Count-gated only (minXp null) — this suite pins that a rank with no
        // XP threshold still derives purely from counts.
        levels: [
          { rankKey: 'titan', level: 1, unlockCopy: 'Register 20 pieces', minXp: null, minRegistrations: 20, minFullDrops: null },
          { rankKey: 'titan', level: 2, unlockCopy: 'Register 30 pieces', minXp: null, minRegistrations: 30, minFullDrops: null },
          { rankKey: 'titan', level: 3, unlockCopy: 'Register 50 pieces', minXp: null, minRegistrations: 50, minFullDrops: null },
        ],
      },
    ],
  }

  // Titan is count-gated only (every level has `minXp: null`), which is the
  // point: an admin-authored rank must still resolve on the XP ladder without
  // being given XP thresholds of its own.
  it('derives the custom top rank when its thresholds hold', () => {
    const rank = deriveArmoryRank(35, [], fiveRankRules, 0)
    expect(rank.key).toBe('titan')
    expect(rank.level).toBe(2)
    expect(rank.title).toBe('Titan II')
  })

  it('still derives seed ranks below the custom thresholds', () => {
    // 750 XP is Forged I in the seed ladder; 20 claims would be needed for
    // Titan, so the seeded rank wins below that.
    expect(deriveArmoryRank(3, [], fiveRankRules, 750).key).toBe('forged')
    expect(deriveArmoryRank(0, [], fiveRankRules, 0).key).toBe('unsworn')
  })

  it('non-seed ranks fall back to the neutral brand mark without an emblem', () => {
    expect(rankEmblemSrc('titan', null)).toBe('/brand/mark.svg')
    expect(rankEmblemSrc('titan', 'https://cdn/x.png')).toBe('https://cdn/x.png')
    expect(rankEmblemSrc('initiate', null)).toBe('/brand/ranks/initiate.png')
  })

  it('appends the admin-created rank to the end of the seeded ladder', () => {
    const ladder = buildRankLadder(fiveRankRules)
    // Length is asserted RELATIVE to the seed rather than as a literal: the
    // seeded ladder grew from 4 ranks to 8 in gamification v2, and a hardcoded
    // count here would have to be edited every time a rank is added without
    // testing anything about the behaviour under test.
    expect(ladder).toHaveLength(DEFAULT_GAMIFICATION_RULES.ranks.length + 1)
    const last = ladder[ladder.length - 1]
    expect(last?.key).toBe('titan')
    expect(last?.emblemSrc).toBe('/brand/mark.svg')
  })
})
