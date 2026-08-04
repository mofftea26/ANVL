import type { SharePreset, SharePresetKey } from '../../types'
import { resetShareCanvas } from '../drawKit'
import { bottomRailPreset } from './bottomRail'
import { gamePreset } from './game'
import { jarvisPreset } from './jarvis'
import { luxePreset } from './luxe'
import { minimalPreset } from './minimal'
import { modernPreset } from './modern'
import { premiumPreset } from './premium'

/**
 * Presets set only the canvas properties they need, so a `textAlign` or `font`
 * left behind by an earlier draw would silently change the next one — including
 * across the live preview, which re-renders on every control change. Resetting
 * in the registry means no preset can forget.
 */
function sealed(preset: SharePreset): SharePreset {
  return {
    key: preset.key,
    draw: (args) => {
      resetShareCanvas(args.ctx)
      preset.draw(args)
    },
  }
}

/**
 * The preset registry — one entry per look, and every look works with or
 * without a photo. Adding one means adding one file and one line here; nothing
 * in the renderer, the sheet, or the types has to change.
 */
export const SHARE_PRESETS: Record<SharePresetKey, SharePreset> = {
  'bottom-rail': sealed(bottomRailPreset),
  modern: sealed(modernPreset),
  minimal: sealed(minimalPreset),
  premium: sealed(premiumPreset),
  luxe: sealed(luxePreset),
  game: sealed(gamePreset),
  jarvis: sealed(jarvisPreset),
}

/**
 * No fallback on purpose. The registry is `Record<SharePresetKey, SharePreset>`
 * and `key` is that same union, so a missing look is a COMPILE error — a
 * `?? SHARE_PRESETS['bottom-rail']` here would be unreachable, and its only
 * effect would be to reintroduce the one behaviour this family was built to
 * remove: silently rendering a look other than the one the user picked.
 */
export function getSharePreset(key: SharePresetKey): SharePreset {
  return SHARE_PRESETS[key]
}
