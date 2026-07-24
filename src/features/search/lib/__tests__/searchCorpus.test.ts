import { describe, expect, it, vi } from 'vitest'
import type { Product } from '@/features/products/types/product.types'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { buildSearchCorpus } from '@/features/search/lib/searchCorpus'

const mockProduct: Product = {
  id: 'p-1',
  slug: 'forge-cage-tee',
  name: 'Forge Cage Tee',
  dropName: 'The Oath',
  role: 'Cage tee',
  fit: 'Oversized',
  fabric: '440gsm cotton',
  gsm: '440',
  storytelling: 'Built for the forge floor.',
  designDetails: ['Flat-lock seams'],
  careInstructions: ['Cold wash'],
  colorways: [{ name: 'Bone', base: '#E7E4DF', accent: '#0B0B0C' }],
  sizes: ['M', 'L'],
  price: 79,
  images: [],
}

const mockChapter: StoryChapter = {
  id: 'ch-1',
  slug: 'the-oath',
  chapterNumber: 1,
  title: 'The Oath',
  subtitle: 'Volume I',
  description: 'A kingdom forges an army.',
  productSlug: 'forge-cage-tee',
  dropLabel: 'Drop 01',
  dropSlug: 'drop-01',
  cover: {
    kind: 'none',
    mediaId: null,
    storagePath: null,
    url: null,
    alt: '',
    width: null,
    height: null,
    poster: null,
  },
  coverLogo: {
    kind: 'none',
    mediaId: null,
    storagePath: null,
    url: null,
    alt: '',
    width: null,
    height: null,
    poster: null,
  },
  colors: { cover: '#26211d', foil: '#c8a45a', pageEdge: '#efe4c6', heading: '#221b10', text: '#4c4030' },
  isPublished: true,
  acts: [{ id: 'act-1', actNumber: 1, title: 'The First Strike', story: 'The hammer fell at dawn.', asset: { kind: 'none', mediaId: null, storagePath: null, url: null, alt: '', width: null, height: null, poster: null } }],
  cast: [{ id: 'cast-1', actId: null, name: 'The General', rank: 'General', blurb: 'Leads the army.', profileUserId: null, armoryHandle: null, avatar: { kind: 'none', mediaId: null, storagePath: null, url: null, alt: '', width: null, height: null, poster: null }, sortOrder: 0 }],
}

vi.mock('@/app/config/runtime', () => ({
  runtimeClients: {
    commerce: {
      getShopListingCatalog: vi.fn(async () => ({ items: [mockProduct], drops: [] })),
    },
    story: {
      getPublishedChapters: vi.fn(async () => [mockChapter]),
    },
  },
}))

vi.mock('@/features/cms/api/loadStorefrontProjection', () => ({
  loadStorefrontProjection: vi.fn(async () => ({
    landingContent: {
      about: {
        orbs: [
          {
            label: 'ANVL',
            color: '#E7E4DF',
            eyebrow: 'The House of ANVL',
            title: 'Forged in Beirut',
            body: 'Premium bodybuilding gymwear from Lebanon.',
          },
        ],
      },
    },
    pdpContent: {
      'forge-cage-tee': {
        storyHeading: 'The piece',
        storyBody: 'Forged for the heaviest sets.',
        materialTitle: '',
        materialNote: '',
        care: ['Cold wash', 'Hang dry'],
        designDetails: [],
      },
    },
  })),
}))

describe('buildSearchCorpus', () => {
  it('builds a product document with the shop URL and body text', async () => {
    const docs = await buildSearchCorpus()
    const product = docs.find((d) => d.type === 'product')
    expect(product?.url).toBe('/shop/forge-cage-tee')
    expect(product?.meta.slug).toBe('forge-cage-tee')
    expect(product?.body).toContain('Built for the forge floor')
  })

  it('builds story-chapter, story-act, and story-cast documents', async () => {
    const docs = await buildSearchCorpus()
    const chapter = docs.find((d) => d.type === 'story-chapter')
    const act = docs.find((d) => d.type === 'story-act')
    const cast = docs.find((d) => d.type === 'story-cast')
    expect(chapter?.url).toBe('/story?chapter=the-oath')
    expect(act?.url).toBe('/story?chapter=the-oath&act=act-1')
    expect(act?.meta).toEqual({ chapterSlug: 'the-oath', actId: 'act-1' })
    expect(cast?.title).toBe('The General')
  })

  it('builds an about-orb document with a hash URL', async () => {
    const docs = await buildSearchCorpus()
    const orb = docs.find((d) => d.type === 'about-orb')
    expect(orb?.title).toBe('Forged in Beirut')
    expect(orb?.url).toMatch(/^\/about#about-orb-/)
    expect(orb?.meta.hash).toMatch(/^about-orb-/)
  })

  it('builds pdp-tile documents only for populated CMS fields, per product', async () => {
    const docs = await buildSearchCorpus()
    const pdpDocs = docs.filter((d) => d.type === 'pdp-tile')
    expect(pdpDocs.some((d) => d.meta.hash === 'pdp-story')).toBe(true)
    expect(pdpDocs.some((d) => d.meta.hash === 'pdp-care')).toBe(true)
    expect(pdpDocs.some((d) => d.meta.hash === 'pdp-materials')).toBe(false)
    for (const d of pdpDocs) expect(d.meta.slug).toBe('forge-cage-tee')
  })

  it('includes the hand-curated static pages', async () => {
    const docs = await buildSearchCorpus()
    const staticDocs = docs.filter((d) => d.type === 'static-page')
    expect(staticDocs.length).toBeGreaterThan(0)
    expect(staticDocs.every((d) => d.meta.path)).toBe(true)
  })
})
