import { buildAndroidIntent } from './openTarget'
import type {
  ShareCapabilities,
  ShareCarry,
  ShareFormatKey,
  ShareLaunch,
  SharePlatform,
  SharePlatformKey,
  ShareRoute,
  ShareTargetKey,
} from './types'

/**
 * Where a share can go, and what actually happens when you tap it.
 *
 * The hard constraint this file exists to absorb: **no website can hand an
 * image to an Instagram Story, a Facebook Story or a TikTok composer.** Those
 * are native-SDK mechanisms — `instagram-stories://` needs UIPasteboard keys
 * and a Facebook App ID, TikTok's Share Kit needs a registered client key and
 * a local file path. The one route that really delivers pixels from a browser
 * is `navigator.share({ files })`, and the Web Share API cannot be aimed at a
 * chosen app: the W3C makes target selection the user agent's job so that a
 * page cannot fingerprint which apps you have installed.
 *
 * So the tiles differ by the four things a browser genuinely controls — the
 * canvas the image is rendered at, the caption that travels, the documented
 * scheme that is opened, and the guidance left behind — and every `note` here
 * is written to stay literally true on the tier it is shown for.
 *
 * Only documented schemes ship. An unhandled scheme raises the iOS "address is
 * invalid" alert, which reads as a broken site — worse than doing nothing.
 */

export interface ShareTarget {
  key: ShareTargetKey
  /** Drives the glyph. Four keys map to `instagram`. */
  platform: SharePlatformKey
  /** The caption under the tile. Short — it sits in a 4-up grid. */
  label: string
  /** The full name, for screen readers and the tile tooltip. */
  title: string
  carries: ShareCarry
  /** Canvas this destination wants; null leaves the user's choice alone. */
  format: ShareFormatKey | null
  /** Documented iOS scheme only. Omitted when none is verified. */
  iosScheme?: string
  /** Chrome-Android `intent://`, given the web URL to fall back to. */
  androidIntent?: (fallback: string) => string
  /** Web intent that carries link + caption, when the platform has one. */
  webIntent?: (url: string, caption: string) => string
  /** Where a browser lands when there is no intent and no app. */
  webComposer?: string
  /** The clipboard / sheet text, shaped for this surface. */
  message: (caption: string, url: string) => string
  /** Said after the OS sheet carried the image. */
  sheetNote: string
  /** Said after only the file and the caption travelled. */
  savedNote: string
}

/* ------------------------------------------------------------- Instagram */

const INSTAGRAM_PACKAGE = 'com.instagram.android'
const INSTAGRAM_WEB = 'https://www.instagram.com/'

/**
 * Two Instagram screens are documented and reachable: the camera and the
 * direct inbox. `instagram://story-camera` and every `instagram://reels*`
 * variant appear only in deep-link-vendor marketing posts, so they are not
 * shipped — a miss would raise the iOS error alert. Story, Post and Reel
 * therefore share the camera; they differ by canvas, caption and guidance.
 */
const instagramLaunch = (host: 'camera' | 'direct-inbox') => ({
  iosScheme: `instagram://${host}`,
  androidIntent: (fallback: string) =>
    buildAndroidIntent({ scheme: 'instagram', host, packageName: INSTAGRAM_PACKAGE, fallback }),
  webComposer: INSTAGRAM_WEB,
})

/**
 * Caption emphasis per surface. A real difference, not decoration: an
 * Instagram feed caption never renders a clickable link, a story carries one
 * through a sticker, a reel reaches strangers who need a reason to type it,
 * and a DM does make URLs tappable.
 */
const INSTAGRAM_MESSAGE = {
  story: (caption: string, url: string) => `${caption}\n${url}`,
  post: (caption: string, url: string) => `${caption}\n\n${url}`,
  reel: (caption: string, url: string) => `${caption}\n\nFull story: ${url}`,
  dm: (caption: string, url: string) => `${caption} — ${url}`,
}

const withLink = (caption: string, url: string) => `${caption} ${url}`

