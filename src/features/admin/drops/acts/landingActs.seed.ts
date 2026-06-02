import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import { defaultCinematicConfig } from '@/features/marketing/cinematic-hero/cinematicHero.defaults'
import type { DropLandingContent } from '../drops.types'
import type { LandingAct } from './landingActs.types'
import { mergeActAnimationConfig } from './landingActs.types'

/** Bootstrap `Drop.acts` — Oath sequence with cinematic hero + lookbook (8 acts). */
export function landingContentToSimpleActs(lc: DropLandingContent): LandingAct[] {
  const anim = mergeActAnimationConfig()
  const L = landingCmsDefaults

  const tenets = lc.manifesto.tenets.map((t) => ({
    id: t.id,
    label: ('text' in t && typeof t.text === 'string' ? t.text : '') || t.id,
  }))

  return [
    {
      id: createCmsId('act'),
      nature: 'hero',
      preset: 'cinematicScrollHero',
      isEnabled: true,
      sortOrder: 0,
      title: lc.hero.title,
      subtitle: lc.hero.subtitle,
      eyebrow: lc.hero.badgeText,
      body: '',
      animation: anim,
      content: { cinematicConfig: defaultCinematicConfig(lc) },
      media: { imageUrl: '', videoUrl: '', alt: '' },
    },
    {
      id: createCmsId('act'),
      nature: 'manifesto',
      preset: 'oathTenetLedger',
      isEnabled: true,
      sortOrder: 1,
      title: lc.manifesto.heading,
      eyebrow: lc.manifesto.counterLabel,
      animation: anim,
      content: { tenets },
    },
    {
      id: createCmsId('act'),
      nature: 'storytelling',
      preset: 'oathNarrativeScroll',
      isEnabled: true,
      sortOrder: 2,
      title: lc.manifesto.heading,
      eyebrow: 'Story',
      animation: anim,
      content: {
        chapters: [
          {
            id: 'ch-1',
            title: 'Forged under pressure',
            body: lc.manifesto.intro,
          },
        ],
      },
    },
    {
      id: createCmsId('act'),
      nature: 'dropReveal',
      preset: 'oathMonolithReveal',
      isEnabled: true,
      sortOrder: 3,
      title: lc.dropReveal.tagline.slice(0, 120),
      subtitle: lc.dropReveal.counterLabel,
      eyebrow: lc.dropReveal.actLabel,
      animation: anim,
      content: {},
    },
    {
      id: createCmsId('act'),
      nature: 'productShowcase',
      preset: 'oathEditorialThree',
      isEnabled: true,
      sortOrder: 4,
      title: `${lc.pieces.headingLineOne} ${lc.pieces.headingLineTwo}`.trim(),
      eyebrow: lc.pieces.actLabel,
      animation: anim,
      content: {
        viewAllLabel: lc.pieces.viewAllLabel,
        viewAllHref: lc.pieces.viewAllHref,
      },
    },
    {
      id: createCmsId('act'),
      nature: 'materialShowcase',
      preset: 'oathMaterialFlip',
      isEnabled: true,
      sortOrder: 5,
      title: lc.materials.heading,
      subtitle: lc.materials.counterSuffix,
      eyebrow: lc.materials.actLabel,
      animation: anim,
      content: { materialProducts: [] },
    },
    {
      id: createCmsId('act'),
      nature: 'lookbook',
      preset: 'masonryLookbook',
      isEnabled: true,
      sortOrder: 6,
      title: 'Campaign lookbook',
      eyebrow: 'The Oath',
      animation: anim,
      content: {
        galleryItems: [
          { src: '/brand/lookbook-1.webp', caption: 'Forged silhouette', alt: 'Athlete in ANVL tee' },
          { src: '/brand/lookbook-2.webp', caption: 'Pressure tested', alt: 'Gym floor stance' },
        ],
      },
    },
    {
      id: createCmsId('act'),
      nature: 'finalCTA',
      preset: 'oathForgeClose',
      isEnabled: true,
      sortOrder: 7,
      title: L.waitlist.heading,
      subtitle: L.waitlist.rightLabel,
      eyebrow: 'Close',
      animation: anim,
      content: {
        primaryCta: lc.dropReveal.primaryCta,
        secondaryCta: lc.dropReveal.secondaryCta,
      },
    },
  ]
}
