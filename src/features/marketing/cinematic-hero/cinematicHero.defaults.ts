import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { DropLandingContent } from '@/features/admin/drops/drops.types'
import { BRAND_HERO_ASSET_PATHS, BRAND_EMBLEM_ASSETS } from '@/features/marketing/default-landing/brandShowcaseAssets'
import type { CinematicConfig, CinematicHeroSection } from './cinematicHero.types'

function section(
  partial: Omit<CinematicHeroSection, 'id' | 'isEnabled' | 'sortOrder'> & { sortOrder: number },
): CinematicHeroSection {
  return { id: createCmsId('csec'), isEnabled: true, ...partial }
}

export function defaultCinematicHeroSections(lc: DropLandingContent): CinematicHeroSection[] {
  return [
    section({
      sortOrder: 0,
      title: 'Hero intro',
      eyebrow: lc.hero.badgeText || 'Drop 01',
      heading: lc.hero.title,
      body: lc.hero.subtitle,
      background: {
        videoUrl: BRAND_HERO_ASSET_PATHS.warriorVideo,
        imageUrl: BRAND_HERO_ASSET_PATHS.warrior,
        overlayIntensity: 0.45,
      },
      emblemSrc: BRAND_EMBLEM_ASSETS.stacked,
      buttons: [
        { label: lc.hero.primaryCta.label, href: lc.hero.primaryCta.href, variant: 'primary' },
        { label: lc.hero.secondaryCta.label, href: lc.hero.secondaryCta.href, variant: 'outline' },
      ],
      animationPreset: 'fadeUp',
      textPosition: 'center',
      visualPosition: 'center',
      mobileBehavior: 'stack',
    }),
    section({
      sortOrder: 1,
      title: 'Manifesto punch',
      eyebrow: lc.manifesto.counterLabel,
      heading: lc.manifesto.heading,
      body: lc.manifesto.intro,
      emblemSrc: BRAND_EMBLEM_ASSETS.oath,
      animationPreset: 'bleedIn',
      textPosition: 'center',
      visualPosition: 'center',
      mobileBehavior: 'stack',
    }),
    section({
      sortOrder: 2,
      title: 'Product tease',
      eyebrow: lc.pieces.actLabel,
      heading: `${lc.pieces.headingLineOne} ${lc.pieces.headingLineTwo}`.trim(),
      body: lc.pieces.footerLeftText,
      buttons: [
        { label: lc.pieces.viewAllLabel, href: lc.pieces.viewAllHref, variant: 'primary' },
      ],
      animationPreset: 'depthReveal',
      textPosition: 'center',
      visualPosition: 'center',
      mobileBehavior: 'simplified',
    }),
    section({
      sortOrder: 3,
      title: 'Closing CTA',
      eyebrow: 'Drop 01',
      heading: lc.dropReveal.tagline.slice(0, 80),
      body: lc.waitlist.intro,
      emblemSrc: BRAND_EMBLEM_ASSETS.wordmark,
      buttons: [
        { label: lc.dropReveal.primaryCta.label, href: lc.dropReveal.primaryCta.href, variant: 'primary' },
        { label: lc.dropReveal.secondaryCta.label, href: lc.dropReveal.secondaryCta.href, variant: 'ghost' },
      ],
      animationPreset: 'forgeClose',
      textPosition: 'center',
      visualPosition: 'center',
      mobileBehavior: 'stack',
    }),
  ]
}

export function defaultCinematicConfig(lc: DropLandingContent): CinematicConfig {
  return {
    enabled: true,
    scrollLength: 'standard',
    navMode: 'auto',
    backgroundMode: 'video',
    reducedMotionFallback: { mode: 'stack', showAllSections: true },
    sections: defaultCinematicHeroSections(lc),
  }
}
