import type { RefObject } from 'react'
import { gsap, useGSAP } from '@/shared/lib/gsap'
import { bindScrollVideo } from '@/features/marketing/default-landing/useScrollVideo'
import {
  CINEMATIC_HERO_MOTION,
  cinematicScrollEnd,
  computeSectionBeats,
} from './cinematicHero.constants'
import type { CinematicConfig } from './cinematicHero.types'
import { useCinematicHeroPhaseStore } from './cinematicHeroPhase.store'
import {
  applyCinematicHeroScrollStartState,
  isCinematicScrollAtTop,
  resolveActiveSectionIndex,
  syncCinematicBeatStack,
} from './cinematicHero.visibility'

function beatWindow(inAt: number, outAt: number) {
  const span = outAt - inAt
  return {
    fadeInEnd: inAt + span * 0.14,
    holdEnd: outAt - span * 0.14,
    fadeOutEnd: outAt,
  }
}

function bindSectionBeat(
  timeline: gsap.core.Timeline,
  beat: HTMLElement | null,
  inAt: number,
  outAt: number,
  startVisible = false,
  holdThroughEnd = false,
) {
  if (!beat) return
  const enterY = 40
  const { fadeInEnd, holdEnd, fadeOutEnd } = beatWindow(inAt, outAt)
  const enterDuration = fadeInEnd - inAt
  const exitDuration = fadeOutEnd - holdEnd

  if (startVisible) {
    gsap.set(beat, {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      pointerEvents: 'auto',
      visibility: 'visible',
    })
  } else {
    gsap.set(beat, {
      opacity: 0,
      y: enterY,
      scale: 0.94,
      filter: 'blur(8px)',
      pointerEvents: 'none',
      visibility: 'hidden',
    })
    timeline.to(
      beat,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto',
        visibility: 'visible',
        ease: 'power3.out',
        duration: enterDuration,
      },
      inAt,
    )
  }

  if (!holdThroughEnd) {
    timeline.to(
      beat,
      {
        opacity: 0,
        y: -enterY * 0.72,
        scale: 0.97,
        filter: 'blur(6px)',
        pointerEvents: 'none',
        visibility: 'hidden',
        ease: 'power2.in',
        duration: exitDuration,
      },
      holdEnd,
    )
  }
}

function bindCopyLines(
  timeline: gsap.core.Timeline,
  beat: HTMLElement,
  inAt: number,
  outAt: number,
  startVisible = false,
  holdThroughEnd = false,
) {
  const lines = gsap.utils.toArray<HTMLElement>('[data-cinematic-copy]', beat)
  if (!lines.length) return
  const { fadeInEnd, holdEnd } = beatWindow(inAt, outAt)
  const stagger = Math.min(0.05, (fadeInEnd - inAt) / lines.length)

  if (startVisible) {
    gsap.set(lines, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' })
  } else {
    gsap.set(lines, { opacity: 0, y: 36, scale: 0.96, filter: 'blur(10px)' })
    timeline.to(
      lines,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        stagger,
        ease: 'power3.out',
        duration: fadeInEnd - inAt,
      },
      inAt,
    )
  }

  if (!holdThroughEnd) {
    timeline.to(
      lines,
      {
        opacity: 0,
        y: -20,
        scale: 0.98,
        filter: 'blur(5px)',
        stagger: stagger * 0.55,
        ease: 'power2.in',
        duration: 0.1,
      },
      holdEnd,
    )
  }
}

function snapReducedState(host: HTMLElement) {
  gsap.set('[data-cinematic-beat]', { opacity: 1, y: 0, scale: 1, clearProps: 'transform,filter' })
  gsap.set('[data-cinematic-copy]', { opacity: 1, y: 0, clearProps: 'transform,opacity,filter' })
  const stage = host.querySelector<HTMLElement>('[data-cinematic-stage]')
  if (stage) gsap.set(stage, { display: 'none' })
  const stack = host.querySelector<HTMLElement>('[data-cinematic-reduced-stack]')
  if (stack) gsap.set(stack, { display: 'block', opacity: 1 })
}

