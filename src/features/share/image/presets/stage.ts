import type { PresetDrawArgs } from '../../types'
import {
  alpha,
  containBox,
  drawCover,
  hairlineWidth,
  roundRectPath,
  strokeRoundRect,
} from '../drawKit'
import type { ShareLayout } from '../layout'

/**
 * THE STAGE — the image every preset composes on top of.
 *
 * A preset describes an ARRANGEMENT. What that arrangement sits on is decided
 * here, once, for all seven of them:
 *
 *   - with a photo, the athlete is the hero, full bleed, with legibility held
 *     flat across the two text bands and released across the middle;
 *   - without one, the PIECE'S OWN RENDER is the hero, composed over the brand
 *     atmosphere the deleted backdrop presets used to own;
 *   - with neither, the rank emblem;
 *   - with none of the three, the atmosphere alone. Never a black rectangle.
 *
 * Both states are first-class. Adding a photo swaps the hero — it does not
 * unlock a different set of looks, and it never changes which look is selected.
 */

/* ------------------------------------------------------------- photo stage */

/**
 * Scrim strengths, measured rather than guessed: champagne on a bright photo
 * needs ~0.74 at the top and ~0.85 at the bottom to clear WCAG AA-large (3:1).
 * The old gradients reached full strength at the CANVAS EDGE — i.e. below and
 * above everything they were meant to protect — so the text sat in the weakest
 * part of the ramp.
 *
 * These exist to fight a photograph. The brand stage does NOT reuse them: over
 * a controlled gradient they protect nothing and only muddy the atmosphere.
 */
const SCRIM_TOP = 0.74
const SCRIM_BOTTOM = 0.86

/* ------------------------------------------------------------- brand stage */

/** Where the wash has finished turning over to black. Every preset's bottom
 *  band starts below this in every format, so text there needs no scrim. */
const WASH_TURN = 0.55
const GLOW_RADIUS = 660
const GLOW_ALPHA = 0.17
/** Pulls the warm haze back to black under the composition, so the bottom band
 *  starts from a settled base and the product is seated rather than floating. */
const SEAT_ALPHA = 0.5

/**
 * Caps for the product hero, in design units. A product render is a shot on its
 * own background, not a photograph: cover-cropping it to the canvas would slice
 * a garment in half, and letting `contain` fill the whole free band would blow a
 * 900px catalogue tile up to 1.6x and put every compression artefact on show.
 */
const HERO_MAX_W = 620
const HERO_MAX_H = 700
/** The plate that holds it — quiet, so a cut-out render reads as a specimen and
 *  a render with its own white card reads as a framed tile instead of a leak. */
const HERO_PLATE_PAD = 30
const HERO_PLATE_RADIUS = 18
const HERO_PLATE_FILL = 0.3
const HERO_PLATE_EDGE = 0.24
/** Clear air between the hero and the blocks above and below it, per side. */
const HERO_GUTTER = 20
/**
 * Both are ALSO capped as a fraction of the band. A dense preset on a 1:1
 * canvas can be left ~290px to work with; a gutter and a plate margin sized in
 * design units would take 100px of that — a third of the band — and shrink the
 * hero below the thumbnail it replaced. Capped this way, the story case keeps
 * its generous chrome and the tight case keeps its subject.
 */
const HERO_GUTTER_MAX_SHARE = 0.07
const HERO_PAD_MAX_SHARE = 0.07
/** The emblem is a MARK, not a product: no plate, and a tighter cap so an
 *  armory-wide share does not read as a 620px logo splash. */
const EMBLEM_MAX = 420
/** Below this the free band is a slot, not a stage — atmosphere only. */
const HERO_MIN_BAND = 190

/* -------------------------------------------------------- the stage's floor */

/**
 * THE SUBJECT GETS A FLOOR, NOT THE LEFTOVERS.
 *
 * Every preset sizes its furniture in DESIGN units, which are constant across
 * formats — while the canvas loses 30% of its height on a post and 44% on a
 * square. A stack that leaves a generous band on a story therefore squeezes the
 * hero below the thumbnail it replaced in a DM: `modern` used to render a
 * 228x270 plate adrift in a 1080x1080 frame, 5% of the canvas, against 54% of
 * the width on a story. Only `bottom-rail` and `minimal` were cheap enough to
 * survive, which is not a design decision — it is an accident of how much
 * vertical chrome each look happens to carry.
 *
 * So a preset that carries an OPTIONAL row — a four-row ledger, a five-row
 * readout, a second XP bar, an eyebrow — measures its full stack against this
 * floor first and falls back to a compact one when it would breach it. Nothing
 * is dropped: each compact variant says the same things in fewer rows.
 */
/** Ideal: enough band for the hero to reach 80% of its design maximum. */
const FLOOR_IDEAL = HERO_MAX_H * 0.8 + HERO_GUTTER * 2
/**
 * ...and, where even that is out of reach, this share of the canvas — which is
 * the band `bottom-rail` (the default, and therefore the quality bar) keeps on
 * a square with its full stack intact.
 */
