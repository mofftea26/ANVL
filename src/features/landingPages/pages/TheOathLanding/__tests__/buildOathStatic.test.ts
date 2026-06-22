import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildOathStatic } from '../motion/buildOathStatic'

describe('buildOathStatic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('autoplays the mobile hero video without looping and pauses on ended', () => {
    const host = document.createElement('div')
    const mobileVideo = document.createElement('video')
    mobileVideo.setAttribute('data-hero-video-mobile', 'true')
    const play = vi.fn().mockResolvedValue(undefined)
    const pause = vi.fn()
    mobileVideo.play = play
    mobileVideo.pause = pause
    host.appendChild(mobileVideo)

    const dispose = buildOathStatic(host)

    expect(mobileVideo.loop).toBe(false)
    expect(mobileVideo.muted).toBe(true)
    expect(play).toHaveBeenCalled()

    mobileVideo.dispatchEvent(new Event('ended'))
    expect(pause).toHaveBeenCalled()

    dispose()
  })

  it('prefers the mobile hero video over desktop when both exist', () => {
    const host = document.createElement('div')
    const mobileVideo = document.createElement('video')
    mobileVideo.setAttribute('data-hero-video-mobile', 'true')
    const desktopVideo = document.createElement('video')
    desktopVideo.setAttribute('data-hero-video-desktop', 'true')

    const mobilePlay = vi.fn().mockResolvedValue(undefined)
    const desktopPlay = vi.fn().mockResolvedValue(undefined)
    mobileVideo.play = mobilePlay
    desktopVideo.play = desktopPlay

    host.appendChild(desktopVideo)
    host.appendChild(mobileVideo)

    buildOathStatic(host)

    expect(mobilePlay).toHaveBeenCalled()
    expect(desktopPlay).not.toHaveBeenCalled()
  })

  it('does not autoplay hero video under reduced motion', () => {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', matchMedia)

    const host = document.createElement('div')
    const video = document.createElement('video')
    video.setAttribute('data-hero-video-mobile', 'true')
    const play = vi.fn().mockResolvedValue(undefined)
    const pause = vi.fn()
    video.play = play
    video.pause = pause
    host.appendChild(video)

    buildOathStatic(host)

    expect(play).not.toHaveBeenCalled()
    expect(pause).toHaveBeenCalled()
  })
})