export function useCinematicHeroTimeline(
  rootRef: RefObject<HTMLElement | null>,
  config: CinematicConfig,
) {
  const sectionCount = config.sections.length

  useGSAP(
    () => {
      const host = rootRef.current
      if (!host || !config.enabled || sectionCount === 0) return

      const { setPhase, setActiveSectionId, setNavMode, setSections } =
        useCinematicHeroPhaseStore.getState()
      setNavMode(config.navMode)
      setSections(config.sections)

      const scrollEnd = cinematicScrollEnd(config.scrollLength)
      const mm = gsap.matchMedia()

      mm.add(CINEMATIC_HERO_MOTION.reduced, () => {
        snapReducedState(host)
        setPhase('commerce')
      })

      mm.add(CINEMATIC_HERO_MOTION.mobile, () => {
        const stack = host.querySelector('[data-cinematic-reduced-stack]')
        if (!stack) return
        const ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>('[data-cinematic-scroll-section]', stack).forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 28,
              duration: 0.75,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            })
          })
        }, host)
        setPhase('commerce')
        return () => ctx.revert()
      })

      mm.add(CINEMATIC_HERO_MOTION.desktop, () => {
        let disposeScrollVideo: (() => void) | undefined
        const ctx = gsap.context(() => {
          const stage = host.querySelector<HTMLElement>('[data-cinematic-stage]')
          if (!stage) return

          let scrubVideo: ((p: number) => void) | undefined
          if (config.backgroundMode === 'video') {
            disposeScrollVideo = bindScrollVideo(
              host,
              (update) => {
                scrubVideo = update
                scrubVideo(0)
              },
              { videoSelector: '[data-cinematic-hero-video]' },
            )
          }

          const beats = computeSectionBeats(sectionCount)
          const firstSectionId = config.sections[0]?.id

          let scene: gsap.core.Timeline

          const resetToScrollTop = () => {
            scene.progress(0)
            applyCinematicHeroScrollStartState(host, firstSectionId)
            setActiveSectionId(firstSectionId ?? null)
          }

          scene = gsap.timeline({
            scrollTrigger: {
              trigger: host,
              start: 'top top',
              end: scrollEnd,
              pin: true,
              scrub: 0.85,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onEnter: () => setPhase('cinematic'),
              onEnterBack: () => {
                setPhase('cinematic')
                resetToScrollTop()
              },
              onLeave: () => setPhase('commerce'),
              onLeaveBack: () => {
                setPhase('cinematic')
                resetToScrollTop()
              },
              onUpdate: (self) => {
                scrubVideo?.(self.progress)
                if (isCinematicScrollAtTop(self.progress)) {
                  applyCinematicHeroScrollStartState(host, firstSectionId)
                  setActiveSectionId(firstSectionId ?? null)
                  return
                }
                const idx = resolveActiveSectionIndex(self.progress, sectionCount)
                syncCinematicBeatStack(host, idx, sectionCount)
                setActiveSectionId(config.sections[idx]?.id ?? null)
              },
            },
          })

          config.sections.forEach((section, i) => {
            const beat = host.querySelector<HTMLElement>(
              `[data-cinematic-beat="${section.id}"]`,
            )
            const { inAt, outAt } = beats[i] ?? { inAt: 0, outAt: 1 }
            const isLast = i === sectionCount - 1
            bindSectionBeat(scene, beat, inAt, outAt, i === 0, isLast)
            if (beat) bindCopyLines(scene, beat, inAt, outAt, i === 0, isLast)
          })

          applyCinematicHeroScrollStartState(host, firstSectionId)
          setActiveSectionId(firstSectionId ?? null)

          const st = scene.scrollTrigger
          if (st?.isActive) {
            setPhase('cinematic')
          }
          if (st && isCinematicScrollAtTop(st.progress)) {
            scene.progress(0)
          }
        }, host)

        return () => {
          disposeScrollVideo?.()
          ctx.revert()
          setActiveSectionId(null)
        }
      })

      return () => {
        mm.revert()
      }
    },
    { scope: rootRef, dependencies: [sectionCount, config.scrollLength, config.backgroundMode] },
  )
}