const FLOOR_CANVAS_SHARE = 0.46

/** How much vertical room the stage insists on, in pixels. */
function stageFloor(L: ShareLayout): number {
  return Math.min(FLOOR_IDEAL * L.s, L.H * FLOOR_CANVAS_SHARE)
}

/** Does a stack this tall still clear the floor? */
function stageFits(L: ShareLayout, headH: number, furnitureH: number): boolean {
  return L.bottom - furnitureH * L.s - (L.top + headH * L.s) >= stageFloor(L)
}

/**
 * Should the preset use its COMPACT stack?
 *
 * `headH` is measured in DESIGN units down from `L.top` and `furnitureH` up
 * from `L.bottom` — the two numbers every preset already computes to place its
 * own blocks, so nothing has to be measured twice.
 *
 * True only when the stage actually owns a subject: over a photo the hero is
 * full-bleed and the furniture competes with nothing, so a photo share keeps
 * every preset's full composition in every format.
 */
export function stageIsTight(args: PresetDrawArgs, headH: number, furnitureH: number): boolean {
  return stageOwnsArt(args) && !stageFits(args.layout, headH, furnitureH)
}

/**
 * Where the preset has left room. Both are baselines the preset already knows,
 * so the stage never has to guess at a composition it cannot see.
 */
export interface StageOpts {
  /** First y of the preset's bottom text band. */
  bandTop?: number
  /** Last y of the preset's top block — the hero begins below it. */
  headBottom?: number
}

/** Where the hero landed, in canvas pixels — the plate for a product render,
 *  the artwork itself for the emblem. Null when the stage shows no subject. */
export interface HeroBox {
  x: number
  y: number
  w: number
  h: number
}

/** What the stage shows when there is no photo: the piece, else the emblem. */
export function stageArt(args: PresetDrawArgs): CanvasImageSource | null {
  return args.pieceImage ?? args.rankEmblem
}

/**
 * True when the STAGE — not the preset — is showing the artwork.
 *
 * Deliberately NOT called `heroIsPiece`: with no piece render the stage
 * promotes the rank emblem, and this is true then too. Presets branch their
 * compressed "solo" constants off it (a collapsed block, a shorter plate, a
 * medallion's band top) and every one of those branches is about the preset's
 * own thumbnail slot being empty, which is exactly what this says. A preset
 * that ever needs to tell a product from an emblem should read
 * `args.pieceImage` directly, as `drawHero` does.
 *
 * Presets consult it through `pieceArt` rather than directly: five of the seven
 * carry a small piece thumbnail (a rail thumb, an editorial block, a medallion,
 * an equipped slot, a scanned chip) and every one of them would otherwise print
 * the artwork twice on the same image the moment the photo went away.
 */
export function stageOwnsArt(args: PresetDrawArgs): boolean {
  return !args.photo && stageArt(args) !== null
}

/**
 * The preset's OWN small artwork — null once the stage owns it, which is what
 * collapses each preset's thumbnail slot instead of duplicating the hero.
 */
export function pieceArt(args: PresetDrawArgs): CanvasImageSource | null {
  return stageOwnsArt(args) ? null : stageArt(args)
}

/**
 * Draws the stage and hands back WHERE the hero landed, so a preset can compose
 * against the subject rather than against a guess. `jarvis` aims its reticle
 * with it; the box is null over a photo (the hero is the whole frame) and when
 * there is no artwork at all.
 */
export function drawStage(args: PresetDrawArgs, opts?: StageOpts): HeroBox | null {
  if (args.photo) {
    drawPhotoStage(args, opts?.bandTop)
    return null
  }
  return drawBrandStage(args, opts)
}

/**
 * Photo as the hero, with legibility held FLAT across the two text bands and
 * released across the middle. The middle is deliberately untouched — that is
 * the athlete, and it is the whole point.
 *
 * `bandTop` is the y above which the bottom scrim must already be at full
 * strength: presets know where their own bottom block starts, and a scrim that
 * fades through its own text is not a scrim.
 */
function drawPhotoStage(args: PresetDrawArgs, bandTopOpt?: number): void {
  const { ctx, W, H, photo, colors, layout: L } = args
  if (photo) drawCover(ctx, photo, W, H)

  const holdTop = L.top + 96 * L.s
  const fadeTop = holdTop + 240 * L.s
  ctx.fillStyle = alpha(colors.black, SCRIM_TOP)
  ctx.fillRect(0, 0, W, holdTop)
  const top = ctx.createLinearGradient(0, holdTop, 0, fadeTop)
  top.addColorStop(0, alpha(colors.black, SCRIM_TOP))
  top.addColorStop(1, alpha(colors.black, 0))
  ctx.fillStyle = top
  ctx.fillRect(0, holdTop, W, fadeTop - holdTop)

  const bandTop = bandTopOpt ?? L.bottom - 320 * L.s
  // Long enough to read as atmosphere, short enough that a compressed format
  // still keeps clear photo above it.
  const fade = Math.min(380 * L.s, Math.max(140 * L.s, (bandTop - L.top) * 0.7))
  const bottom = ctx.createLinearGradient(0, bandTop - fade, 0, bandTop)
  bottom.addColorStop(0, alpha(colors.black, 0))
  bottom.addColorStop(1, alpha(colors.black, SCRIM_BOTTOM))
  ctx.fillStyle = bottom
  ctx.fillRect(0, bandTop - fade, W, fade)
  ctx.fillStyle = alpha(colors.black, SCRIM_BOTTOM)
  ctx.fillRect(0, bandTop, W, H - bandTop)
}

