import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { fetchPassportByTokenAnon } from '@/features/passport/api/passportClient'
import { PassportExperience } from '@/features/passport/components/PassportExperience'
import {
  PassportPreviewHost,
  type PassportPreviewData,
} from '@/features/passport/components/PassportPreviewHost'
import { resolvePassportContent } from '@/features/passport/lib/resolvePassportContent'
import {
  isPassportPreviewToken,
  normalizePassportPreviewView,
  type PassportPreviewView,
} from '@/features/passport/lib/passportPreview'
import { buildPassportSizeGuide } from '@/features/passport/lib/sizeRecommendation'
import { buildPassportRelated } from '@/features/passport/lib/relatedProducts'
import type { PassportView } from '@/features/passport/schemas/passport.schema'
import { resolvePdpContent } from '@/features/products/pdp/resolvePdpContent'

interface PassportSearch {
  transfer?: string
  /** Preview-only: which product to synthesize a passport for. */
  previewSlug?: string
  /** Preview-only: force the guest (public) or owner (dossier) surface. */
  previewView?: PassportPreviewView
}

function claimedDateOf(view: PassportView | null): string | null {
  if (!view?.claimedAt) return null
  const d = new Date(view.claimedAt)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Admin-preview loader branch: synthesize a representative passport for a
 * product (first available when no slug), resolving section content from the
 * SAVED passport content — the admin's unsaved draft merges client-side in
 * {@link PassportPreviewHost}. No RPC read, no customer PII.
 */
async function loadPassportPreview(previewSlug: string | undefined, view: PassportPreviewView) {
  const [projection, catalog] = await Promise.all([
    loadStorefrontProjection(),
    runtimeClients.commerce.getShopListingCatalog().catch(() => ({ items: [], drops: [] })),
  ])
  const product = previewSlug
    ? await runtimeClients.commerce.getProductBySlug(previewSlug).catch(() => null)
    : (catalog.items[0] ?? null)

  const productSlug = product?.slug ?? previewSlug ?? ''
  const forcedVariant = view === 'owner' ? 'owner' : 'public'

  const pdpResolved = product
    ? resolvePdpContent({
        product,
        pdpContent: projection.pdpContent,
        globalAssets: resolveStorefrontPageAssets(projection.assets, 'pdp', projection.mediaIndex),
        mediaIndex: projection.mediaIndex,
      })
    : null

  const content = resolvePassportContent({
    product,
    passportContent: projection.passportContent,
    pdpContent: pdpResolved,
    mediaIndex: projection.mediaIndex,
    productSlug,
  })

  const syntheticView: PassportView | null = product
    ? {
        productSlug,
        productName: product.name,
        serialNumber: 1,
        editionTotal: 50,
        isClaimed: true,
        isOwner: forcedVariant === 'owner',
        claimedDisplayName: 'Sample Owner',
        claimedAt: new Date().toISOString(),
        claimedColor: null,
        claimedSize: 'M',
        isPublic: true,
        isTransferPending: false,
        transferValid: false,
        ownerArmoryHandle: null,
      }
    : null

  const storyBook = product
    ? await runtimeClients.story.getChapterByProductSlug(productSlug).catch(() => null)
    : null

  const sizeGuide = buildPassportSizeGuide({
    productSlug,
    passportContent: projection.passportContent,
    catalog: catalog.items.map((p) => ({ slug: p.slug, name: p.name })),
  })
  const related = buildPassportRelated({
    productSlug,
    dropName: product?.dropName ?? '',
    category: product?.shop?.category,
    catalog: catalog.items.map((p) => ({
      slug: p.slug,
      name: p.name,
      dropName: p.dropName,
      category: p.shop?.category,
      image: p.images[0]?.src,
    })),
  })

  const preview: PassportPreviewData = {
    productSlug,
    forcedVariant,
    mediaIndex: projection.mediaIndex,
    pdpResolved,
    savedPassportContent: projection.passportContent,
  }

  return {
    token: '',
    view: syntheticView,
    product,
    content,
    storyChapter: storyBook,
    sizeGuide,
    related,
    preview,
  }
}

export const Route = createFileRoute('/p/$token')({
  validateSearch: (search: Record<string, unknown>): PassportSearch => {
    const out: PassportSearch = {}
    if (typeof search.transfer === 'string' && search.transfer.length >= 8 && search.transfer.length <= 128) {
      out.transfer = search.transfer
    }
    if (typeof search.previewSlug === 'string' && search.previewSlug.length > 0) {
      out.previewSlug = search.previewSlug
    }
    if (search.previewView === 'guest' || search.previewView === 'owner') {
      out.previewView = search.previewView
    }
    return out
  },
  loaderDeps: ({ search }) => ({
    transfer: search.transfer,
    previewSlug: search.previewSlug,
    previewView: search.previewView,
  }),
  loader: async ({ params, deps }) => {
    if (isPassportPreviewToken(params.token)) {
      return loadPassportPreview(deps.previewSlug, normalizePassportPreviewView(deps.previewView))
    }
    // Anon-scoped lookup only (SSR has no customer session). Owner resolution
    // happens client-side via the session-aware query in PassportExperience.
    const view = await fetchPassportByTokenAnon(params.token, deps.transfer)
    if (!view) {
      return {
        token: params.token,
        view: null,
        product: null,
        content: resolvePassportContent({
          product: null,
          passportContent: {},
          pdpContent: null,
          mediaIndex: [],
          productSlug: '',
        }),
        storyChapter: null,
        sizeGuide: null,
        related: null,
        preview: null,
      }
    }
    const [product, projection, storyBook, catalog] = await Promise.all([
      runtimeClients.commerce.getProductBySlug(view.productSlug).catch(() => null),
      loadStorefrontProjection(),
      runtimeClients.story.getChapterByProductSlug(view.productSlug).catch(() => null),
      runtimeClients.commerce.getShopListingCatalog().catch(() => ({ items: [], drops: [] })),
    ])
    const pdpResolved = product
      ? resolvePdpContent({
          product,
          pdpContent: projection.pdpContent,
          globalAssets: resolveStorefrontPageAssets(
            projection.assets,
            'pdp',
            projection.mediaIndex,
          ),
          mediaIndex: projection.mediaIndex,
        })
      : null
    const content = resolvePassportContent({
      product,
      passportContent: projection.passportContent,
      pdpContent: pdpResolved,
      mediaIndex: projection.mediaIndex,
      productSlug: view.productSlug,
    })
    // User-independent (the viewer's own size is applied client-side, since
    // SSR is anon and only the owner ever learns their registered size).
    const sizeGuide = buildPassportSizeGuide({
      productSlug: view.productSlug,
      passportContent: projection.passportContent,
      catalog: catalog.items.map((p) => ({ slug: p.slug, name: p.name })),
    })
    // Candidate related pieces (user-independent — the owner's registrations
    // filter these client-side, since SSR is anon).
    const related = buildPassportRelated({
      productSlug: view.productSlug,
      dropName: product?.dropName ?? '',
      category: product?.shop?.category,
      catalog: catalog.items.map((p) => ({
        slug: p.slug,
        name: p.name,
        dropName: p.dropName,
        category: p.shop?.category,
        image: p.images[0]?.src,
      })),
    })
    return {
      token: params.token,
      view,
      product,
      content,
      storyChapter: storyBook,
      sizeGuide,
      related,
      preview: null,
    }
  },
  head: ({ loaderData }) =>
    buildSeoMeta({
      title: loaderData?.view
        ? `${loaderData.view.productName} — Product Passport | ANVL Athletics`
        : 'Product Passport | ANVL Athletics',
      description:
        'A forged-under-pressure product passport. One piece, one owner, verified.',
      path: `/p/${loaderData?.token ?? ''}`,
      noIndex: true,
    }),
  component: PassportRoute,
})

function PassportRoute() {
  const data = Route.useLoaderData()
  const { transfer } = Route.useSearch()

  if (data.preview) {
    return (
      <PassportPreviewHost
        view={data.view!}
        product={data.product}
        content={data.content}
        storyChapter={data.storyChapter}
        sizeGuide={data.sizeGuide}
        related={data.related}
        claimedDate={claimedDateOf(data.view)}
        preview={data.preview}
      />
    )
  }

  return <PassportExperience {...data} transferCode={transfer} />
}
