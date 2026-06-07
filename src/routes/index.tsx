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
    return {
      products,
      activeLandingKey: projection.activeLandingPageKey,
      resolvedAssets,
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
  const { products: initialProducts, activeLandingKey, resolvedAssets } =
    Route.useLoaderData();
  const products = useHomeProducts(initialProducts);
  const landingKey = useActiveLandingPageKey(activeLandingKey);

  useLenisScroll(true);

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <LandingPageRenderer
        activeKey={landingKey}
        products={products}
        assets={resolvedAssets}
      />
    </div>
  );
}
