import { useLayoutEffect, useRef } from 'react'
import { useCinematicHeroPhaseStore } from './cinematicHeroPhase.store'
import type { CinematicConfig } from './cinematicHero.types'
import { CinematicHeroBackground } from './CinematicHeroBackground'
import { CinematicHeroReducedStack, CinematicHeroSectionView } from './CinematicHeroSectionView'
import { useCinematicHeroTimeline } from './useCinematicHeroTimeline'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'

type CinematicHeroRootProps = {
  config: CinematicConfig
}

export function CinematicHeroRoot({ config }: CinematicHeroRootProps) {
  const rootRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const store = useCinematicHeroPhaseStore.getState()
    store.setNavMode(config.navMode)
    store.setSections(config.sections)
    store.setPhase('cinematic')
    store.setActiveSectionId(config.sections[0]?.id ?? null)
    return () => store.reset()
  }, [config.navMode, config.sections.length, config.sections.map((s) => s.id).join('|')])

  useCinematicHeroTimeline(rootRef, config)

  if (!config.enabled || config.sections.length === 0) {
    return null
  }

  return (
    <section
      ref={rootRef}
      data-cinematic-hero-root
      className="relative isolate bg-[var(--color-bg)]"
      aria-label="Cinematic hero"
    >
      <CinematicHeroBackground config={config} />
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06]">
        <GrainOverlay />
      </div>

      <div
        data-cinematic-stage
        className="relative z-10 hidden h-[100svh] w-full md:block"
      >
        {config.sections.map((section, index) => (
          <CinematicHeroSectionView
            key={section.id}
            section={section}
            isFirst={index === 0}
          />
        ))}
      </div>

      <CinematicHeroReducedStack sections={config.sections} />
    </section>
  )
}
