import { createFileRoute } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { useLenisScroll } from '@/shared/hooks/useLenisScroll'
import { usePreviewDraft } from '@/features/cms/preview'
import { AboutExperience } from '@/features/about'

export const Route = createFileRoute('/about')({
  loader: async () => {
    const [projection, siteSeo, seoDoc] = await Promise.all([
      loadStorefrontProjection(),
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath('/about'),
    ])
    const assets = resolveStorefrontPageAssets(projection.assets, 'about', projection.mediaIndex)
    return {
      siteSeo,
      seoDoc,
      assets,
      landingContent: projection.landingContent.about,
      mediaIndex: projection.mediaIndex,
    }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.png` }
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: 'About | ANVL Athletics',
            description:
              'ANVL Athletics is premium bodybuilding gymwear from Lebanon — discipline-first silhouettes forged under pressure, built for serious lifters worldwide.',
            canonicalPath: '/about',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoHeadForSiteStaticPath('/about', doc, site)
  },
  component: AboutPage,
})

/** The film rides a floatier glide than the site default (0.07) — a longer
 *  settle after every wheel tick is most of what "cinematic scroll" feels
 *  like. Module-const so the Lenis effect never rebuilds. */
const ABOUT_LENIS_FEEL = { lerp: 0.052, wheelMultiplier: 0.95 }

function AboutPage() {
  const { assets, landingContent, mediaIndex } = Route.useLoaderData()
  useLenisScroll(true, ABOUT_LENIS_FEEL)

  // Admin live-preview iframe: unsaved About edits override published data.
  const previewDraft = usePreviewDraft()
  const effectiveContent = previewDraft?.landingContent?.about ?? landingContent
  const effectiveAssets = previewDraft?.assetConfig
    ? resolveStorefrontPageAssets(previewDraft.assetConfig, 'about', mediaIndex)
    : assets

  return (
    <AboutExperience
      landingContent={effectiveContent}
      assets={effectiveAssets}
      mediaIndex={mediaIndex}
    />
  )
}