export const SHARE_TARGETS: readonly ShareTarget[] = [
  {
    key: 'instagram-story',
    platform: 'instagram',
    label: 'Story',
    title: 'Instagram Story',
    // Stories are native-app only, so a deep link carries nothing at all.
    carries: 'nothing',
    format: 'story',
    ...instagramLaunch('camera'),
    message: INSTAGRAM_MESSAGE.story,
    sheetNote: 'Sent at 9:16 — in Instagram, add it to your story.',
    savedNote: 'open the story camera and pick it from your gallery',
  },
  {
    key: 'instagram-post',
    platform: 'instagram',
    label: 'Post',
    title: 'Instagram Post',
    carries: 'nothing',
    format: 'post',
    ...instagramLaunch('camera'),
    message: INSTAGRAM_MESSAGE.post,
    sheetNote: 'Sent at 4:5 — in Instagram, post it to your feed.',
    savedNote: 'open Instagram, tap +, and pick it',
  },
  {
    key: 'instagram-reel',
    platform: 'instagram',
    label: 'Reel',
    title: 'Instagram Reel',
    carries: 'nothing',
    format: 'story',
    ...instagramLaunch('camera'),
    message: INSTAGRAM_MESSAGE.reel,
    sheetNote: 'Sent at 9:16 — in Instagram, use it as your reel cover.',
    savedNote: 'open Instagram, start a reel, and pick it as the cover',
  },
  {
    key: 'instagram-dm',
    platform: 'instagram',
    label: 'Message',
    title: 'Instagram Message',
    carries: 'nothing',
    format: 'square',
    ...instagramLaunch('direct-inbox'),
    message: INSTAGRAM_MESSAGE.dm,
    sheetNote: 'Sent at 1:1 — pick a chat and send it.',
    savedNote: 'open your DMs and attach it',
  },
  {
    key: 'whatsapp',
    platform: 'whatsapp',
    label: 'WhatsApp',
    title: 'WhatsApp',
    // Click-to-Chat officially supports `phone` and `text` only; wa.me is a
    // universal link, so it opens the app without a custom scheme.
    carries: 'link',
    format: null,
    webIntent: (url, caption) => `https://wa.me/?text=${encodeURIComponent(withLink(caption, url))}`,
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'attach it in the chat — the caption and link are already there',
  },
  {
    key: 'facebook',
    platform: 'facebook',
    label: 'Facebook',
    // Relabelled from "Facebook Story": Stories are the same native-only
    // pasteboard mechanism as Instagram's, so `fb://story_composer` was
    // deleted rather than shipped as a promise this cannot keep.
    title: 'Facebook',
    carries: 'link',
    format: null,
    webIntent: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'Facebook posts the link only — attach the image yourself',
  },
  {
    key: 'tiktok',
    platform: 'tiktok',
    label: 'TikTok',
    title: 'TikTok',
    // `snssdk1233://` is the scheme TikTok registers for install detection. It
    // opens the app home, not a composer — no browser can reach Share Kit.
    carries: 'nothing',
    format: 'story',
    iosScheme: 'snssdk1233://',
    androidIntent: (fallback) =>
      buildAndroidIntent({ packageName: 'com.zhiliaoapp.musically', fallback }),
    webComposer: 'https://www.tiktok.com/upload',
    message: withLink,
    sheetNote: 'Sent at 9:16 — TikTok takes it from there.',
    savedNote: 'open TikTok and upload it — TikTok cannot take it from a browser',
  },
  {
    key: 'x',
    platform: 'x',
    label: 'X',
    title: 'X',
    // Legacy twitter.com/intent/tweet on purpose: x.com/intent/post has a
    // documented login loop inside the X in-app browser.
    carries: 'link',
    format: null,
    webIntent: (url, caption) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`,
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'add the image to the post — a browser can only pass text and the link',
  },
  {
    key: 'telegram',
    platform: 'telegram',
    label: 'Telegram',
    title: 'Telegram',
    carries: 'link',
    format: null,
    webIntent: (url, caption) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(caption)}`,
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'attach it in the chat — the caption and link are already there',
  },
  {
    key: 'discord',
    platform: 'discord',
    label: 'Discord',
    title: 'Discord',
    // Discord exposes no share intent of any kind; honest tier is save + copy.
    carries: 'nothing',
    format: null,
    webComposer: 'https://discord.com/channels/@me',
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'paste it into a channel — Discord has no share link',
  },
  {
    key: 'system',
    platform: 'system',
    label: 'More',
    title: 'Your share sheet',
    // The only tile that is honest about carrying pixels anywhere the OS
    // offers, because it never claims a destination.
    carries: 'image',
    format: null,
    message: withLink,
    sheetNote: 'Sent with the image attached.',
    savedNote: 'the image and caption are ready to paste',
  },
]

