import type { SharePlatform, ShareLaunch } from './types'

/**
 * Launching another app from a web page, done the only two ways that still
 * work.
 *
 * The three techniques, ranked (measured, not assumed):
 *  - `window.open(scheme, '_blank')` — what this feature used to do. On iOS it
 *    opens a NEW TAB and navigates it to an unhandled scheme, so a missing app
 *    yields "Safari cannot open the page because the address is invalid" plus
 *    an orphaned blank tab. On Chrome Android it does not launch apps at all.
 *  - hidden iframe — dead since iOS 9 and Chrome 25. Never use it.
 *  - top-level `location.href` (scheme on iOS, `intent://` on Android) — the
 *    documented mechanism, and what this module does.
 *
 * The other half of the fix lives in the callers: Chrome refuses an intent URI
 * "initiated without user gesture", and WebKit's transient activation does not
 * survive an await, so the launch must be the FIRST statement in the click
 * handler with nothing awaited before it.
 */

/**
 * How long to give the app to take over before falling back to the web. Short
 * enough that a missing app does not feel broken, long enough that a cold app
 * start still wins the race.
 */
const APP_HANDOFF_MS = 1200

/**
 * Build a Chrome-Android `intent://` URL. `S.browser_fallback_url` is not
 * optional here: without it a missing app leaves Chrome on a dead page, and
 * with it a wrong package name degrades silently to the website.
 *
 * Omit `scheme`/`host` to launch an app by package alone (`intent:#Intent;…`),
 * which is what a destination with no addressable screen wants.
 */
export function buildAndroidIntent(options: {
  /** Play Store package id, e.g. `com.instagram.android`. */
  packageName: string
  /** Where a miss lands. */
  fallback: string
  scheme?: string
  host?: string
}): string {
  const head = options.scheme && options.host ? `intent://${options.host}/` : 'intent:'
  const scheme = options.scheme ? `scheme=${options.scheme};` : ''
  const fallback = `S.browser_fallback_url=${encodeURIComponent(options.fallback)};`
  return `${head}#Intent;${scheme}package=${options.packageName};${fallback}end`
}

/**
 * Navigate to an app, falling back to the web when it is not installed.
 *
 * Must be called synchronously from the user gesture — see the module note.
 */
export function openAppOrWeb(launch: ShareLaunch, platform: SharePlatform): void {
  if (platform === 'android' && launch.android) {
    // The fallback is inside the intent URL, so Chrome handles the miss.
    window.location.href = launch.android
    return
  }

  if (platform === 'ios' && launch.ios) {
    armWebFallback(launch.web)
    window.location.href = launch.ios
    return
  }

  // Desktop, or a platform with no verified scheme: a plain https tab.
  window.open(launch.web, '_blank', 'noopener,noreferrer')
}

/**
 * iOS gives no signal for "that scheme went nowhere", so infer it: if the app
 * took over, the page is hidden or pagehide fired within the handoff window,
 * and the fallback is cancelled. If nothing happened, the user lands on the
 * website instead of a system error alert.
 */
function armWebFallback(web: string): void {
  const cancel = () => {
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', cancel)
    window.removeEventListener('pagehide', cancel)
  }

  const timer = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', cancel)
    window.removeEventListener('pagehide', cancel)
    window.location.href = web
  }, APP_HANDOFF_MS)

  document.addEventListener('visibilitychange', cancel)
  window.addEventListener('pagehide', cancel)
}
