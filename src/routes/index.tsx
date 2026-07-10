import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/shared/constants/brand";
import { buildSeoMetaFromCmsSource, seoContentToMetaSource } from "@/features/cms/seoMeta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { organizationJsonLd } from "@/shared/components/seo/structuredData";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { useHomeProducts } from "@/features/products/hooks/useHomeProducts";
import { LandingPageRenderer } from "@/features/landingPages";
import { loadStorefrontProjection } from "@/features/cms/api/loadStorefrontProjection";
import { resolvePublishedAssets } from "@/features/cms/assets/resolvePublishedAssets";
import {
  resolveLoadingEmblemUrl,
  resolveThemedLoadingEmblemMarkup,
  resolveThemedSvgMarkup,
} from "@/features/landingPages/landingEntryLoad";
import { OATH_LOGO_PLACEHOLDER } from "@/features/landingPages/pages/TheOathLanding/theOathAssets";
import { useLandingEntry } from "@/features/landingPages/LandingEntryContext";
import { useActiveLandingPageKey } from "@/features/cms/hooks/useActiveLandingPageKey";
import { resolveComingSoonContent } from "@/features/comingSoon/content/resolveComingSoonContent";
import type { CmsSeoMetaSource } from "@/features/cms/seoMeta";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, projection] = await Promise.all([
      runtimeClients.commerce.getHomeProducts(),
      loadStorefrontProjection(),
    ]);
    const resolvedAssets = resolvePublishedAssets(
      projection.assets,
      projection.activeLandingPageKey,
      projection.mediaIndex,
    );
    const loadingEmblemUrl = resolveLoadingEmblemUrl(resolvedAssets);
    const dropLogoUrl =
      resolvedAssets.dropLogo?.trim() || OATH_LOGO_PLACEHOLDER;
    const crestSvgUrl = resolvedAssets.crestSvg?.trim() || dropLogoUrl;
    const [loadingEmblemMarkup, dropLogoMarkup, crestSvgMarkup] =
      await Promise.all([
        resolveThemedLoadingEmblemMarkup(loadingEmblemUrl),
        resolveThemedSvgMarkup(dropLogoUrl),
        resolveThemedSvgMarkup(crestSvgUrl),
      ]);
    // While Coming Soon mode is live the root gate replaces this page, so the
    // home head must carry the CMS-controlled reveal SEO instead.
    let comingSoonSeo: CmsSeoMetaSource | null = null;
    if (projection.comingSoon.enabled) {
      const reveal = resolveComingSoonContent(
        projection.comingSoon,
        projection.mediaIndex,
      );
      comingSoonSeo = {
        metaTitle: reveal.seo.title,
        metaDescription: reveal.seo.description,
        path: "/",
        ogTitle: reveal.seo.ogTitle,
        ogDescription: reveal.seo.ogDescription,
        ogImage: reveal.seo.ogImageUrl,
      };
    }
    return {
      products,
      comingSoonSeo,
      activeLandingKey: projection.activeLandingPageKey,
      resolvedAssets,
      loadingEmblemMarkup,
      themedMarkups: {
        dropLogo: dropLogoMarkup,
        crestSvg: crestSvgMarkup,
      },
      landingContent:
        projection.landingContent[projection.activeLandingPageKey],
      mediaIndex: projection.mediaIndex,
    };
  },
  head: ({ loaderData }) =>
    buildSeoMetaFromCmsSource(
      loaderData?.comingSoonSeo ??
        seoContentToMetaSource(
          {
            title: "ANVL Athletics | Forged Under Pressure",
            description:
              "Premium bodybuilding gymwear built through pressure, repetition, discipline, and heat.",
            canonicalPath: "/",
          },
          { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` },
        ),
      { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` },
    ),
  component: HomePage,
});

function HomePage() {
  const {
    products: initialProducts,
    activeLandingKey,
    resolvedAssets,
    loadingEmblemMarkup,
    themedMarkups,
    landingContent,
    mediaIndex,
  } = Route.useLoaderData();
  const products = useHomeProducts(initialProducts);
  const landingKey = useActiveLandingPageKey(activeLandingKey);
  const { homeEntryComplete } = useLandingEntry();

  useLenisScroll(homeEntryComplete);

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <LandingPageRenderer
        activeKey={landingKey}
        products={products}
        assets={resolvedAssets}
        loadingEmblemMarkup={loadingEmblemMarkup}
        themedMarkups={themedMarkups}
        landingContent={landingContent}
        mediaIndex={mediaIndex}
      />
    </div>
  );
}