/**
 * The tile tooltip: what this tile will do on THIS device, before it is
 * tapped. Kept beside the routing so the promise and the behaviour cannot
 * drift apart.
 */
export function describeShareTarget(target: ShareTarget, capabilities: ShareCapabilities): string {
  if (capabilities.canShareFiles) return `${target.title} — your share sheet, image attached`
  if (target.key === 'system') return `${target.title} — the image and caption`
  if (target.carries === 'link') return `${target.title} — opens with the link and caption`
  return `${target.title} — saves the image first`
}

/** Saving a data: URL on iOS reaches Files, not Photos. Say so. */
function savedPrefix(platform: SharePlatform): string {
  return platform === 'ios'
    ? 'Saved to Files and caption copied (long-press the preview to keep it in Photos)'
    : 'Image saved and caption copied'
}

function launchFor(target: ShareTarget, web: string | undefined): ShareLaunch | null {
  if (!web) return null
  return {
    web,
    ...(target.iosScheme ? { ios: target.iosScheme } : {}),
    ...(target.androidIntent ? { android: target.androidIntent(web) } : {}),
  }
}

/**
 * Resolve one tile, for one device, right now.
 *
 * Tier A (`canShareFiles`) always wins: the OS sheet is the only route that
 * carries the image. It cannot be aimed, so the route still carries the
 * destination's `format` and note — the image tab re-renders at that canvas
 * before handing off, which is what makes four Instagram tiles four different
 * things rather than four copies of the same sheet.
 */
export function resolveShareRoute(
  target: ShareTarget,
  capabilities: ShareCapabilities,
  input: { url: string; caption: string },
): ShareRoute {
  const platform = capabilities.platform
  const message = target.message(input.caption, input.url)
  const base = { target: target.key, platform, message } as const

  if (capabilities.canShareFiles) {
    return {
      ...base,
      kind: 'os-share-file',
      format: target.format,
      launch: null,
      downloadImage: false,
      copyCaption: false,
      hint: target.sheetNote,
    }
  }

  // "More" is the OS sheet by definition; with no file support it degrades to
  // a link share, and with no share API at all to a download. Neither degraded
  // form carries the image, and neither hint claims otherwise.
  if (target.key === 'system') {
    return {
      ...base,
      kind: capabilities.canShare ? 'os-share-file' : 'download-only',
      format: null,
      launch: null,
      downloadImage: !capabilities.canShare,
      copyCaption: !capabilities.canShare,
      hint: capabilities.canShare
        ? 'Link shared — download the image to post it too.'
        : `${savedPrefix(platform)}.`,
    }
  }

  // The launch describes every platform at once; `openAppOrWeb` picks the one
  // this device understands, so there is no mobile-vs-desktop branch here.
  const web = target.webIntent ? target.webIntent(input.url, input.caption) : target.webComposer
  const launch = launchFor(target, web)

  return {
    ...base,
    kind: launch ? 'open-url' : 'download-only',
    format: target.format,
    launch,
    // The image never travels through a link, so it is always saved first.
    downloadImage: true,
    copyCaption: true,
    hint: `${savedPrefix(platform)} — ${target.savedNote}.`,
  }
}
