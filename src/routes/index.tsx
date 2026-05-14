import { createFileRoute } from "@tanstack/react-router";
import { buildSeoMeta } from "@/app/seo/meta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { organizationJsonLd } from "@/shared/components/seo/structuredData";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { PublicLandingActs } from "@/features/marketing/public-landing/PublicLandingActs";
import { useLandingCms } from "@/features/admin/landing-cms/useLandingCms";
import { useHomeProducts } from "@/features/products/hooks/useHomeProducts";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, landing] = await Promise.all([
      runtimeClients.commerce.getHomeProducts(),
      runtimeClients.cms.getLandingCmsContent(),
    ]);
    return { products, landing };
  },
  head: ({ loaderData }) => {
    const seo = loaderData?.landing.seo;
    return buildSeoMeta({
      title: seo?.title ?? "ANVL Athletics | Forged Under Pressure",
      description:
        seo?.description ??
        "Premium bodybuilding gymwear built for disciplined lifters.",
      path: seo?.path ?? "/",
      image: seo?.ogImage,
    });
  },
  component: HomePage,
});

function HomePage() {
  useLenisScroll(true);
  const { products: initialProducts, landing: ssrLanding } =
    Route.useLoaderData();
  const landing = useLandingCms(ssrLanding);
  const products = useHomeProducts(initialProducts);

  const emblemSrc = landing.navigation.activeDropEmblemSrc;

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <PublicLandingActs
        landing={landing}
        products={products}
        emblemSrc={emblemSrc}
      />
    </div>
  );
}
