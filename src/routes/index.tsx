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
    return {
      products,
      activeLandingKey: projection.activeLandingPageKey,
      resolvedAssets,
      loadingEmblemMarkup,
      themedMarkups: {
        dropLogo: dropLogoMarkup,
        crestSvg: crestSvgMarkup,
      },
      landingContent:
        projection.landingContent[projection.activeLandingPageKey],
    };
  },
  head: () =>
    buildSeoMetaFromCmsSource(
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
      />
    </div>
  );
}
