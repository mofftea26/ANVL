import { createFileRoute } from "@tanstack/react-router";
import { BRAND } from "@/shared/constants/brand";
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from "@/features/cms/seoMeta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import {
  dropStructuredDataJsonLd,
  organizationJsonLd,
} from "@/shared/components/seo/structuredData";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { PublicLandingActs } from "@/features/marketing/public-landing/PublicLandingActs";
import { useLandingCms } from "@/features/cms/hooks/useLandingCms";
import { useHomeProducts } from "@/features/products/hooks/useHomeProducts";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, landing, siteSeo, seoDoc, activeDrop] = await Promise.all([
      runtimeClients.commerce.getHomeProducts(),
      runtimeClients.cms.getLandingCmsContent(),
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath("/"),
      runtimeClients.cms.getActiveDrop(),
    ]);
    return { products, landing, siteSeo, seoDoc, activeDrop };
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo;
    const doc = loaderData?.seoDoc;
    const landing = loaderData?.landing;
    const fb = {
      defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg`,
    };
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: landing?.seo.title ?? "ANVL Athletics | Forged Under Pressure",
            description:
              landing?.seo.description ??
              "Premium bodybuilding gymwear built for disciplined lifters.",
            canonicalPath: landing?.seo.path ?? "/",
            ogImage: landing?.seo.ogImage,
            ogTitle: landing?.seo.ogTitle,
            ogDescription: landing?.seo.ogDescription,
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
  useLenisScroll(true);
  const { products: initialProducts, landing: ssrLanding, activeDrop } =
    Route.useLoaderData();
  const landing = useLandingCms(ssrLanding);
  const products = useHomeProducts(initialProducts);

  const emblemSrc = landing.navigation.activeDropEmblemSrc;

  const structuredData = activeDrop?.seo.structuredDataType
    ? dropStructuredDataJsonLd(activeDrop.seo.structuredDataType, activeDrop)
    : organizationJsonLd();

  return (
    <div>
      {structuredData ? <JsonLd data={structuredData} /> : null}
      <PublicLandingActs
        landing={landing}
        products={products}
        emblemSrc={emblemSrc}
      />
    </div>
  );
}
