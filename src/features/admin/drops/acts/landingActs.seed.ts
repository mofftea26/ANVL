import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { DropLandingContent } from '../drops.types'
import type { LandingAct } from './landingActs.types'
import { mergeActAnimationConfig } from './landingActs.types'

/** Bootstrap `Drop.acts` from legacy landing sections when the acts array is empty. */
export function landingContentToSimpleActs(lc: DropLandingContent): LandingAct[] {
  const anim = mergeActAnimationConfig()
  return [
    {
      id: createCmsId('act'),
      nature: 'hero',
      preset: 'theOathCinematic',
      isEnabled: true,
      sortOrder: 0,
      title: lc.hero.title,
      subtitle: lc.hero.subtitle,
      eyebrow: lc.hero.badgeText,
      body: '',
      animation: anim,
      content: {
        primaryCta: lc.hero.primaryCta,
        secondaryCta: lc.hero.secondaryCta,
      },
    },
    {
      id: createCmsId('act'),
      nature: 'manifesto',
      preset: 'oathStampLedger',
      isEnabled: true,
      sortOrder: 1,
      title: lc.manifesto.heading,
      eyebrow: lc.manifesto.counterLabel,
      body: lc.manifesto.intro,
      animation: anim,
      content: {},
    },
    {
      id: createCmsId('act'),
      nature: 'dropReveal',
      preset: 'monolithReveal',
      isEnabled: true,
      sortOrder: 2,
      title: lc.dropReveal.tagline.slice(0, 120),
      subtitle: lc.dropReveal.counterLabel,
      eyebrow: lc.dropReveal.actLabel,
      body: lc.dropReveal.tagline,
      animation: anim,
      content: {},
    },
    {
      id: createCmsId('act'),
      nature: 'productShowcase',
      preset: 'threeCardEditorial',
      isEnabled: true,
      sortOrder: 3,
      title: `${lc.pieces.headingLineOne} ${lc.pieces.headingLineTwo}`.trim(),
      eyebrow: lc.pieces.actLabel,
      animation: anim,
      content: {},
    },
    {
      id: createCmsId('act'),
      nature: 'materialShowcase',
      preset: 'fabricRunway',
      isEnabled: true,
      sortOrder: 4,
      title: lc.materials.heading,
      subtitle: lc.materials.counterSuffix,
      eyebrow: lc.materials.actLabel,
      body: lc.materials.intro,
      animation: anim,
      content: {},
    },
    {
      id: createCmsId('act'),
      nature: 'newsletterWaitlist',
      preset: 'oathFullWidthForm',
      isEnabled: true,
      sortOrder: 5,
      title: lc.waitlist.heading,
      subtitle: lc.waitlist.rightLabel,
      eyebrow: lc.waitlist.actLabel,
      body: lc.waitlist.intro,
      animation: anim,
      content: {},
    },
  ]
}
