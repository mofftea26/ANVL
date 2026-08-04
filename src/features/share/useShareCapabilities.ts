import { useEffect, useState } from 'react'
import type { ShareCapabilities, SharePlatform } from './types'

/** SSR and first paint assume nothing; hydration upgrades. */
const NO_CAPABILITIES: ShareCapabilities = {
  canShare: false,
  canShareFiles: false,
  isMobile: false,
  platform: 'other',
}

/** A one-byte PNG, purely to ask the browser whether it will share files. */
function probeFile(): File {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
  return new File([bytes], 'probe.png', { type: 'image/png' })
}

/**
 * Which app-launch technique this browser understands.
 *
 * The user agent is the wrong tool for feature detection but the only tool for
 * this one: `intent://` is Chrome-on-Android syntax and `location.href =
 * 'instagram://…'` is the iOS path, and neither is detectable. iPadOS reports
 * itself as `MacIntel`, hence the touch-point check.
 */
function detectPlatform(): SharePlatform {
  const ua = navigator.userAgent
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIos) return 'ios'
  return /Android/.test(ua) ? 'android' : 'other'
}

/**
 * What this browser can actually do with a share.
 *
 * Detected after mount, never during render: `navigator.share` does not exist
 * on the server, and guessing from the user agent is how you end up promising
 * an Instagram Story on a desktop that cannot deliver one.
 */
export function useShareCapabilities(): ShareCapabilities {
  const [capabilities, setCapabilities] = useState<ShareCapabilities>(NO_CAPABILITIES)

  useEffect(() => {
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
    const canShare = typeof nav.share === 'function'

    let canShareFiles = false
    if (canShare && typeof nav.canShare === 'function') {
      try {
        canShareFiles = nav.canShare({ files: [probeFile()] })
      } catch {
        // Some engines throw instead of returning false.
        canShareFiles = false
      }
    }

    const isMobile = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
    setCapabilities({ canShare, canShareFiles, isMobile, platform: detectPlatform() })
  }, [])

  return capabilities
}
