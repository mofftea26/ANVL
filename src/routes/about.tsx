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

function AboutPage() {
  const { assets, landingContent, mediaIndex } = Route.useLoaderData()
  useLenisScroll(true)

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
