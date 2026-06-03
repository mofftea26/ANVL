import { lazy, type JSX, type LazyExoticComponent } from 'react'
import { resolvePresetAlias } from './actPresetAliases'
import {
  LANDING_ACT_NATURES,
  type ActPresetEntry,
  type ActPresetProps,
  type LandingActNature,
} from './types'

function lazyPreset(
  loader: () => Promise<{ [key: string]: (props: ActPresetProps) => JSX.Element | null }>,
  exportName: string,
): LazyExoticComponent<(props: ActPresetProps) => JSX.Element | null> {
  return lazy(async () => {
    const mod = await loader()
    const Component = mod[exportName]
    if (!Component) {
      throw new Error(`Act preset export "${exportName}" not found`)
    }
    return { default: Component }
  })
}

/** Default oath preset per nature. */
export const DEFAULT_ACT_PRESETS: Record<LandingActNature, string> = {
  hero: 'cinematicScrollHero',
  manifesto: 'oathTenetLedger',
  storytelling: 'oathNarrativeScroll',
  dropReveal: 'oathMonolithReveal',
  productShowcase: 'oathEditorialThree',
  materialShowcase: 'oathMaterialFlip',
  specialEvent: 'oathEventPulse',
  lookbook: 'masonryLookbook',
  finalCTA: 'oathForgeClose',
}

const ENTRIES: ActPresetEntry[] = [
  {
    nature: 'hero',
    preset: 'standardHero',
    label: 'Standard hero',
    component: lazyPreset(
      () => import('./hero/MinimalEmblemHero'),
      'MinimalEmblemHeroPreset',
    ),
  },
  {
    nature: 'hero',
    preset: 'editorialHero',
    label: 'Editorial hero',
    component: lazyPreset(
      () => import('./hero/TheOathCinematic'),
      'TheOathCinematicPreset',
    ),
  },
  {
    nature: 'hero',
    preset: 'productHero',
    label: 'Product hero',
    component: lazyPreset(
      () => import('./hero/SplitProductHero'),
      'SplitProductHeroPreset',
    ),
  },
  {
    nature: 'hero',
    preset: 'cinematicScrollHero',
    label: 'Cinematic scroll hero',
    component: lazyPreset(
      () => import('../cinematic-hero/CinematicScrollHero'),
      'CinematicScrollHeroPreset',
    ),
  },
  {
    nature: 'manifesto',
    preset: 'oathTenetLedger',
    label: 'Oath tenet ledger',
    component: lazyPreset(
      () => import('./manifesto/OathTenetLedger'),
      'OathTenetLedgerPreset',
    ),
  },
  {
    nature: 'storytelling',
    preset: 'oathNarrativeScroll',
    label: 'Oath narrative scroll',
    component: lazyPreset(
      () => import('./storytelling/OathNarrativeScroll'),
      'OathNarrativeScrollPreset',
    ),
  },
  {
    nature: 'dropReveal',
    preset: 'oathMonolithReveal',
    label: 'Oath monolith reveal',
    component: lazyPreset(
      () => import('./dropReveal/OathMonolithReveal'),
      'OathMonolithRevealPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathEditorialThree',
    label: 'Editorial grid',
    component: lazyPreset(
      () => import('./productShowcase/OathEditorialThree'),
      'OathEditorialThreePreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathBannerShowcase',
    label: 'Kingdom banners',
    component: lazyPreset(
      () => import('./productShowcase/OathBannerShowcase'),
      'OathBannerShowcasePreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathProductCarousel',
    label: 'Shop carousel',
    component: lazyPreset(
      () => import('./productShowcase/OathProductCarousel'),
      'OathProductCarouselPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathSpotlightRow',
    label: 'Spotlight row',
    component: lazyPreset(
      () => import('./productShowcase/OathSpotlightRow'),
      'OathSpotlightRowPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathProductRail',
    label: 'Product rail (legacy)',
    component: lazyPreset(
      () => import('./productShowcase/OathProductRail'),
      'OathProductRailPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'oathHeroProduct',
    label: 'Hero product',
    component: lazyPreset(
      () => import('./productShowcase/OathHeroProduct'),
      'OathHeroProductPreset',
    ),
  },
  {
    nature: 'materialShowcase',
    preset: 'oathMaterialFlip',
    label: 'Material flip cards',
    component: lazyPreset(
      () => import('./materialShowcase/OathMaterialFlip'),
      'OathMaterialFlipPreset',
    ),
  },
  {
    nature: 'specialEvent',
    preset: 'oathEventPulse',
    label: 'Oath event pulse',
    component: lazyPreset(
      () => import('./specialEvent/OathEventPulse'),
      'OathEventPulsePreset',
    ),
  },
  {
    nature: 'lookbook',
    preset: 'masonryLookbook',
    label: 'Masonry lookbook',
    component: lazyPreset(
      () => import('./lookbook/MasonryLookbook'),
      'MasonryLookbookPreset',
    ),
  },
  {
    nature: 'finalCTA',
    preset: 'oathForgeClose',
    label: 'Oath forge close',
    component: lazyPreset(
      () => import('./finalCTA/OathForgeClose'),
      'OathForgeClosePreset',
    ),
  },
]

const REGISTRY = new Map<string, ActPresetEntry>(
  ENTRIES.map((entry) => [`${entry.nature}:${entry.preset}`, entry]),
)

export function isLandingActNature(nature: string): nature is LandingActNature {
  return (LANDING_ACT_NATURES as readonly string[]).includes(nature)
}

export function resolveActPreset(
  nature: string,
  preset?: string,
): ActPresetEntry | null {
  if (!isLandingActNature(nature)) return null

  const requested = resolvePresetAlias(preset?.trim())
  if (requested) {
    const hit = REGISTRY.get(`${nature}:${requested}`)
    if (hit) return hit
  }

  const fallbackPreset = DEFAULT_ACT_PRESETS[nature]
  return REGISTRY.get(`${nature}:${fallbackPreset}`) ?? null
}

export function listActPresetsForNature(nature: LandingActNature): ActPresetEntry[] {
  return ENTRIES.filter((entry) => entry.nature === nature)
}

export const ACT_PRESETS_BY_NATURE = LANDING_ACT_NATURES.reduce(
  (acc, nature) => {
    acc[nature] = listActPresetsForNature(nature).map((entry) => entry.preset)
    return acc
  },
  {} as Record<LandingActNature, readonly string[]>,
)

function humanizePresetId(preset: string): string {
  const spaced = preset
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function getActPresetLabel(nature: string, preset: string): string {
  const id = resolvePresetAlias(preset.trim()) ?? preset.trim()
  if (!id) return 'Default'
  const hit = REGISTRY.get(`${nature}:${id}`)
  if (hit) return hit.label
  return humanizePresetId(id)
}

export { ENTRIES as ACT_PRESET_ENTRIES }
