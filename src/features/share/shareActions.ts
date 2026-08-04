import { openAppOrWeb } from './openTarget'
import type { SharePlatform, ShareLaunch, ShareRoute } from './types'

/**
 * The side-effecting half of sharing: saving a file, copying text, handing a
 * blob to the OS sheet, and launching an app. Kept out of the components so a
 * tile's behaviour is one call, and out of {@link resolveShareRoute} so the
 * decision stays pure.
 *
 * **The rule this module enforces: nothing may be awaited between the click
 * and the navigation.** WebKit's transient activation does not survive a long
 * async operation, and `navigator.clipboard.writeText` both requires and
 * CONSUMES it — so an `await copyText(...)` before `window.open()` silently
 * kills the navigation on iOS and the tile appears dead. That is why the
 * synchronous path and the `navigator.share` path are two separate functions:
 * an await can only be introduced in the one where it is already safe.
 */

export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (!dataUrl) return
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Hand the PNG to the OS share sheet. Returns false if it was not possible. */
export async function shareImageFile(
  blob: Blob | null,
  filename: string,
  payload: { title: string; text: string },
): Promise<boolean> {
  if (!blob) return false
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
  if (typeof nav.share !== 'function') return false

  const file = new File([blob], filename, { type: 'image/png' })
  if (nav.canShare && !nav.canShare({ files: [file] })) return false
  try {
    await nav.share({ files: [file], title: payload.title, text: payload.text })
    return true
  } catch {
    // Dismissing the sheet is a normal outcome, not a failure to report.
    return false
  }
}

/** Link-only share through the OS sheet (no image). */
export async function shareLink(payload: {
  title: string
  text: string
  url: string
}): Promise<boolean> {
  if (typeof navigator.share !== 'function') return false
  try {
    await navigator.share(payload)
    return true
  } catch {
    return false
  }
}

export interface RunRoutePayload {
  blob: Blob | null
  dataUrl: string
  filename: string
  title: string
  /** The unshaped caption — the route carries the destination-shaped text. */
  caption: string
  url: string
}

/** Injected so the runners can be tested without a DOM or a clipboard. */
export interface ShareRouteDeps {
  open: (launch: ShareLaunch, platform: SharePlatform) => void
  download: (dataUrl: string, filename: string) => void
  copy: (text: string) => Promise<boolean>
}

const DEFAULT_DEPS: ShareRouteDeps = {
  open: openAppOrWeb,
  download: downloadDataUrl,
  copy: copyText,
}

/** Truthful fallback copy when only the file and the caption could travel. */
function savedFallbackHint(platform: SharePlatform): string {
  return platform === 'ios'
    ? 'Saved to Files and caption copied — long-press the preview to keep it in Photos.'
    : 'Image saved and caption copied.'
}

/**
 * Every route except the OS sheet. **Synchronous on purpose — do not make this
 * async, and do not await anything inside it.**
 *
 * The navigation goes first so it runs while the user activation is still
 * live; the download follows; the clipboard write is fire-and-forget, because
 * awaiting it is exactly the bug this shape exists to prevent.
 */
export function runShareRouteSync(
  route: ShareRoute,
  payload: RunRoutePayload,
  deps: ShareRouteDeps = DEFAULT_DEPS,
): string {
  if (route.launch) deps.open(route.launch, route.platform)
  if (route.downloadImage) deps.download(payload.dataUrl, payload.filename)
  if (route.copyCaption) void deps.copy(route.message)
  return route.hint
}

/**
 * The one genuinely async route: `navigator.share` must be awaited, and it is
 * the first call in the handler so the activation is intact.
 *
 * Note that `share()` itself CONSUMES the activation, so nothing may try to
 * open a URL after it — the fallbacks below deliberately only save and copy.
 */
export async function runOsShareRoute(
  route: ShareRoute,
  payload: RunRoutePayload,
  deps: ShareRouteDeps = DEFAULT_DEPS,
): Promise<string> {
  const shared = await shareImageFile(payload.blob, payload.filename, {
    title: payload.title,
    text: route.message,
  })
  if (shared) return route.hint

  // The sheet refused or was dismissed — fall back to a link share, then to
  // saving, rather than leaving the tap unanswered. The route's own hint is
  // not reused here: it describes an image that, on this branch, did not go.
  const linked = await shareLink({
    title: payload.title,
    text: payload.caption,
    url: payload.url,
  })
  if (linked) return 'Link sent — download the image to post it too.'

  deps.download(payload.dataUrl, payload.filename)
  void deps.copy(route.message)
  return savedFallbackHint(route.platform)
}

/**
 * Dispatch a resolved route. Deliberately NOT `async`: the synchronous branch
 * has to complete inside the gesture, and returning an already-settled promise
 * lets a caller `await` the result without ever putting an await in front of
 * the navigation.
 */
export function runShareRoute(
  route: ShareRoute,
  payload: RunRoutePayload,
  deps: ShareRouteDeps = DEFAULT_DEPS,
): Promise<string | null> {
  if (route.kind === 'os-share-file') return runOsShareRoute(route, payload, deps)
  return Promise.resolve(runShareRouteSync(route, payload, deps))
}
