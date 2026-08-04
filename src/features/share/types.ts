import type { ShareLayout } from './image/layout'

/**
 * The share domain's vocabulary. Pure types — no React, no canvas, no DOM
 * work — so the routing, caption and preset logic can all be unit-tested from
 * plain objects.
 */

/* ------------------------------------------------------------- the subject */

export interface SharePiece {
  slug: string
  name: string
  imageUrl: string | null
  wearCount: number
}

export interface ShareFeat {
  id: string
  title: string
  /** ISO date (yyyy-mm-dd). */
  achievedOn: string
}

export interface ShareOwner {
  name: string
  rankTitle: string
  rankEmblemSrc: string
  /** Earliest registration (ISO), or null before the first claim. */
  memberSince: string | null
}

export interface ShareStats {
  pieceCount: number
  featCount: number
  totalWears: number
}

/**
 * Everything a share surface needs. The PIECE is context — set by wherever the
 * sheet was opened from — and the FEAT is the one thing the user picks.
 * `piece` is null only in the armory sheet before a piece has been chosen.
 */
export interface ShareContext {
  /** Always the public armory URL. The passport token never travels. */
  url: string
  owner: ShareOwner
  stats: ShareStats
  piece: SharePiece | null
  feat: ShareFeat | null
}

/* --------------------------------------------------------------- rendering */

export type ShareFormatKey = 'story' | 'post' | 'square'

export interface ShareFormat {
  key: ShareFormatKey
  label: string
  w: number
  h: number
}

export const SHARE_FORMATS: readonly ShareFormat[] = [
  { key: 'story', label: 'Story', w: 1080, h: 1920 },
  { key: 'post', label: 'Post', w: 1080, h: 1350 },
  { key: 'square', label: 'Message', w: 1080, h: 1080 },
]

/**
 * ONE family of seven looks.
 *
 * There used to be two: three "backdrop" presets for when the athlete had no
 * photo and seven "HUD" presets for when they did, with the sheet swapping
 * families under the user whenever a photo was added or removed — so five of the
 * ten looks were unreachable at any moment and picking one could silently
 * change it to another.
 *
 * A look now describes ARRANGEMENT only. What it composes over is THE STAGE,
 * which resolves itself: the athlete's photo when there is one, and the piece's
 * own product render over brand atmosphere when there is not. Adding a photo
 * swaps the hero and nothing else.
 */
export type SharePresetKey =
  | 'bottom-rail'
  | 'modern'
  | 'minimal'
  | 'premium'
  | 'luxe'
  | 'game'
  | 'jarvis'

/** Bottom Rail leads — it is the default in both stage states. */
export const SHARE_PRESET_LIST: ReadonlyArray<{ key: SharePresetKey; label: string }> = [
  { key: 'bottom-rail', label: 'Rail' },
  { key: 'modern', label: 'Modern' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'premium', label: 'Premium' },
  { key: 'luxe', label: 'Luxe' },
  { key: 'game', label: 'Game' },
  { key: 'jarvis', label: 'Jarvis' },
]

export const DEFAULT_SHARE_PRESET: SharePresetKey = 'bottom-rail'

/* ---------------------------------------------------------- canvas surface */

/**
 * The exact slice of `CanvasRenderingContext2D` the presets are allowed to
 * touch. Narrowing it is what lets the tests hand a preset a recording
 * surface: jsdom cannot rasterise, but it can prove that the piece thumbnail
 * and the feat text were actually drawn.
 */
export interface ShareCanvas {
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  globalAlpha: number
  save(): void
  restore(): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void
  rect(x: number, y: number, w: number, h: number): void
  fill(): void
  stroke(): void
  clip(): void
  fillRect(x: number, y: number, w: number, h: number): void
  strokeRect(x: number, y: number, w: number, h: number): void
  fillText(text: string, x: number, y: number): void
  measureText(text: string): { width: number }
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): CanvasGradient
  translate(x: number, y: number): void
  rotate(angle: number): void
}

export interface ShareColors {
  black: string
  steel: string
  champagne: string
  bone: string
}

