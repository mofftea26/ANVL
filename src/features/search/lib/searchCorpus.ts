import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveAboutContent } from '@/features/about/content/resolveAboutContent'
import { getPdpProductContent } from '@/features/cms/pdpContent/pdpContent.zod'
import { stripAngleBracketTags } from '@/shared/lib/stripAngleBracketTags'
import type { SearchDocument } from '@/features/search/types/search.types'

/** Routes with no CMS body copy — curated by hand since there's nothing to index. */
function staticPageDoc(id: string, title: string, body: string, path: string): SearchDocument {
  return { id, type: 'static-page', title, body, url: path, meta: { path } }
}

const STATIC_PAGE_DOCS: SearchDocument[] = [
  staticPageDoc('page-shop', 'Shop', 'The Armory — Drop 01 The Oath product catalog', '/shop'),
  staticPageDoc('page-story', 'The Saga', 'Chapters, acts, and the army roster', '/story'),
  staticPageDoc('page-about', 'About', 'The House of ANVL — brand story', '/about'),
  staticPageDoc('page-cart', 'Cart', 'Your shopping cart', '/cart'),
  staticPageDoc('page-account', 'Account', 'Orders, addresses, profile settings', '/account'),
  staticPageDoc('page-size-guide', 'Size Guide', 'Measurements and fit notes', '/size-guide'),
  staticPageDoc('page-care-guide', 'Care Guide', 'How to care for ANVL garments', '/care-guide'),
  staticPageDoc('page-contact', 'Contact', 'Get in touch with ANVL', '/contact'),
  staticPageDoc('page-faq', 'FAQ', 'Frequently asked questions', '/faq'),
  staticPageDoc('page-returns', 'Returns', 'Return and exchange policy', '/returns'),
]

const PDP_TILE_FIELDS: { key: 'storyHeading' | 'storyBody' | 'materialTitle' | 'materialNote'; hash: string; label: string }[] = [
  { key: 'storyHeading', hash: 'pdp-story', label: 'Story' },
  { key: 'storyBody', hash: 'pdp-story', label: 'Story' },
  { key: 'materialTitle', hash: 'pdp-materials', label: 'Material' },
  { key: 'materialNote', hash: 'pdp-materials', label: 'Material' },
]

function clean(text: string): string {
  return stripAngleBracketTags(text).trim()
}

async function buildProductDocs(): Promise<SearchDocument[]> {
  const { items } = await runtimeClients.commerce.getShopListingCatalog()
  return items.map((p) => ({
    id: `product-${p.slug}`,
    type: 'product' as const,
    title: p.name,
    subtitle: p.dropName,
    body: clean(
      [p.dropName, p.role, p.fit, p.fabric, p.storytelling, ...p.designDetails, ...p.careInstructions].join(' '),
    ),
    url: `/shop/${p.slug}`,
    meta: { slug: p.slug },
  }))
}

async function buildPdpTileDocs(): Promise<SearchDocument[]> {
  const [{ items }, projection] = await Promise.all([
    runtimeClients.commerce.getShopListingCatalog(),
    loadStorefrontProjection(),
  ])
  const docs: SearchDocument[] = []
  for (const product of items) {
    const content = getPdpProductContent(projection.pdpContent, product.slug)
    const seenHashes = new Set<string>()
    for (const field of PDP_TILE_FIELDS) {
      const text = clean(content[field.key])
      if (!text || seenHashes.has(field.hash)) continue
      seenHashes.add(field.hash)
      docs.push({
        id: `pdp-${product.slug}-${field.hash}`,
        type: 'pdp-tile',
        title: `${product.name} — ${field.label}`,
        subtitle: product.name,
        body: text,
        url: `/shop/${product.slug}#${field.hash}`,
        meta: { slug: product.slug, hash: field.hash },
      })
    }
    const care = content.care.map(clean).filter(Boolean)
    if (care.length > 0) {
      docs.push({
        id: `pdp-${product.slug}-pdp-care`,
        type: 'pdp-tile',
        title: `${product.name} — Care`,
        subtitle: product.name,
        body: care.join(' '),
        url: `/shop/${product.slug}#pdp-care`,
        meta: { slug: product.slug, hash: 'pdp-care' },
      })
    }
    const details = content.designDetails.map(clean).filter(Boolean)
    if (details.length > 0) {
      docs.push({
        id: `pdp-${product.slug}-pdp-details`,
        type: 'pdp-tile',
        title: `${product.name} — Forged Details`,
        subtitle: product.name,
        body: details.join(' '),
        url: `/shop/${product.slug}#pdp-details`,
        meta: { slug: product.slug, hash: 'pdp-details' },
      })
    }
  }
  return docs
}

async function buildStoryDocs(): Promise<SearchDocument[]> {
  const chapters = await runtimeClients.story.getPublishedChapters()
  const docs: SearchDocument[] = []
  for (const chapter of chapters) {
    docs.push({
      id: `story-chapter-${chapter.slug}`,
      type: 'story-chapter',
      title: chapter.title,
      subtitle: chapter.dropLabel || chapter.subtitle,
      body: clean([chapter.subtitle, chapter.description].join(' ')),
      url: `/story?chapter=${chapter.slug}`,
      meta: { chapterSlug: chapter.slug },
    })
    for (const act of chapter.acts) {
      docs.push({
        id: `story-act-${act.id}`,
        type: 'story-act',
        title: act.title,
        subtitle: chapter.title,
        body: clean(act.story),
        url: `/story?chapter=${chapter.slug}&act=${act.id}`,
        meta: { chapterSlug: chapter.slug, actId: act.id },
      })
    }
    for (const member of chapter.cast) {
      docs.push({
        id: `story-cast-${member.id}`,
        type: 'story-cast',
        title: member.name,
        subtitle: `${member.rank} · ${chapter.title}`,
        body: clean(member.blurb),
        url: `/story?chapter=${chapter.slug}`,
        meta: { chapterSlug: chapter.slug },
      })
    }
  }
  return docs
}

async function buildAboutDocs(): Promise<SearchDocument[]> {
  const projection = await loadStorefrontProjection()
  const content = resolveAboutContent(projection.landingContent.about)
  return content.orbs.map((orb) => ({
    id: `about-orb-${orb.id}`,
    type: 'about-orb' as const,
    title: orb.title,
    subtitle: orb.label,
    body: clean(
      [
        orb.eyebrow,
        orb.body,
        orb.detail,
        orb.lines.join(' '),
        orb.points.map((p) => `${p.label} ${p.description}`).join(' '),
        orb.stats.map((s) => `${s.label} ${s.value}${s.suffix}`).join(' '),
        orb.tagline,
      ].join(' '),
    ),
    url: `/about#about-orb-${orb.id}`,
    meta: { hash: `about-orb-${orb.id}` },
  }))
}

/**
 * Assembles the full storefront search corpus by reshaping data already
 * fetched elsewhere in the app (`runtimeClients.*`, `loadStorefrontProjection`)
 * — no new data-fetching path, only new shaping. Safe to call client-side.
 */
export async function buildSearchCorpus(): Promise<SearchDocument[]> {
  const [products, pdpTiles, story, about] = await Promise.all([
    buildProductDocs(),
    buildPdpTileDocs(),
    buildStoryDocs(),
    buildAboutDocs(),
  ])
  return [...products, ...pdpTiles, ...story, ...about, ...STATIC_PAGE_DOCS]
}
