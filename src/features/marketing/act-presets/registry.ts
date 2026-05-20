import { lazy, type JSX, type LazyExoticComponent } from 'react'
import type { ActPresetEntry, ActPresetProps, LandingActNature } from './types'

function lazyPreset(
  loader: () => Promise<{ [key: string]: (props: ActPresetProps) => JSX.Element }>,
  exportName: string,
): LazyExoticComponent<(props: ActPresetProps) => JSX.Element> {
  return lazy(async () => {
    const mod = await loader()
    const Component = mod[exportName]
    if (!Component) {
      throw new Error(`Act preset export "${exportName}" not found`)
    }
    return { default: Component }
  })
}

/** Default preset id per nature — matches CMS builder + landing slot seeds. */
export const DEFAULT_ACT_PRESETS: Record<LandingActNature, string> = {
  hero: 'theOathCinematic',
  manifesto: 'oathStampLedger',
  storytelling: 'chapterScroll',
  dropReveal: 'monolithReveal',
  productShowcase: 'threeCardEditorial',
  materialShowcase: 'fabricRunway',
  newsletterWaitlist: 'oathFullWidthForm',
}

const ENTRIES: ActPresetEntry[] = [
  {
    nature: 'hero',
    preset: 'theOathCinematic',
    label: 'The Oath cinematic',
    component: lazyPreset(
      () => import('./hero/TheOathCinematic'),
      'TheOathCinematicPreset',
    ),
  },
  {
    nature: 'hero',
    preset: 'splitProduct',
    label: 'Split product hero',
    component: lazyPreset(
      () => import('./hero/SplitProductHero'),
      'SplitProductHeroPreset',
    ),
  },
  {
    nature: 'hero',
    preset: 'minimalEmblem',
    label: 'Minimal emblem hero',
    component: lazyPreset(
      () => import('./hero/MinimalEmblemHero'),
      'MinimalEmblemHeroPreset',
    ),
  },
  {
    nature: 'manifesto',
    preset: 'oathStampLedger',
    label: 'Oath stamp ledger',
    component: lazyPreset(
      () => import('./manifesto/OathStampLedger'),
      'OathStampLedgerPreset',
    ),
  },
  {
    nature: 'manifesto',
    preset: 'splitText',
    label: 'Split text manifesto',
    component: lazyPreset(
      () => import('./manifesto/SplitTextManifesto'),
      'SplitTextManifestoPreset',
    ),
  },
  {
    nature: 'manifesto',
    preset: 'scrollStacked',
    label: 'Scroll stacked manifesto',
    component: lazyPreset(
      () => import('./manifesto/ScrollStackedManifesto'),
      'ScrollStackedManifestoPreset',
    ),
  },
  {
    nature: 'storytelling',
    preset: 'chapterScroll',
    label: 'Chapter scroll',
    component: lazyPreset(
      () => import('./storytelling/ChapterScroll'),
      'ChapterScrollPreset',
    ),
  },
  {
    nature: 'storytelling',
    preset: 'editorialArticle',
    label: 'Editorial article',
    component: lazyPreset(
      () => import('./storytelling/EditorialArticle'),
      'EditorialArticlePreset',
    ),
  },
  {
    nature: 'storytelling',
    preset: 'imageLed',
    label: 'Image-led story',
    component: lazyPreset(
      () => import('./storytelling/ImageLedStory'),
      'ImageLedStoryPreset',
    ),
  },
  {
    nature: 'dropReveal',
    preset: 'monolithReveal',
    label: 'Monolith reveal',
    component: lazyPreset(
      () => import('./dropReveal/MonolithReveal'),
      'MonolithRevealPreset',
    ),
  },
  {
    nature: 'dropReveal',
    preset: 'countdownTrio',
    label: 'Countdown trio',
    component: lazyPreset(
      () => import('./dropReveal/CountdownTrioReveal'),
      'CountdownTrioRevealPreset',
    ),
  },
  {
    nature: 'dropReveal',
    preset: 'emblemFirst',
    label: 'Emblem first reveal',
    component: lazyPreset(
      () => import('./dropReveal/EmblemFirstReveal'),
      'EmblemFirstRevealPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'threeCardEditorial',
    label: 'Three card editorial',
    component: lazyPreset(
      () => import('./productShowcase/ThreeCardEditorial'),
      'ThreeCardEditorialPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'gridSix',
    label: 'Grid six (legacy alias)',
    component: lazyPreset(
      () => import('./productShowcase/ThreeCardEditorial'),
      'ThreeCardEditorialPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'carousel',
    label: 'Product carousel',
    component: lazyPreset(
      () => import('./productShowcase/ProductCarousel'),
      'ProductCarouselPreset',
    ),
  },
  {
    nature: 'productShowcase',
    preset: 'productStory',
    label: 'Product story',
    component: lazyPreset(
      () => import('./productShowcase/ProductStory'),
      'ProductStoryPreset',
    ),
  },
  {
    nature: 'materialShowcase',
    preset: 'fabricRunway',
    label: 'Fabric runway',
    component: lazyPreset(
      () => import('./materialShowcase/FabricRunway'),
      'FabricRunwayPreset',
    ),
  },
  {
    nature: 'materialShowcase',
    preset: 'specsGrid',
    label: 'Specs grid',
    component: lazyPreset(
      () => import('./materialShowcase/SpecsGridMaterials'),
      'SpecsGridMaterialsPreset',
    ),
  },
  {
    nature: 'materialShowcase',
    preset: 'splitDetail',
    label: 'Split detail',
    component: lazyPreset(
      () => import('./materialShowcase/SplitDetailMaterials'),
      'SplitDetailMaterialsPreset',
    ),
  },
  {
    nature: 'newsletterWaitlist',
    preset: 'oathFullWidthForm',
    label: 'Oath full-width form',
    component: lazyPreset(
      () => import('./newsletterWaitlist/OathFullWidthForm'),
      'OathFullWidthFormPreset',
    ),
  },
  {
    nature: 'newsletterWaitlist',
    preset: 'minimalForm',
    label: 'Minimal form',
    component: lazyPreset(
      () => import('./newsletterWaitlist/MinimalWaitlistForm'),
      'MinimalWaitlistFormPreset',
    ),
  },
  {
    nature: 'newsletterWaitlist',
    preset: 'splitForm',
    label: 'Split form',
    component: lazyPreset(
      () => import('./newsletterWaitlist/SplitWaitlistForm'),
      'SplitWaitlistFormPreset',
    ),
  },
]

const REGISTRY = new Map<string, ActPresetEntry>(
  ENTRIES.map((entry) => [`${entry.nature}:${entry.preset}`, entry]),
)

export function isLandingActNature(nature: string): nature is LandingActNature {
  return nature in DEFAULT_ACT_PRESETS
}

export function resolveActPreset(
  nature: string,
  preset?: string,
): ActPresetEntry | null {
  if (!isLandingActNature(nature)) return null

  const requested = preset?.trim()
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

export { ENTRIES as ACT_PRESET_ENTRIES }
