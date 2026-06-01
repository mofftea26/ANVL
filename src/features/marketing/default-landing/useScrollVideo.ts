import { BRAND_HERO_WARRIOR_VIDEO_SEEK_EPS } from './brandShowcaseAssets'

export type ScrollVideoScrubber = {
  update: (progress: number) => void
  dispose: () => void
}

function clampProgress(progress: number): number {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  return progress
}

/** Pure mapping used by the scrubber — exported for unit tests. */
export function resolveVideoSeekTime(
  duration: number,
  progress: number,
  lastAppliedTime: number,
  seekEps = BRAND_HERO_WARRIOR_VIDEO_SEEK_EPS,
): number | null {
  if (!Number.isFinite(duration) || duration <= 0) return null

  const targetTime = clampProgress(progress) * duration
  if (Math.abs(targetTime - lastAppliedTime) < seekEps) return null
  return targetTime
}

/**
 * Maps ScrollTrigger progress (0→1) to `video.currentTime` with rAF throttling
 * and a minimum seek delta to avoid layout thrash from per-pixel seeks.
 */
export function createScrollVideoScrubber(video: HTMLVideoElement): ScrollVideoScrubber {
  let duration = 0
  let metadataReady = false
  let rafId = 0
  let pendingProgress: number | null = null
  let lastAppliedTime = -1

  const applyProgress = (progress: number) => {
    if (!metadataReady) return

    const targetTime = resolveVideoSeekTime(duration, progress, lastAppliedTime)
    if (targetTime === null) return

    lastAppliedTime = targetTime
    try {
      video.currentTime = targetTime
    } catch {
      // Seek can fail while the browser is still buffering keyframes.
    }
  }

  const flush = () => {
    rafId = 0
    if (pendingProgress === null) return
    applyProgress(pendingProgress)
    pendingProgress = null
  }

  const schedule = (progress: number) => {
    pendingProgress = progress
    if (!rafId) rafId = requestAnimationFrame(flush)
  }

  const primeMetadata = () => {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) return

    const nextDuration = video.duration
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) return

    duration = nextDuration
    metadataReady = true
    video.pause()
    video.loop = false
    video.autoplay = false
    video.removeAttribute('autoplay')

    if (pendingProgress !== null) schedule(pendingProgress)
    else schedule(0)
  }

  video.addEventListener('loadedmetadata', primeMetadata)
  video.addEventListener('durationchange', primeMetadata)
  video.addEventListener('loadeddata', primeMetadata)
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) primeMetadata()

  return {
    update: schedule,
    dispose: () => {
      video.removeEventListener('loadedmetadata', primeMetadata)
      video.removeEventListener('durationchange', primeMetadata)
      video.removeEventListener('loadeddata', primeMetadata)
      if (rafId) cancelAnimationFrame(rafId)
    },
  }
}

export type BindScrollVideoOptions = {
  /** CSS selector for the video element within the host. */
  videoSelector?: string
}

/**
 * Binds scroll scrub to a hero video inside the showcase host.
 * Lazily creates the scrubber so it still works if React effects run after GSAP mount.
 */
export function bindScrollVideo(
  host: HTMLElement,
  onProgress: (update: (progress: number) => void) => void,
  { videoSelector = '[data-brand-hero-warrior-video]' }: BindScrollVideoOptions = {},
): (() => void) | undefined {
  let scrubber: ScrollVideoScrubber | null = null
  let boundVideo: HTMLVideoElement | null = null
  let retryId = 0

  const resolveScrubber = () => {
    const video = host.querySelector<HTMLVideoElement>(videoSelector)
    if (!video) return null
    if (scrubber && boundVideo === video) return scrubber

    scrubber?.dispose()
    boundVideo = video
    scrubber = createScrollVideoScrubber(video)
    return scrubber
  }

  const update = (progress: number) => {
    const active = resolveScrubber()
    if (active) {
      active.update(progress)
      return
    }

    if (!retryId) {
      retryId = requestAnimationFrame(() => {
        retryId = 0
        resolveScrubber()?.update(progress)
      })
    }
  }

  onProgress(update)

  return () => {
    if (retryId) cancelAnimationFrame(retryId)
    scrubber?.dispose()
    scrubber = null
    boundVideo = null
  }
}
