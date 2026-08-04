import { loadImageOrNull } from '../image/drawKit'
import { buildShareLayout } from '../image/layout'
import { getSharePreset } from '../image/presets'
import { readShareColors } from '../image/shareImage'
import type { ShareCanvas, ShareContext, SharePresetKey } from '../types'

/**
 * The filmstrip's rendering engine.
 *
 * It draws the REAL presets rather than hand-drawn wireframes, so the picker
 * cannot lie about the output the way a hardcoded swatch colour did. Three
 * decisions make seven live renders affordable:
 *
 *  - **Assets load once.** `loadShareAssets` is called for the whole strip and
 *    the decoded images are handed to every draw. Going through
 *    `generateShareImage` instead would re-decode the piece art and the rank
 *    emblem seven times per change.
 *  - **Small canvas.** 264×468 is 3× the 88×156 display box — crisp on a 3x
 *    phone, and ~1/17th of the pixels of a full 1080×1920 export.
 *  - **JPEG, not PNG.** ~8 KB per thumbnail instead of ~80 KB, and these
 *    strings live in React state. PNG stays for the real export, which needs
 *    the alpha and the fidelity.
 */

/** 3× the 88×156 display box. */
export const THUMB_W = 264
export const THUMB_H = 468

export interface ShareRenderAssets {
  pieceImage: CanvasImageSource | null
  rankEmblem: CanvasImageSource | null
}

const NO_ASSETS: ShareRenderAssets = { pieceImage: null, rankEmblem: null }

/** Decode the two remote images a preset may want, once, for the whole strip. */
export async function loadShareAssets(content: ShareContext): Promise<ShareRenderAssets> {
  try {
    const [pieceImage, rankEmblem] = await Promise.all([
      loadImageOrNull(content.piece?.imageUrl),
      loadImageOrNull(content.owner.rankEmblemSrc),
    ])
    return { pieceImage, rankEmblem }
  } catch {
    // A missing decoration must never cost the whole strip.
    return NO_ASSETS
  }
}

/**
 * One thumbnail, drawn synchronously against pre-loaded assets.
 *
 * Always 9:16 regardless of the chosen export format: a thumbnail communicates
 * WHERE the rail / frame / plate sits, and the stage above already shows the
 * true crop. Keeping it fixed also means changing format never re-renders the
 * strip and never changes its height.
 *
 * The requested preset is drawn AS REQUESTED. This used to route through a
 * photo-aware substitution, so a card could show a layout other than the one it
 * was labelled with; one family of seven removes the question entirely.
 *
 * Returns null — never throws — when the surface is unavailable (jsdom) or the
 * canvas is tainted by a CORS-less piece image. A missing thumbnail degrades to
 * the card's skeleton, which is a far better outcome than a broken sheet.
 */
export function drawPresetThumbnail(input: {
  preset: SharePresetKey
  content: ShareContext
  photo: CanvasImageSource | null
  assets: ShareRenderAssets
}): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = THUMB_W
    canvas.height = THUMB_H
    const context = canvas.getContext('2d')
    if (!context) return null

    getSharePreset(input.preset).draw({
      // Mirrors `generateShareImage`: `ShareCanvas` is the narrow slice presets
      // may touch, and the real 2D context is a superset of it.
      ctx: context as ShareCanvas,
      W: THUMB_W,
      H: THUMB_H,
      layout: buildShareLayout('story', THUMB_W, THUMB_H),
      colors: readShareColors(),
      content: input.content,
      photo: input.photo,
      pieceImage: input.assets.pieceImage,
      rankEmblem: input.assets.rankEmblem,
    })

    return canvas.toDataURL('image/jpeg', 0.72)
  } catch {
    return null
  }
}
