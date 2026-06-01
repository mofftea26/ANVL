import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import {
  BRAND_HERO_ASSET_PATHS,
  BRAND_SHOWCASE_MOTION,
} from './brandShowcaseAssets'

type WarriorVideoMode = 'scrub' | 'loop' | 'reduced'

function getWarriorVideoMode(reduced: boolean): WarriorVideoMode {
  if (reduced) return 'reduced'
  if (typeof window === 'undefined') return 'loop'
  return window.matchMedia(BRAND_SHOWCASE_MOTION.desktop).matches ? 'scrub' : 'loop'
}

function useWarriorVideoMode(): WarriorVideoMode {
  const reduced = useReducedMotion()
  const [mode, setMode] = useState<WarriorVideoMode>(() => getWarriorVideoMode(false))

  useEffect(() => {
    const sync = () => setMode(getWarriorVideoMode(reduced))
    sync()

    if (reduced) return

    const media = window.matchMedia(BRAND_SHOWCASE_MOTION.desktop)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [reduced])

  return mode
}

function WarriorFallback() {
  return (
    <div
      className="size-full"
      style={{
        background: [
          'radial-gradient(ellipse 70% 85% at 72% 38%, rgba(199, 194, 184, 0.14) 0%, transparent 58%)',
          'radial-gradient(ellipse 55% 70% at 88% 55%, rgba(120, 52, 28, 0.12) 0%, transparent 52%)',
          'linear-gradient(165deg, #0a0908 0%, #14110f 38%, #1a1512 72%, #0d0c0b 100%)',
        ].join(', '),
      }}
    />
  )
}

const EMBER_SEEDS = [
  { left: '18%', top: '62%', delay: '0s', size: 3 },
  { left: '74%', top: '48%', delay: '1.4s', size: 2 },
  { left: '52%', top: '78%', delay: '2.8s', size: 2.5 },
  { left: '88%', top: '66%', delay: '0.6s', size: 2 },
  { left: '32%', top: '38%', delay: '3.2s', size: 2 },
] as const

function EmberField({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {EMBER_SEEDS.map((ember, i) => (
        <span
          key={`ember-${i}`}
          data-brand-ember
          className="absolute rounded-full bg-[rgba(231,120,54,0.55)] blur-[1px] will-change-[transform,opacity]"
          style={{
            left: ember.left,
            top: ember.top,
            width: ember.size,
            height: ember.size,
            animation: `brand-ember-drift 8s ease-in-out ${ember.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}

function WarriorVideoLayer({ onError }: { onError: () => void }) {
  const mode = useWarriorVideoMode()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || mode !== 'loop') return

    const play = () => {
      try {
        const result = video.play()
        if (result && typeof result.catch === 'function') {
          void result.catch(() => {})
        }
      } catch {
        // Autoplay blocked or non-browser test environment.
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) play()
        else video.pause()
      },
      { threshold: 0.06, rootMargin: '8% 0px' },
    )

    observer.observe(video)
    play()

    return () => observer.disconnect()
  }, [mode])

  useEffect(() => {
    const video = videoRef.current
    if (!video || mode !== 'reduced') return

    const play = () => {
      try {
        const result = video.play()
        if (result && typeof result.catch === 'function') {
          void result.catch(() => {})
        }
      } catch {
        // Autoplay blocked or non-browser test environment.
      }
    }

    play()
  }, [mode])

  useEffect(() => {
    const video = videoRef.current
    if (!video || mode !== 'scrub') return

    video.pause()
    video.loop = false
    video.autoplay = false
    video.removeAttribute('autoplay')
    video.currentTime = 0
  }, [mode])

  return (
    <video
      ref={videoRef}
      data-brand-hero-warrior-video
      data-brand-hero-video-scrub={mode === 'scrub' ? '' : undefined}
      src={BRAND_HERO_ASSET_PATHS.warriorVideo}
      poster={BRAND_HERO_ASSET_PATHS.warrior}
      className="size-full object-cover object-center md:object-[78%_46%]"
      muted
      playsInline
      loop={mode !== 'scrub'}
      preload={mode === 'reduced' ? 'metadata' : 'auto'}
      autoPlay={mode !== 'scrub'}
      aria-hidden
      onError={onError}
    />
  )
}

/**
 * Full-viewport warrior video background — fixed behind the pinned scroll canvas.
 * Scroll scrub is driven by the master ScrollTrigger via `bindScrollVideo`.
 */
export function CinematicHero() {
  const reducedMotion = useReducedMotion()
  const [warriorOk, setWarriorOk] = useState(true)

  return (
    <div
      data-brand-hero-stack
      className="pointer-events-none fixed inset-0 z-0 size-full overflow-hidden"
      aria-hidden
    >
      <div data-brand-hero-warrior className="absolute inset-0 will-change-transform">
        {warriorOk ? (
          <WarriorVideoLayer onError={() => setWarriorOk(false)} />
        ) : (
          <WarriorFallback />
        )}
      </div>

      <EmberField active={!reducedMotion} />

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_88%_72%_at_50%_42%,transparent_0%,rgba(0,0,0,0.42)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[46%] bg-gradient-to-t from-black/78 via-black/32 to-transparent sm:h-[42%] md:h-[36%]"
        aria-hidden
      />
      <div
        data-brand-hero-vignette
        className="pointer-events-none absolute inset-0 z-[1] will-change-[opacity]"
        style={{
          opacity: 0.52,
          background: [
            'radial-gradient(ellipse 92% 68% at 50% 38%, transparent 0%, rgba(0,0,0,0.28) 100%)',
            'radial-gradient(ellipse 120% 90% at 50% 100%, rgba(0,0,0,0.72) 0%, transparent 55%)',
            'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.38) 100%)',
          ].join(', '),
        }}
      />
    </div>
  )
}