/** What every preset receives. Images arrive pre-loaded — presets never await. */
export interface PresetDrawArgs {
  ctx: ShareCanvas
  /** Canvas width / height in device pixels. */
  W: number
  H: number
  /**
   * The composition frame: type scale, side margins and the safe vertical band.
   * Presets position everything against this — never against a raw `H`
   * fraction, and never with a height-derived unit.
   */
  layout: ShareLayout
  colors: ShareColors
  content: ShareContext
  /**
   * The athlete's own photo, already decoded and downscaled. Null is a normal
   * state, not a degraded one: the stage then promotes the piece render.
   */
  photo: CanvasImageSource | null
  /** The piece's product image, already decoded. */
  pieceImage: CanvasImageSource | null
  /** The rank emblem, already decoded — the stage's last fallback. */
  rankEmblem: CanvasImageSource | null
}

export interface SharePreset {
  key: SharePresetKey
  draw(args: PresetDrawArgs): void
}

/* -------------------------------------------------------------- send-to */

/**
 * One tile each. Instagram appears four times on purpose.
 *
 * No web page can aim an image at a specific Instagram surface: Stories
 * sharing is a native-app-only mechanism (`instagram-stories://` plus
 * UIPasteboard keys, and a Facebook App ID has been mandatory since January
 * 2023), and there is no documented reel composer scheme at all. What the four
 * tiles genuinely differ by is the CANVAS the image is rendered at, the
 * caption that is copied, the documented scheme that is opened, and the
 * guidance left behind — never the app destination.
 */
export type ShareTargetKey =
  | 'instagram-story'
  | 'instagram-post'
  | 'instagram-reel'
  | 'instagram-dm'
  | 'whatsapp'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'telegram'
  | 'discord'
  | 'system'

/** Which brand glyph a tile wears. The four Instagram tiles share one. */
export type SharePlatformKey =
  | 'instagram'
  | 'whatsapp'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'telegram'
  | 'discord'
  | 'system'

/**
 * The highest fidelity a DIRECT link to this destination can carry from a
 * browser. The OS share sheet is a separate matter: it always carries the
 * image, it just cannot be aimed at a chosen app (W3C makes target selection
 * the user agent's job, deliberately).
 */
export type ShareCarry = 'image' | 'link' | 'nothing'

/**
 * Which app-launch technique this browser understands. iOS needs a top-level
 * `location.href` to the scheme; Chrome on Android has refused custom-scheme
 * launches since Chrome 25 and only honours `intent://`. Everything else gets
 * a plain https URL.
 */
export type SharePlatform = 'ios' | 'android' | 'other'

/** What this browser can actually do — resolved after mount, never on SSR. */
export interface ShareCapabilities {
  /** `navigator.share` exists. */
  canShare: boolean
  /** `navigator.canShare({ files })` returns true — the only route that puts
   *  a real image into Instagram / WhatsApp / Facebook. */
  canShareFiles: boolean
  /** Coarse pointer or touch — layout and composer-vs-app decisions. */
  isMobile: boolean
  /** Which launch technique to use. Never infer this from `isMobile`. */
  platform: SharePlatform
}

/**
 * Where a tap navigates. `web` is always populated so an app that is not
 * installed lands on a page instead of the iOS "address is invalid" alert.
 */
export interface ShareLaunch {
  /** Documented iOS custom scheme. Absent when none is verified. */
  ios?: string
  /** Chrome-Android `intent://` URL with its fallback already baked in. */
  android?: string
  /** The https URL that works on every platform, and the armed fallback. */
  web: string
}

/**
 * What a tile does when tapped — a complete, self-contained instruction.
 *
 * Every field is deliberate: a route that opens an app without saving the
 * image would strand the user, so `downloadImage` and `copyCaption` travel
 * with the launch rather than being implied by it, and `platform` travels too
 * so the runner never has to consult capabilities a second time.
 */
export interface ShareRoute {
  kind: 'os-share-file' | 'open-url' | 'download-only'
  /** The tile this came from — the image tab keys its re-render off it. */
  target: ShareTargetKey
  /** Canvas to render at before handing off; null leaves the user's choice. */
  format: ShareFormatKey | null
  /** How to reach the app. Null when nothing is opened. */
  launch: ShareLaunch | null
  platform: SharePlatform
  downloadImage: boolean
  copyCaption: boolean
  /** The exact text to copy / hand to the sheet, shaped for this surface. */
  message: string
  /** Shown after the tap. Always literally true on this tier — never a
   *  promise the route cannot keep. */
  hint: string
}
