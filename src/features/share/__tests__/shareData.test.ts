import { describe, expect, it } from 'vitest'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'
import { buildShareCaption, buildShareFilename, displayLink } from '../captions'
import { buildShareContext, featsForPiece, type ShareData } from '../useShareData'
import { scaleToFit, MAX_PHOTO_EDGE } from '../useImagePick'

const FEATS: ArmoryFeat[] = [
  { id: 'a', title: 'Deadlift PR — 240 kg', achievedOn: '2026-07-02', isPublic: true, productSlug: 'oath-stringer' },
  { id: 'b', title: 'First 5k', achievedOn: '2026-06-01', isPublic: false, productSlug: 'forge-tee' },
  { id: 'c', title: 'Unattached feat', achievedOn: '2026-05-01', isPublic: false, productSlug: null },
]

const DATA: ShareData = {
  url: 'https://www.anvlathletics.com/armory/george',
  owner: {
    name: 'George Maalouf',
    rankTitle: 'Ironbound II',
    rankEmblemSrc: '/e.svg',
    memberSince: '2025-03-04',
  },
  stats: { pieceCount: 7, featCount: 3, totalWears: 48 },
  pieces: [
    { slug: 'oath-stringer', name: 'Oath Stringer', imageUrl: '/catalog.jpg', wearCount: 9 },
    { slug: 'forge-tee', name: 'Forge Tee', imageUrl: null, wearCount: 2 },
  ],
  feats: FEATS,
  isLoading: false,
}

describe('featsForPiece', () => {
  it('offers only the feats logged in that piece', () => {
    expect(featsForPiece(FEATS, 'oath-stringer').map((f) => f.id)).toEqual(['a'])
  })

  it('offers the whole log when no piece is chosen', () => {
    expect(featsForPiece(FEATS, null)).toHaveLength(3)
  })
})

describe('buildShareContext', () => {
  it('is null until the armory handle exists', () => {
    expect(buildShareContext({ data: { ...DATA, url: null }, pieceSlug: null, featId: null })).toBeNull()
  })

  it('resolves the piece from context and the feat from the selection', () => {
    const context = buildShareContext({ data: DATA, pieceSlug: 'oath-stringer', featId: 'a' })
    expect(context?.piece?.name).toBe('Oath Stringer')
    expect(context?.feat?.title).toBe('Deadlift PR — 240 kg')
  })

  it('lets a passport override the catalog thumbnail with its hero render', () => {
    const context = buildShareContext({
      data: DATA,
      pieceSlug: 'oath-stringer',
      featId: null,
      pieceImageUrl: '/hero-render.png',
    })
    expect(context?.piece?.imageUrl).toBe('/hero-render.png')
  })

  it('keeps the catalog image when no override is given', () => {
    const context = buildShareContext({ data: DATA, pieceSlug: 'oath-stringer', featId: null })
    expect(context?.piece?.imageUrl).toBe('/catalog.jpg')
  })

  it('leaves the piece null for an armory-wide share', () => {
    const context = buildShareContext({ data: DATA, pieceSlug: null, featId: null })
    expect(context?.piece).toBeNull()
  })

  it('ignores a slug that is not in the armory', () => {
    expect(
      buildShareContext({ data: DATA, pieceSlug: 'not-owned', featId: null })?.piece,
    ).toBeNull()
  })
})

describe('captions', () => {
  it('leads with the feat when there is one', () => {
    const context = buildShareContext({ data: DATA, pieceSlug: 'oath-stringer', featId: 'a' })!
    expect(buildShareCaption(context)).toContain('Deadlift PR — 240 kg')
    expect(buildShareCaption(context)).toContain('Oath Stringer')
  })

  it('falls back to the piece, then to the armory', () => {
    const piece = buildShareContext({ data: DATA, pieceSlug: 'oath-stringer', featId: null })!
    expect(buildShareCaption(piece)).toContain('Oath Stringer')

    const armory = buildShareContext({ data: DATA, pieceSlug: null, featId: null })!
    expect(buildShareCaption(armory)).toContain('Ironbound II')
  })

  it('builds a safe kebab filename from whatever is in the context', () => {
    const context = buildShareContext({ data: DATA, pieceSlug: 'oath-stringer', featId: 'a' })!
    const filename = buildShareFilename(context)
    expect(filename).toMatch(/^[a-z0-9-]+\.png$/)
    expect(filename).toContain('oath-stringer')
  })

  it('never produces an empty filename', () => {
    const bare = buildShareContext({ data: DATA, pieceSlug: null, featId: null })!
    expect(buildShareFilename(bare)).toMatch(/^[a-z0-9-]+\.png$/)
  })

  it('prints the host only, never the handle path', () => {
    expect(displayLink('https://www.anvlathletics.com/armory/george')).toBe('anvlathletics.com')
    expect(displayLink('https://anvlathletics.com/a/b/c')).toBe('anvlathletics.com')
  })

  it('degrades rather than throwing on a malformed link', () => {
    expect(() => displayLink('not a url')).not.toThrow()
    expect(displayLink('anvlathletics.com/armory/x')).toBe('anvlathletics.com')
  })
})

describe('scaleToFit', () => {
  it('leaves a small photo untouched', () => {
    expect(scaleToFit(1200, 800)).toEqual({ width: 1200, height: 800 })
  })

  it('caps the long edge and keeps the aspect ratio', () => {
    const { width, height } = scaleToFit(6000, 4000)
    expect(width).toBe(MAX_PHOTO_EDGE)
    expect(height).toBe(Math.round((4000 / 6000) * MAX_PHOTO_EDGE))
  })

  it('caps a portrait photo on its height', () => {
    const { width, height } = scaleToFit(3000, 5000)
    expect(height).toBe(MAX_PHOTO_EDGE)
    expect(width).toBeLessThan(MAX_PHOTO_EDGE)
  })

  it('survives a zero-sized source', () => {
    expect(scaleToFit(0, 0)).toEqual({ width: 0, height: 0 })
  })
})
