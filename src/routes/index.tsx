import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/shared/constants/brand";
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from "@/features/cms/seoMeta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { organizationJsonLd } from "@/shared/components/seo/structuredData";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { useHomeProducts } from "@/features/products/hooks/useHomeProducts";
import { LandingPageRenderer } from "@/features/landingPages";
import { readActiveLandingPageKeyForLoader } from "@/features/cms/landingPageActiveKey.settings";
import { useActiveLandingPageKey } from "@/features/cms/hooks/useActiveLandingPageKey";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, siteSeo, seoDoc, activeLandingKey] = await Promise.all([
      runtimeClients.commerce.getHomeProducts(),
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath("/"),
      readActiveLandingPageKeyForLoader(),
    ]);
    return { products, siteSeo, seoDoc, activeLandingKey };
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo;
    const doc = loaderData?.seoDoc;
    const fb = {
      defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg`,
    };
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: "ANVL Athletics | Forged Under Pressure",
            description:
              "Premium bodybuilding gymwear built through pressure, repetition, discipline, and heat.",
            canonicalPath: "/",
          },
          fb,
        ),
        fb,
      );
    }
    return buildSeoHeadForSiteStaticPath("/", doc, site);
  },
  component: HomePage,
});

function HomePage() {
  const { products: initialProducts, activeLandingKey } = Route.useLoaderData();
  const products = useHomeProducts(initialProducts);
  const landingKey = useActiveLandingPageKey(activeLandingKey);

  // Landing pages are cinematic scroll experiences — enable Lenis (the hook
  // self-gates to desktop + no-reduced-motion).
  useLenisScroll(true);

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <LandingPageRenderer activeKey={landingKey} products={products} />
    </div>
  );
}
