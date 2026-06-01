import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import { resolvePresetAlias } from '@/features/marketing/act-presets/actPresetAliases'
import type { Drop, DropLandingContent } from './drops.types'
import type { WebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.types'
import type { LandingAct } from './acts/landingActs.types'
import {
  DEFAULT_EMBLEM_URL,
  DEFAULT_OATH_DROP_ID,
  DEFAULT_OATH_PRODUCT_IDS,
  defaultDropVisuals,
} from './drops.defaults'
import { DROP_THEME_PRESETS } from './drops.presets'
import { defaultLandingActSequence } from './drops.actSequence'

function slugFromLanding(landing: LandingPageCmsContent): string {
  const href = landing.hero.primaryCta.href
  if (href.startsWith('/drop/'))
    return href.replace('/drop/', '').split('/')[0] ?? 'the-oath'
  return 'the-oath'
}

export function landingPageToDropLandingContent(
  landing: LandingPageCmsContent,
): DropLandingContent {
  const L = landing
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

export function landingNavigationToWebsiteLayout(
  landing: LandingPageCmsContent,
  nowIso: string,
): WebsiteLayoutContent {
  const nav = landing.navigation
  return {
    version: 1,
    updatedAt: nowIso,
    header: {
      cartVisible: true,
      announcement: { enabled: false, message: '', href: '' },
      headerLinks: nav.headerLinks.map((l) => ({ ...l })),
      mobileExtraLinks: [],
    },
    footer: {
      decorativeEmblemFallbackSrc: DEFAULT_EMBLEM_URL,
      tagline: nav.footerTagline,
      microCaption: nav.footerMicroCaption,
      linkGroups: [
        {
          id: 'footer-main',
          links: nav.footerLinks.map((l) => ({ ...l })),
        },
      ],
      newsletterTitle: nav.newsletterTitle,
      newsletterPlaceholder: nav.newsletterPlaceholder,
      newsletterButtonText: nav.newsletterButtonText,
      socialLinks: [
        { id: 'soc-ig', label: 'Instagram', href: '#' },
        { id: 'soc-tt', label: 'TikTok', href: '#' },
      ],
      copyrightText: 'ANVL Athletics. All rights reserved.',
    },
  }
}

export function landingPageToDrop(landing: LandingPageCmsContent): Drop {
  const nowIso = new Date().toISOString()
  const slug = slugFromLanding(landing)
  const emblemSrc =
    landing.dropReveal.dropIcon.src.trim() || DEFAULT_EMBLEM_URL
  const lc = landingPageToDropLandingContent(landing)

  return {
    id: DEFAULT_OATH_DROP_ID,
    slug,
    name: landing.hero.badgeText || 'The Oath',
    dropNumber: '01',
    title: 'The Oath',
    subtitle: landing.hero.subtitle.slice(0, 120),
    description: landing.manifesto.intro,
    status: 'active',
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    theme: structuredClone(DROP_THEME_PRESETS[0]),
    visuals: {
      ...defaultDropVisuals(),
      emblemImageUrl: emblemSrc,
      emblemAlt:
        landing.dropReveal.dropIcon.alt || defaultDropVisuals().emblemAlt,
      loadingEmblemUrl: emblemSrc,
    },
    landingContent: lc,
    landingActSequence: defaultLandingActSequence(),
    acts: [],
    productIds: [...DEFAULT_OATH_PRODUCT_IDS],
    seo: {
      title: landing.seo.title,
      description: landing.seo.description,
      ogTitle: landing.seo.ogTitle,
      ogDescription: landing.seo.ogDescription,
      ogImage: landing.seo.ogImage,
    },
  }
}

const REMOVED_NATURES = new Set(['lookbook', 'newsletterWaitlist'])

const NATURE_ALIASES: Record<string, string> = {
  newsletterWaitlist: 'finalCTA',
}

function migrateAct(act: LandingAct): LandingAct {
  const nature = NATURE_ALIASES[act.nature] ?? act.nature
  const preset = resolvePresetAlias(act.preset) ?? act.preset
  return { ...act, nature, preset }
}

export function migrateDropActs(drop: Drop): Drop {
  let acts = drop.acts ?? []
  acts = acts
    .filter((a) => !REMOVED_NATURES.has(a.nature))
    .map((act) => migrateAct(act))

  const hadWaitlist = (drop.acts ?? []).some(
    (a) => a.nature === 'newsletterWaitlist' || a.preset?.includes('waitlist'),
  )
  const hasFinal = acts.some((a) => a.nature === 'finalCTA')
  if (hadWaitlist && !hasFinal) {
    const wait = (drop.acts ?? []).find((a) => a.nature === 'newsletterWaitlist')
    if (wait) {
      acts.push({
        ...migrateAct({ ...wait, nature: 'finalCTA', preset: 'oathForgeClose' }),
        sortOrder: Math.max(...acts.map((a) => a.sortOrder), 0) + 1,
      })
    }
  }

  acts = acts
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a, i) => ({ ...a, sortOrder: i }))

  return { ...drop, acts }
}

export function migrateDrop(drop: Drop): Drop {
  return migrateDropActs(drop)
}
