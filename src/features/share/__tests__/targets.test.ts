import { describe, expect, it } from 'vitest'
import { resolveShareRoute, SHARE_TARGETS, type ShareTarget } from '../targets'
import type { ShareCapabilities, ShareTargetKey } from '../types'

const INPUT = { url: 'https://www.anvlathletics.com/armory/george', caption: 'Deadlift PR — 240 kg.' }

const CAPABILITIES: Record<string, ShareCapabilities> = {
  iosPhone: { canShare: true, canShareFiles: true, isMobile: true, platform: 'ios' },
  androidPhone: { canShare: true, canShareFiles: true, isMobile: true, platform: 'android' },
  olderIos: { canShare: true, canShareFiles: false, isMobile: true, platform: 'ios' },
  olderAndroid: { canShare: true, canShareFiles: false, isMobile: true, platform: 'android' },
  desktopWithShare: { canShare: true, canShareFiles: false, isMobile: false, platform: 'other' },
  desktopBare: { canShare: false, canShareFiles: false, isMobile: false, platform: 'other' },
}

const TIERS = Object.entries(CAPABILITIES)

function target(key: ShareTargetKey): ShareTarget {
  const found = SHARE_TARGETS.find((entry) => entry.key === key)
  if (!found) throw new Error(`No share target ${key}`)
  return found
}

const INSTAGRAM_KEYS: ShareTargetKey[] = [
  'instagram-story',
  'instagram-post',
  'instagram-reel',
  'instagram-dm',
]

describe('resolveShareRoute', () => {
  it('never leaves a tile with nothing to do, on any device', () => {
    for (const [tier, capabilities] of TIERS) {
      for (const entry of SHARE_TARGETS) {
        const route = resolveShareRoute(entry, capabilities, INPUT)
        const actionable =
          route.kind === 'os-share-file' ||
          Boolean(route.launch) ||
          route.downloadImage ||
          route.copyCaption
        expect(actionable, `${entry.key} on ${tier}`).toBe(true)
      }
    }
  })

  it('always explains itself', () => {
    for (const [tier, capabilities] of TIERS) {
      for (const entry of SHARE_TARGETS) {
        const route = resolveShareRoute(entry, capabilities, INPUT)
        expect(route.hint.length, `${entry.key} on ${tier} gave no hint`).toBeGreaterThan(0)
      }
    }
  })

  it('carries the caption and the link in every message', () => {
    for (const [tier, capabilities] of TIERS) {
      for (const entry of SHARE_TARGETS) {
        const route = resolveShareRoute(entry, capabilities, INPUT)
        expect(route.message, `${entry.key} on ${tier}`).toContain(INPUT.caption)
        expect(route.message, `${entry.key} on ${tier}`).toContain(INPUT.url)
      }
    }
  })
})

describe('the OS share sheet tier', () => {
  // The sheet is the only route that carries pixels, and the Web Share API
  // cannot be aimed at an app — so the differentiation has to survive it.
  it('uses the sheet for every tile but still names the destination', () => {
    const hints = new Set<string>()
    for (const entry of SHARE_TARGETS) {
      const route = resolveShareRoute(entry, CAPABILITIES.iosPhone!, INPUT)
      expect(route.kind, entry.key).toBe('os-share-file')
      // The sheet carries the image itself — saving a copy would be noise.
      expect(route.downloadImage, entry.key).toBe(false)
      hints.add(route.hint)
    }
    expect(hints.size).toBeGreaterThan(1)
  })

  it('keeps the four Instagram tiles distinct rather than collapsing them', () => {
    const routes = INSTAGRAM_KEYS.map((key) =>
      resolveShareRoute(target(key), CAPABILITIES.androidPhone!, INPUT),
    )

    expect(new Set(routes.map((route) => route.format)).size).toBe(3) // 9:16, 4:5, 1:1
    expect(new Set(routes.map((route) => route.hint)).size).toBe(4)
    expect(new Set(routes.map((route) => route.message)).size).toBe(4)
    expect(routes.map((route) => route.format)).toEqual(['story', 'post', 'story', 'square'])
  })

  it('tells the image tab which canvas each destination wants', () => {
    for (const key of INSTAGRAM_KEYS) {
      expect(resolveShareRoute(target(key), CAPABILITIES.iosPhone!, INPUT).format).not.toBeNull()
    }
    // "More" makes no promise about the crop, so it leaves the user's choice.
    expect(resolveShareRoute(target('system'), CAPABILITIES.iosPhone!, INPUT).format).toBeNull()
  })
})

