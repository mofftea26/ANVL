import { describe, expect, it } from 'vitest'
import { buildShareLayout, type ShareLayout } from '../image/layout'
import { SHARE_PRESETS } from '../image/presets'
import {
  DEFAULT_SHARE_PRESET,
  SHARE_FORMATS,
  SHARE_PRESET_LIST,
  type PresetDrawArgs,
  type ShareContext,
  type SharePresetKey,
} from '../types'
import {
  createRecordingCanvas,
  fakeImage,
  type CanvasRecording,
  type RecordedText,
} from './recordingCanvas'

const CONTEXT: ShareContext = {
  url: 'https://www.anvlathletics.com/armory/george',
  owner: {
    name: 'George Maalouf',
    rankTitle: 'Ironbound II',
    rankEmblemSrc: '/brand/ranks/ironbound.svg',
    memberSince: '2025-03-04T00:00:00.000Z',
  },
  stats: { pieceCount: 7, featCount: 12, totalWears: 48 },
  piece: { slug: 'oath-stringer', name: 'Oath Stringer', imageUrl: '/p.jpg', wearCount: 9 },
  feat: { id: 'feat-1', title: 'Deadlift PR — 240 kg', achievedOn: '2026-07-02' },
}

/** A rank a CMS editor could plausibly author, and a feat long enough to hit
 *  every fitting budget in the set. */
const STRESS: ShareContext = {
  ...CONTEXT,
  owner: { ...CONTEXT.owner, name: 'Maximiliana Constantinopoulos', rankTitle: 'The Unbroken Oath' },
  stats: { pieceCount: 128, featCount: 340, totalWears: 1288 },
  piece: { ...CONTEXT.piece!, name: 'Oath Stringer Heavyweight Limited' },
  feat: {
    id: 'feat-2',
    title: 'Deadlift personal record at the national championships in Beirut',
    achievedOn: '2026-07-02',
  },
}

const ALL_PRESETS: SharePresetKey[] = SHARE_PRESET_LIST.map((p) => p.key)

/**
 * The two halves of the set's job.
 *
 * `no-photo` is not a degraded fallback to be spot-checked — it is what every
 * share renders until the athlete picks an image, which is at least half of all
 * renders. Both states run the FULL geometry suite, in all three formats.
 */
type Stage = 'photo' | 'no-photo'
const STAGES: readonly Stage[] = ['photo', 'no-photo']

type Format = (typeof SHARE_FORMATS)[number]

const CASES: Array<[SharePresetKey, Format, Stage]> = ALL_PRESETS.flatMap((key) =>
  SHARE_FORMATS.flatMap((format) => STAGES.map((stage) => [key, format, stage] as [SharePresetKey, Format, Stage])),
)

interface DrawOpts {
  content?: ShareContext
  format?: Format
  stage?: Stage
  /** Drop the piece's own render — an armory share, or a piece with no art. */
  pieceImage?: boolean
  /** Drop the rank emblem too — the stage's last fallback is gone. */
  rankEmblem?: boolean
}

function drawWith(
  key: SharePresetKey,
  opts: DrawOpts = {},
): { recording: CanvasRecording; layout: ShareLayout } {
  const content = opts.content ?? CONTEXT
  const format = opts.format ?? SHARE_FORMATS[0]!
  const surface = createRecordingCanvas()
  const layout = buildShareLayout(format.key, format.w, format.h)
  const args: PresetDrawArgs = {
    ctx: surface.ctx,
    W: format.w,
    H: format.h,
    layout,
    colors: { black: '#0B0B0C', steel: '#1D1F21', champagne: '#C5A56A', bone: '#E7E4DF' },
    content,
    photo: (opts.stage ?? 'photo') === 'photo' ? fakeImage(1600, 2400) : null,
    pieceImage: (opts.pieceImage ?? true) && content.piece ? fakeImage(900, 1100) : null,
    rankEmblem: (opts.rankEmblem ?? true) ? fakeImage(512, 512) : null,
  }
  SHARE_PRESETS[key].draw(args)
  return { recording: surface.recording, layout }
}

function overlaps(a: RecordedText, b: RecordedText): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

