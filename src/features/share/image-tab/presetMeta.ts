import {
  SHARE_FORMATS,
  SHARE_PRESET_LIST,
  type ShareFormatKey,
  type SharePresetKey,
} from '../types'

/**
 * The words the picker puts on screen.
 *
 * These deliberately do NOT live on the shared preset table in `types.ts`:
 * a hint is a property of the PICKER, not of the renderer. Its job is to
 * describe a thumbnail to someone who cannot see it, in the language of layout
 * ("one bar across the base") rather than of drawing code — so it never has to
 * be kept in lockstep with what `draw()` does pixel by pixel.
 *
 * Each one describes the ARRANGEMENT only, never the photo, because the same
 * seven are offered whether or not there is one.
 */
const PRESET_HINT: Record<SharePresetKey, string> = {
  'bottom-rail': 'one bar across the base',
  modern: 'editorial blocks and a stat ledger',
  minimal: 'almost nothing — the image talks',
  premium: 'heraldic frame and a piece plate',
  luxe: 'double gold frame and a centred stack',
  game: 'HUD brackets and XP bars',
  jarvis: 'reticle arcs and a data readout',
}

export interface SharePresetOption {
  key: SharePresetKey
  label: string
  hint: string
}

/** THE looks. All seven, always — there is no photo-gated second family. */
export const SHARE_PRESET_OPTIONS: ReadonlyArray<SharePresetOption> = SHARE_PRESET_LIST.map(
  (entry) => ({ key: entry.key, label: entry.label, hint: PRESET_HINT[entry.key] }),
)

export function sharePresetLabel(key: SharePresetKey): string {
  return SHARE_PRESET_OPTIONS.find((option) => option.key === key)?.label ?? key
}

export interface ShareFormatMeta {
  key: ShareFormatKey
  label: string
  /**
   * Width of the proportion box drawn beside the label. The SHAPE is the real
   * label here — "Message" tells you nothing, a 1:1 box tells you everything.
   * Fixed classes because Tailwind cannot see a computed string.
   */
  glyphClass: string
  /** "1080 × 1920", for the stage badge. */
  dimensions: string
  /** What the canvas is for, so the three names are not a guessing game. */
  purpose: string
}

const FORMAT_EXTRA: Record<ShareFormatKey, { glyphClass: string; purpose: string }> = {
  story: { glyphClass: 'w-[10px]', purpose: 'Stories & Reels' },
  post: { glyphClass: 'w-[14px]', purpose: 'Feed post' },
  square: { glyphClass: 'w-[18px]', purpose: 'Chats & DMs' },
}

export const SHARE_FORMAT_META: ReadonlyArray<ShareFormatMeta> = SHARE_FORMATS.map((format) => ({
  key: format.key,
  label: format.label,
  dimensions: `${format.w} × ${format.h}`,
  ...FORMAT_EXTRA[format.key],
}))

export function shareFormatMeta(key: ShareFormatKey): ShareFormatMeta {
  return SHARE_FORMAT_META.find((meta) => meta.key === key) ?? SHARE_FORMAT_META[0]!
}
