import {
  SHARE_FORMATS,
  type ShareCanvas,
  type ShareColors,
  type ShareContext,
  type ShareFormatKey,
  type SharePresetKey,
} from '../types'
import { cssColor, loadImageOrNull } from './drawKit'
import { buildShareLayout } from './layout'
import { getSharePreset } from './presets'

/**
 * Renders a share image. The only async work happens up front (fonts and
 * artwork); presets themselves are synchronous and pure, which is what makes
 * them testable against a recording canvas.
 */

export interface ShareRenderInput {
  format: ShareFormatKey
  preset: SharePresetKey
  content: ShareContext
  /**
   * The athlete's own photo, already decoded and downscaled by useImagePick.
   *
   * Null is an ordinary state. Every preset works either way — the stage
   * promotes the piece's own render — so the chosen preset is rendered as
   * chosen and never substituted for another because a photo came or went.
   */
  photo: CanvasImageSource | null
}

export interface ShareRenderResult {
  dataUrl: string
  blob: Blob | null
  width: number
  height: number
}

export function readShareColors(): ShareColors {
  return {
    black: cssColor('--anvl-black', '#0B0B0C'),
    steel: cssColor('--anvl-dark-steel-grey', '#1D1F21'),
    champagne: cssColor('--color-highlight-bright', '#C5A56A'),
    bone: cssColor('--anvl-bone', '#E7E4DF'),
  }
}

async function waitForFonts(): Promise<void> {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* Fonts API unavailable — system fallbacks are acceptable. */
  }
}

export async function generateShareImage(input: ShareRenderInput): Promise<ShareRenderResult> {
  const format = SHARE_FORMATS.find((f) => f.key === input.format) ?? SHARE_FORMATS[0]!
  const W = format.w
  const H = format.h

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const context = canvas.getContext('2d')
  if (!context) return { dataUrl: '', blob: null, width: W, height: H }

  await waitForFonts()
  const [pieceImage, rankEmblem] = await Promise.all([
    loadImageOrNull(input.content.piece?.imageUrl),
    loadImageOrNull(input.content.owner.rankEmblemSrc),
  ])

  getSharePreset(input.preset).draw({
    ctx: context as ShareCanvas,
    W,
    H,
    layout: buildShareLayout(format.key, W, H),
    colors: readShareColors(),
    content: input.content,
    photo: input.photo,
    pieceImage,
    rankEmblem,
  })

  // A remote image without CORS headers taints the canvas and makes both
  // exports throw. Surfacing that as a null result lets the sheet say so
  // instead of leaving a dead Download button.
  let dataUrl = ''
  try {
    dataUrl = canvas.toDataURL('image/png')
  } catch {
    return { dataUrl: '', blob: null, width: W, height: H }
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/png')
    } catch {
      resolve(null)
    }
  })

  return { dataUrl, blob, width: W, height: H }
}
