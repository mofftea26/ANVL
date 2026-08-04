import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { cn } from '@/shared/lib/cn'
import type { PassportEffectKey, PassportEffectProps } from './effectTypes'

/**
 * Lazy registry + host for the per-section passport effects.
 *
 * One effect is mounted at a time — the active section's — keyed so switching
 * sections unmounts the old effect (its cleanup runs) before the next mounts.
 * Each entry is its own `lazy()` import, so a visitor only ever downloads the
 * effects for sections they actually open, and the blueprint's three.js chunk
 * stays out of every other section's path.
 *
 * Every section owns its own effect — `forge-notes` used to borrow the story's
 * (a letterless "marginalia" variant keyed off `sectionKey`) and read as a
 * weaker copy of it, because it was one. It has its own revision-stack effect
 * since 2026-08-04; the mapping here is 1:1, with no shared variants left.
 */
const EFFECTS: Record<PassportEffectKey, LazyExoticComponent<ComponentType<PassportEffectProps>>> =
  {
    piece: lazy(() => import('./sections/EffectPiece')),
    material: lazy(() => import('./sections/EffectMaterial')),
    blueprint: lazy(() => import('./sections/EffectBlueprint')),
    specs: lazy(() => import('./sections/EffectSpecs')),
    details: lazy(() => import('./sections/EffectDetails')),
    care: lazy(() => import('./sections/EffectCare')),
    fit: lazy(() => import('./sections/EffectFit')),
    story: lazy(() => import('./sections/EffectStory')),
    'forge-notes': lazy(() => import('./sections/EffectForgeNotes')),
    origin: lazy(() => import('./sections/EffectOrigin')),
    authenticity: lazy(() => import('./sections/EffectAuthenticity')),
    armory: lazy(() => import('./sections/EffectArmory')),
  }

/**
 * The positioned, inert layer an effect draws in.
 *
 * `pointer-events-none` is non-negotiable: hotspot buttons and the armory's
 * controls live under these layers, and an effect may never eat a tap. The
 * sheet tier clips (the mobile image box is rounded and small); the console
 * lets the composition breathe past the stage edge — measurement ticks and
 * ember drift reading as part of the room, not a texture inside a box.
 */
export function PassportSectionEffectLayer({
  sectionKey,
  imageUrl,
  tier,
  facts,
}: PassportEffectProps) {
  const Effect = EFFECTS[sectionKey]
  return (
    <div
      aria-hidden="true"
      data-pp-effect={sectionKey}
      className={cn(
        'pointer-events-none absolute inset-0 z-[1]',
        tier === 'sheet' && 'overflow-hidden',
      )}
    >
      <Suspense fallback={null}>
        <Effect
          key={sectionKey}
          sectionKey={sectionKey}
          imageUrl={imageUrl}
          tier={tier}
          facts={facts}
        />
      </Suspense>
    </div>
  )
}