/**
 * Brand atmosphere with the piece standing in it: the steel-to-black wash and
 * the champagne radial the deleted backdrops carried, now aimed at whatever the
 * preset left free rather than at a fixed fraction of the canvas.
 */
function drawBrandStage(args: PresetDrawArgs, opts?: StageOpts): HeroBox | null {
  const { ctx, W, H, colors, layout: L } = args
  const s = L.s
  const zoneTop = opts?.headBottom ?? L.top + 120 * s
  const zoneBottom = opts?.bandTop ?? L.bottom - 320 * s
  const cy = (zoneTop + zoneBottom) / 2

  const wash = ctx.createLinearGradient(0, 0, 0, H)
  wash.addColorStop(0, colors.steel)
  wash.addColorStop(WASH_TURN, colors.black)
  wash.addColorStop(1, colors.black)
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, cy, 40 * s, W / 2, cy, GLOW_RADIUS * s)
  glow.addColorStop(0, alpha(colors.champagne, GLOW_ALPHA))
  glow.addColorStop(1, alpha(colors.champagne, 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Seated FROM the hero's own lower edge, not from a guessed fraction of the
  // band: the plate has a defined corner and a hairline, and a gradient ramping
  // through those reads as a rendering fault rather than as light. What darkens
  // is the space beneath the piece, which is what makes it stand on something.
  const hero = drawHero(args, zoneTop, zoneBottom)
  const seatTop = hero ? hero.y + hero.h : cy + 40 * s
  const seatBottom = zoneBottom + 48 * s
  if (seatBottom <= seatTop) return hero
  const seat = ctx.createLinearGradient(0, seatTop, 0, seatBottom)
  seat.addColorStop(0, alpha(colors.black, 0))
  seat.addColorStop(1, alpha(colors.black, SEAT_ALPHA))
  ctx.fillStyle = seat
  ctx.fillRect(0, seatTop, W, seatBottom - seatTop)
  return hero
}

/**
 * The piece, contained and plated, centred in the band the preset left free.
 *
 * Sizing is capped in DESIGN units and then clamped to the band, which is what
 * makes the same piece read at the same physical size on a story as in a DM
 * while a short band simply shows it smaller instead of overrunning the text.
 *
 * Returns the box it landed in — the plate for a product, the artwork for the
 * emblem — so the seat can start at its lower edge and a preset can compose
 * against it. Null when there was nothing to show and the atmosphere stands
 * alone.
 */
function drawHero(args: PresetDrawArgs, zoneTop: number, zoneBottom: number): HeroBox | null {
  const { ctx, colors, layout: L } = args
  const s = L.s
  const art = stageArt(args)
  const band = zoneBottom - zoneTop
  if (!art || band < HERO_MIN_BAND * s) return null

  const isProduct = args.pieceImage !== null
  const gutter = Math.min(HERO_GUTTER * s, band * HERO_GUTTER_MAX_SHARE)
  const availW = Math.min((isProduct ? HERO_MAX_W : EMBLEM_MAX) * s, L.cw * 0.86)
  const availH = Math.min((isProduct ? HERO_MAX_H : EMBLEM_MAX) * s, band - gutter * 2)
  const pad = isProduct
    ? Math.min(HERO_PLATE_PAD * s, availH * HERO_PAD_MAX_SHARE, availW * HERO_PAD_MAX_SHARE)
    : 0
  const box = containBox(art, L.W / 2, (zoneTop + zoneBottom) / 2, availW - pad * 2, availH - pad * 2)
  if (!box) return null

  if (!isProduct) {
    ctx.drawImage(art, box.x, box.y, box.w, box.h)
    return box
  }

  const plate = { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 }
  roundRectPath(ctx, plate.x, plate.y, plate.w, plate.h, HERO_PLATE_RADIUS * s)
  ctx.fillStyle = alpha(colors.black, HERO_PLATE_FILL)
  ctx.fill()
  ctx.drawImage(art, box.x, box.y, box.w, box.h)
  ctx.strokeStyle = alpha(colors.champagne, HERO_PLATE_EDGE)
  ctx.lineWidth = hairlineWidth(s)
  strokeRoundRect(ctx, plate.x, plate.y, plate.w, plate.h, HERO_PLATE_RADIUS * s)
  return plate
}
