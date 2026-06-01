/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bindScrollVideo,
  createScrollVideoScrubber,
  resolveVideoSeekTime,
} from '@/features/marketing/default-landing/useScrollVideo'

describe('resolveVideoSeekTime', () => {
  it('maps scroll progress to a seek target in seconds', () => {
    expect(resolveVideoSeekTime(10, 0.5, -1)).toBe(5)
  })

  it('clamps progress to the video duration bounds', () => {
    expect(resolveVideoSeekTime(10, 1.4, -1)).toBe(10)
    expect(resolveVideoSeekTime(10, -0.2, -1)).toBe(0)
  })

  it('skips seeks below the configured threshold', () => {
    expect(resolveVideoSeekTime(10, 0.501, 5)).toBeNull()
    expect(resolveVideoSeekTime(10, 0.52, 5, 0.1)).toBe(5.2)
  })
})

describe('createScrollVideoScrubber', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pauses looping playback once metadata is ready', () => {
    const video = document.createElement('video')
    Object.defineProperty(video, 'duration', { value: 10, configurable: true })
    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_METADATA,
      configurable: true,
    })
    video.pause = vi.fn()

    const scrubber = createScrollVideoScrubber(video)
    scrubber.update(0.5)

    expect(video.pause).toHaveBeenCalled()
    expect(video.loop).toBe(false)
    expect(resolveVideoSeekTime(10, 0.5, -1)).toBe(5)

    scrubber.dispose()
  })

  it('binds scrubber from warrior video without scrub-only attribute', () => {
    const host = document.createElement('div')
    const video = document.createElement('video')
    video.setAttribute('data-brand-hero-warrior-video', '')
    Object.defineProperty(video, 'duration', { value: 8, configurable: true })
    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_METADATA,
      configurable: true,
    })
    video.pause = vi.fn()
    host.appendChild(video)

    let update: ((progress: number) => void) | undefined
    const dispose = bindScrollVideo(host, (fn) => {
      update = fn
    })

    update?.(0.25)
    expect(video.pause).toHaveBeenCalled()
    expect(resolveVideoSeekTime(8, 0.25, -1)).toBe(2)

    dispose?.()
  })

  it('reverses scrub direction when progress decreases', () => {
    const video = document.createElement('video')
    Object.defineProperty(video, 'duration', { value: 10, configurable: true })
    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_METADATA,
      configurable: true,
    })
    video.pause = vi.fn()

    const scrubber = createScrollVideoScrubber(video)
    scrubber.update(0.8)
    scrubber.update(0.2)

    expect(resolveVideoSeekTime(10, 0.2, -1)).toBe(2)
    scrubber.dispose()
  })
})
