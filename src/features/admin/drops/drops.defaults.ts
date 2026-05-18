import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { Drop, DropLandingContent, DropVisuals } from './drops.types'
import { landingContentToSimpleActs } from '@/features/admin/drops/acts/landingActs.seed'
import { DROP_THEME_PRESETS } from './drops.presets'
import { defaultLandingActSequence } from './drops.actSequence'

export const DEFAULT_OATH_DROP_ID = 'drop_the-oath'

export const DEFAULT_OATH_PRODUCT_IDS = [
  'anvl-oversized-tee',
  'anvl-stringer',
  'anvl-compression-tee',
] as const

export const DEFAULT_EMBLEM_URL = '/brand/the-oath-shape.svg'

export function landingDefaultsToDropLandingContent(): DropLandingContent {
  const L = landingCmsDefaults
  return {
    hero: {
      actLabel: L.hero.actLabel,
      badgeText: L.hero.badgeText,
      title: L.hero.title,
      subtitle: L.hero.subtitle,
      primaryCta: { ...L.hero.primaryCta },
      secondaryCta: { ...L.hero.secondaryCta },
      meta: L.hero.meta.map((m) => ({ ...m })),
    },
    manifesto: {
      actLabel: L.manifesto.actLabel,
      counterLabel: L.manifesto.counterLabel,
      heading: L.manifesto.heading,
      intro: L.manifesto.intro,
      tenets: L.manifesto.tenets.map((t) => ({ ...t })),
    },
    dropReveal: {
      actLabel: L.dropReveal.actLabel,
      counterLabel: L.dropReveal.counterLabel,
      words: [...L.dropReveal.words],
      tagline: L.dropReveal.tagline,
      stats: L.dropReveal.stats.map((s) => ({ ...s })),
      primaryCta: { ...L.dropReveal.primaryCta },
      secondaryCta: { ...L.dropReveal.secondaryCta },
    },
    pieces: {
      actLabel: L.pieces.actLabel,
      headingLineOne: L.pieces.headingLineOne,
      headingLineTwo: L.pieces.headingLineTwo,
      viewAllLabel: L.pieces.viewAllLabel,
      viewAllHref: L.pieces.viewAllHref,
      footerLeftText: L.pieces.footerLeftText,
      footerLinkLabel: L.pieces.footerLinkLabel,
      footerLinkHref: L.pieces.footerLinkHref,
    },
    materials: {
      actLabel: L.materials.actLabel,
      counterSuffix: L.materials.counterSuffix,
      heading: L.materials.heading,
      intro: L.materials.intro,
      materials: L.materials.materials.map((m) => ({ ...m })),
    },
    waitlist: {
      actLabel: L.waitlist.actLabel,
      rightLabel: L.waitlist.rightLabel,
      heading: L.waitlist.heading,
      intro: L.waitlist.intro,
      bullets: L.waitlist.bullets.map((b) => ({ ...b })),
      form: { ...L.waitlist.form },
    },
  }
}

export function defaultDropVisuals(): DropVisuals {
  return {
    emblemImageUrl: DEFAULT_EMBLEM_URL,
    emblemAlt: 'ANVL oath emblem',
    loadingEmblemUrl: DEFAULT_EMBLEM_URL,
  }
}

export function createDefaultTheOathDrop(
  productIds: string[] = [...DEFAULT_OATH_PRODUCT_IDS],
  nowIso = new Date().toISOString(),
): Drop {
  const theme = structuredClone(DROP_THEME_PRESETS[0])
  const landingContent = landingDefaultsToDropLandingContent()
  return {
    id: DEFAULT_OATH_DROP_ID,
    slug: 'the-oath',
    name: 'The Oath',
    dropNumber: '01',
    title: 'The Oath',
    subtitle: 'Forged Under Pressure',
    description:
      'First ANVL launch drop featuring premium silhouettes built for serious lifters.',
    status: 'active',
    isActive: true,
    releaseDate: '2026-06-15T18:00:00.000Z',
    createdAt: nowIso,
    updatedAt: nowIso,
    theme,
    visuals: defaultDropVisuals(),
    landingContent,
    landingActSequence: defaultLandingActSequence(),
    acts: landingContentToSimpleActs(landingContent),
    productIds: [...productIds],
    seo: {
      title: landingCmsDefaults.seo.title,
      description: landingCmsDefaults.seo.description,
      ogTitle: landingCmsDefaults.seo.ogTitle,
      ogDescription: landingCmsDefaults.seo.ogDescription,
      ogImage: landingCmsDefaults.seo.ogImage,
    },
  }
}

export function createEmptyDrop(nowIso = new Date().toISOString()): Drop {
  const oath = createDefaultTheOathDrop([], nowIso)
  const id = createCmsId('drop')
  return {
    ...oath,
    id,
    slug: id.replace(/^drop-/, ''),
    name: 'Untitled drop',
    dropNumber: String(Math.floor(Math.random() * 90) + 10),
    title: 'NEW DROP',
    subtitle: 'Subtitle',
    description: '',
    status: 'draft',
    isActive: false,
    productIds: [],
    acts: landingContentToSimpleActs(oath.landingContent),
    seo: {
      title: 'ANVL Athletics',
      description: '',
    },
  }
}