function imageBox(image: { dx: number; dy: number; dw: number; dh: number }): Box {
  return { left: image.dx, right: image.dx + image.dw, top: image.dy, bottom: image.dy + image.dh }
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/** Does an axis-aligned segment pass through a text box? Presets only ever draw
 *  horizontal or vertical rules, so this is exact for the shapes that exist. */
function lineCrosses(
  line: { x0: number; y0: number; x1: number; y1: number },
  box: RecordedText,
): boolean {
  const minX = Math.min(line.x0, line.x1)
  const maxX = Math.max(line.x0, line.x1)
  const minY = Math.min(line.y0, line.y1)
  const maxY = Math.max(line.y0, line.y1)
  return minX < box.right && box.left < maxX && minY < box.bottom && box.top < maxY
}

const STAT_LABELS = new Set(['RANK', 'PIECES', 'FEATS', 'WEARS', 'SINCE'])

function featDraws(recording: CanvasRecording): RecordedText[] {
  return recording.draws.filter((d) => d.text.toUpperCase().includes('DEADLIFT'))
}

describe.each(STAGES)('every preset with %s — content', (stage) => {
  it.each(ALL_PRESETS)('%s draws the piece and its feat', (key) => {
    const { recording } = drawWith(key, { stage })
    expect(recording.allText).toContain('OATH STRINGER')
    expect(recording.allText.toUpperCase()).toContain('DEADLIFT PR')
  })

  it.each(ALL_PRESETS)('%s draws the piece artwork', (key) => {
    expect(drawWith(key, { stage }).recording.images.length).toBeGreaterThan(0)
  })

  it.each(ALL_PRESETS)('%s names the athlete and closes with the link', (key) => {
    const { recording } = drawWith(key, { stage })
    expect(recording.allText.toUpperCase()).toContain('GEORGE')
    expect(recording.allText).toContain('anvlathletics.com')
  })

  it.each(ALL_PRESETS)('%s survives an armory share with no piece and no feat', (key) => {
    const { recording } = drawWith(key, {
      stage,
      content: { ...CONTEXT, piece: null, feat: null },
    })
    expect(recording.allText).toContain('THE ARMORY')
    expect(recording.texts.every((text) => !text.includes('undefined'))).toBe(true)
  })

  it.each(ALL_PRESETS)('%s falls back to wears when no feat is chosen', (key) => {
    const { recording } = drawWith(key, { stage, content: { ...CONTEXT, feat: null } })
    expect(recording.allText).toMatch(/WORN 9 TIMES|48 WEARS|OATH STRINGER/)
  })
})

describe.each(CASES)('%s at %o with %s — geometry', (key, format, stage) => {
  it('keeps every line inside the content column', () => {
    const { recording, layout } = drawWith(key, { format, stage })
    const outside = recording.draws.filter(
      (d) => d.left < layout.left - 1 || d.right > layout.right + 1,
    )
    expect(outside.map((d) => d.text)).toEqual([])
  })

  it('keeps every line inside the safe vertical band', () => {
    const { recording, layout } = drawWith(key, { format, stage })
    const outside = recording.draws.filter((d) => d.top < layout.safeTop || d.y > layout.bottom + 1)
    expect(outside.map((d) => `${d.text}@${d.y}`)).toEqual([])
  })

  it('never overprints one line with another', () => {
    const { recording } = drawWith(key, { format, stage })
    const collisions: string[] = []
    for (let i = 0; i < recording.draws.length; i += 1) {
      for (let j = i + 1; j < recording.draws.length; j += 1) {
        const a = recording.draws[i]!
        const b = recording.draws[j]!
        if (overlaps(a, b)) collisions.push(`"${a.text}" x "${b.text}"`)
      }
    }
    expect(collisions).toEqual([])
  })

  it('never rules a line through a line of text', () => {
    const { recording } = drawWith(key, { format, stage })
    const hits: string[] = []
    for (const line of recording.lines) {
      for (const draw of recording.draws) {
        if (lineCrosses(line, draw)) hits.push(`${JSON.stringify(line)} through "${draw.text}"`)
      }
    }
    expect(hits).toEqual([])
  })

  it('sets the feat larger than any supporting label', () => {
    const { recording } = drawWith(key, { format, stage })
    const feat = featDraws(recording)
    expect(feat.length).toBeGreaterThan(0)
    const featSize = Math.max(...feat.map((d) => d.size))
    const labels = recording.draws.filter((d) => STAT_LABELS.has(d.text.trim()))
    for (const label of labels) expect(featSize).toBeGreaterThan(label.size)
  })

  it('makes the feat the largest thing on the image', () => {
    const { recording } = drawWith(key, { format, stage })
    const featSize = Math.max(...featDraws(recording).map((d) => d.size))
    expect(featSize).toBe(Math.max(...recording.draws.map((d) => d.size)))
  })

  it('survives a long feat, a long rank and four-digit stats', () => {
    const { recording, layout } = drawWith(key, { format, stage, content: STRESS })
    const outside = recording.draws.filter(
      (d) =>
        d.left < layout.left - 1 ||
        d.right > layout.right + 1 ||
        d.top < layout.safeTop ||
        d.y > layout.bottom + 1,
    )
    expect(outside.map((d) => d.text)).toEqual([])
    expect(recording.texts.every((text) => !text.includes('undefined'))).toBe(true)
  })

  it('stays clear of Instagram chrome', () => {
    const { recording, layout } = drawWith(key, { format, stage })
    for (const draw of recording.draws) {
      expect(draw.top).toBeGreaterThanOrEqual(layout.safeTop)
      expect(draw.y).toBeLessThanOrEqual(layout.bottom + 1)
    }
  })
})

/**
 * The state that used to be a whole second family of presets. These are the
 * guarantees that replaced it, and they are the ones with no analogue in the
 * photo case: the piece may not appear twice, and the hero it becomes has to
 * behave like a composed element rather than a full-bleed backdrop.
 */
describe.each(SHARE_FORMATS)('without a photo at %o', (format) => {
  it.each(ALL_PRESETS)('%s draws the piece exactly once', (key) => {
    const { recording } = drawWith(key, { format, stage: 'no-photo' })
    expect(recording.images).toHaveLength(1)
  })

  it.each(ALL_PRESETS)('%s keeps the hero clear of every line of text', (key) => {
    const { recording } = drawWith(key, { format, stage: 'no-photo' })
    const hero = imageBox(recording.images[0]!)
    const hit = recording.draws.filter((d) => boxesOverlap(hero, d))
    expect(hit.map((d) => d.text)).toEqual([])
  })

  it.each(ALL_PRESETS)('%s keeps the hero inside the safe band', (key) => {
    const { recording, layout } = drawWith(key, { format, stage: 'no-photo' })
    const hero = imageBox(recording.images[0]!)
    expect(hero.top).toBeGreaterThanOrEqual(layout.safeTop)
    expect(hero.bottom).toBeLessThanOrEqual(layout.bottom)
    expect(hero.left).toBeGreaterThanOrEqual(0)
    expect(hero.right).toBeLessThanOrEqual(layout.W)
  })

  /**
   * THE SUBJECT MAY NOT BE SPENT ON FURNITURE.
   *
   * Every preset's chrome is sized in DESIGN units, which are constant, while
   * the canvas loses 30% of its height on a post and 44% on a square — so the
   * squeeze used to land entirely on the hero. It was possible for `modern` to
   * pass every other assertion in this file (drawn once, contained, inside the
   * safe band, clear of text) while rendering a 228x270 plate adrift in a
   * 1080x1080 frame: 5% of the canvas, barely twice the 104x124 thumbnail it
   * had replaced. Nothing was red, because nothing here asked how BIG it was.
   *
   * The share is stated against the WIDTH and the AREA rather than the height
   * because the fixture is a portrait render: a 900x1100 piece contained in a
   * band is always height-bound, so its horizontal presence is the honest
   * measure of whether the composition left it any room.
   */
  it.each(ALL_PRESETS)('%s gives the hero a real share of the frame', (key) => {
    const { recording, layout } = drawWith(key, { format, stage: 'no-photo' })
    const hero = recording.images[0]!
    expect(hero.dw).toBeGreaterThanOrEqual(layout.W * 0.25)
    expect(hero.dw * hero.dh).toBeGreaterThanOrEqual(layout.W * layout.H * 0.08)
  })

  it.each(ALL_PRESETS)('%s contains the piece render rather than cropping it', (key) => {
    const { recording } = drawWith(key, { format, stage: 'no-photo' })
    const hero = recording.images[0]!
    // 900 x 1100 in, so an uncropped draw keeps that ratio. `drawCover` would
    // have thrown the aspect away to fill a box.
    expect(hero.dw / hero.dh).toBeCloseTo(900 / 1100, 3)
  })

  it.each(ALL_PRESETS)('%s falls back to the rank emblem for an armory share', (key) => {
    const { recording } = drawWith(key, {
      format,
      stage: 'no-photo',
      content: { ...CONTEXT, piece: null, feat: null },
    })
    expect(recording.images).toHaveLength(1)
    // A square emblem, contained — proof it is the emblem and not the piece.
    const hero = recording.images[0]!
    expect(hero.dw / hero.dh).toBeCloseTo(1, 3)
  })

  it.each(ALL_PRESETS)('%s still composes with no photo, no piece and no emblem', (key) => {
    const { recording, layout } = drawWith(key, {
      format,
      stage: 'no-photo',
      pieceImage: false,
      rankEmblem: false,
    })
    expect(recording.images).toHaveLength(0)
    // Brand atmosphere, not a blank frame: the wash and the glow are still laid
    // down over the full canvas, and every line of the preset still reads.
    expect(recording.rects.some((r) => r.w === layout.W && r.h === format.h)).toBe(true)
    expect(recording.allText).toContain('anvlathletics.com')
    expect(recording.allText.toUpperCase()).toContain('DEADLIFT PR')
  })
})

/**
 * The compact stacks, seen from the outside: no preset may hand more than half
 * of its subject to the shorter canvas. This is the assertion that forces a
 * preset carrying an optional row to actually collapse it rather than to keep
 * the row and shrink the piece.
 */
describe('the short formats keep the subject', () => {
  const heroHeightIn = (key: SharePresetKey, formatKey: 'story' | 'square'): number => {
    const format = SHARE_FORMATS.find((entry) => entry.key === formatKey)!
    return drawWith(key, { format, stage: 'no-photo' }).recording.images[0]!.dh
  }

  it.each(ALL_PRESETS)('%s keeps at least half its story hero in a DM', (key) => {
    expect(heroHeightIn(key, 'square')).toBeGreaterThanOrEqual(heroHeightIn(key, 'story') * 0.5)
  })
})

/**
 * JARVIS's reticle is the one thing in the set positioned RELATIVE to the hero,
 * and its doc comment has always claimed the arcs "recentre on the stage's hero
 * and ring it". They did not: the radii were hardcoded at 150/178/206 against a
 * 584x700 plate, so all three landed wholly inside the garment — three gold
 * arcs scribbled across a t-shirt. Only the square rank emblem rang correctly,
 * and that was a coincidence.
 */
describe('the jarvis reticle', () => {
  const rings = (format: Format, opts: DrawOpts = {}) => {
    const { recording, layout } = drawWith('jarvis', { format, stage: 'no-photo', ...opts })
    const hero = recording.images[0]!
    return {
      layout,
      arcs: recording.arcs,
      // Half the hero's diagonal: the smallest circle that fully encloses the
      // ARTWORK. The plate around a product render is larger still, and the
      // preset sizes its rings off that — so clearing this clears the plate too.
      enclosing: Math.hypot(hero.dw, hero.dh) / 2,
    }
  }

  it.each(SHARE_FORMATS)('rings the piece rather than crossing it at %o', (format) => {
    const { arcs, enclosing } = rings(format)
    expect(arcs.length).toBeGreaterThan(0)
    for (const arc of arcs) expect(arc.r).toBeGreaterThan(enclosing)
  })

  it.each(SHARE_FORMATS)('rings the rank emblem too at %o', (format) => {
    const { arcs, enclosing } = rings(format, {
      content: { ...CONTEXT, piece: null, feat: null },
    })
    for (const arc of arcs) expect(arc.r).toBeGreaterThan(enclosing)
  })

  it.each(SHARE_FORMATS)('never runs an arc off the canvas at %o', (format) => {
    const { arcs, layout } = rings(format)
    for (const arc of arcs) {
      expect(arc.x - arc.r).toBeGreaterThanOrEqual(0)
      expect(arc.x + arc.r).toBeLessThanOrEqual(layout.W)
      expect(arc.y - arc.r).toBeGreaterThanOrEqual(0)
      expect(arc.y + arc.r).toBeLessThanOrEqual(layout.H)
    }
  })
})

describe('format scaling', () => {
  it('keeps the design scale constant across formats', () => {
    for (const format of SHARE_FORMATS) {
      expect(buildShareLayout(format.key, format.w, format.h).s).toBe(1)
    }
  })

  it.each(STAGES)('renders the feat at the same size in a DM as on a story (%s)', (stage) => {
    const sizeIn = (formatKey: 'story' | 'square') => {
      const format = SHARE_FORMATS.find((f) => f.key === formatKey)!
      const { recording } = drawWith('bottom-rail', { format, stage })
      return Math.max(...featDraws(recording).map((d) => d.size))
    }
    expect(sizeIn('square')).toBe(sizeIn('story'))
  })
})

describe('the preset family', () => {
  it('is one family of seven, reachable in both stage states', () => {
    expect(ALL_PRESETS).toHaveLength(7)
    expect(Object.keys(SHARE_PRESETS).sort()).toEqual([...ALL_PRESETS].sort())
  })

  it('defaults to a preset that is actually in the list', () => {
    expect(ALL_PRESETS).toContain(DEFAULT_SHARE_PRESET)
  })
})