describe('app launching', () => {
  it('saves the image and copies the caption whenever only a link travels', () => {
    for (const entry of SHARE_TARGETS) {
      if (entry.key === 'system') continue
      const route = resolveShareRoute(entry, CAPABILITIES.olderIos!, INPUT)
      expect(route.downloadImage, entry.key).toBe(true)
      expect(route.copyCaption, entry.key).toBe(true)
      expect(route.hint, entry.key).toMatch(/saved/i)
    }
  })

  it('never ships a custom scheme without an armed web fallback', () => {
    for (const [tier, capabilities] of TIERS) {
      for (const entry of SHARE_TARGETS) {
        const { launch } = resolveShareRoute(entry, capabilities, INPUT)
        if (!launch) continue
        expect(launch.web, `${entry.key} on ${tier}`).toMatch(/^https:\/\//)
        if (launch.android) {
          expect(launch.android, entry.key).toContain('S.browser_fallback_url=')
          expect(launch.android, entry.key).toContain(encodeURIComponent(launch.web))
        }
      }
    }
  })

  it('ships only documented schemes', () => {
    const schemes = SHARE_TARGETS.map((entry) => entry.iosScheme).filter(Boolean)
    // Every one of these appeared in the previous registry and none is
    // documented; a miss raises the iOS "address is invalid" alert.
    expect(schemes).not.toContain('instagram://story-camera')
    expect(schemes).not.toContain('fb://story_composer')
    expect(schemes.some((scheme) => scheme?.includes('reel'))).toBe(false)

    expect(target('instagram-story').iosScheme).toBe('instagram://camera')
    expect(target('instagram-reel').iosScheme).toBe('instagram://camera')
    expect(target('instagram-dm').iosScheme).toBe('instagram://direct-inbox')
  })

  it('uses intent:// with the real package on Android', () => {
    const route = resolveShareRoute(target('instagram-post'), CAPABILITIES.olderAndroid!, INPUT)
    expect(route.launch?.android).toContain('package=com.instagram.android')
    expect(route.launch?.android).toContain('scheme=instagram')
    expect(route.launch?.android).toMatch(/^intent:\/\/camera\/#Intent;/)
  })

  it('sends a desktop Instagram tap to the website, not a scheme', () => {
    const route = resolveShareRoute(target('instagram-story'), CAPABILITIES.desktopBare!, INPUT)
    expect(route.launch?.web).toBe('https://www.instagram.com/')
  })

  it('carries the caption and link into the platforms that accept them', () => {
    const route = resolveShareRoute(target('whatsapp'), CAPABILITIES.desktopBare!, INPUT)
    expect(route.launch?.web).toContain(encodeURIComponent(INPUT.caption))
    expect(route.launch?.web).toContain(encodeURIComponent(INPUT.url))
  })
})

describe('honesty of the labels', () => {
  it('does not promise a Facebook Story it cannot deliver', () => {
    const facebook = target('facebook')
    expect(facebook.label).not.toMatch(/story/i)
    expect(facebook.iosScheme).toBeUndefined()
    expect(
      resolveShareRoute(facebook, CAPABILITIES.desktopBare!, INPUT).launch?.web,
    ).toContain('facebook.com/sharer')
  })

  it('does not imply the image travels to TikTok or Discord through a link', () => {
    for (const key of ['tiktok', 'discord'] as const) {
      expect(target(key).carries).toBe('nothing')
      const route = resolveShareRoute(target(key), CAPABILITIES.olderAndroid!, INPUT)
      // Nothing but the user can move the file, so the file must be saved.
      expect(route.downloadImage).toBe(true)
    }
  })

  it('tells iOS the truth about where a saved image lands', () => {
    const ios = resolveShareRoute(target('instagram-story'), CAPABILITIES.olderIos!, INPUT)
    const android = resolveShareRoute(target('instagram-story'), CAPABILITIES.olderAndroid!, INPUT)
    expect(ios.hint).toMatch(/files/i)
    expect(android.hint).not.toMatch(/files/i)
  })
})

describe('"More"', () => {
  it('degrades to a plain download when there is no share API at all', () => {
    const route = resolveShareRoute(target('system'), CAPABILITIES.desktopBare!, INPUT)
    expect(route.kind).toBe('download-only')
    expect(route.downloadImage).toBe(true)
    expect(route.launch).toBeNull()
  })

  it('stays on the OS sheet when only link sharing is available', () => {
    const route = resolveShareRoute(target('system'), CAPABILITIES.desktopWithShare!, INPUT)
    expect(route.kind).toBe('os-share-file')
  })
})
