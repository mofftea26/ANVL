import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { buildSeoMeta } from "@/app/seo/meta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { organizationJsonLd } from "@/shared/components/seo/structuredData";
import { Container } from "@/shared/components/ui";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { HeroForgeSequence } from "@/features/marketing/components/HeroForgeSequence";
import { OathStampSequence } from "@/features/marketing/components/OathStampSequence";
import { PiecesGrid } from "@/features/marketing/components/PiecesGrid";
import { MaterialsMarquee } from "@/features/marketing/components/MaterialsMarquee";
import { WaitlistSection } from "@/features/marketing/components/WaitlistSection";
import { useLandingCms } from "@/features/admin/landing-cms/useLandingCms";
import { useHomeProducts } from "@/features/products/hooks/useHomeProducts";
import { DropLoadingIndicator } from "@/shared/components/ui/DropLoadingIndicator";

const DropRevealSection = lazy(() =>
  import("@/features/marketing/components/DropRevealSection").then(
    (module) => ({
      default: module.DropRevealSection,
    }),
  ),
);

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

      <HeroForgeSequence
        badgeText={landing.hero.badgeText}
        title={landing.hero.title}
        subtitle={landing.hero.subtitle}
        primaryCta={landing.hero.primaryCta}
        secondaryCta={landing.hero.secondaryCta}
        meta={landing.hero.meta}
        emblemSrc={emblemSrc}
      />

      <OathStampSequence
        actLabel={landing.manifesto.actLabel}
        counterLabel={landing.manifesto.counterLabel}
        heading={landing.manifesto.heading}
        intro={landing.manifesto.intro}
        tenets={landing.manifesto.tenets}
        emblemSrc={emblemSrc}
      />

      <Suspense
        fallback={
          <section className="anvl-screen-section flex items-center justify-center border-b border-[var(--color-line)] bg-[var(--color-bg)]">
            <Container>
              <DropLoadingIndicator label="Loading drop" />
            </Container>
          </section>
        }
      >
        <DropRevealSection
          products={products}
          actLabel={landing.dropReveal.actLabel}
          counterLabel={landing.dropReveal.counterLabel}
          words={landing.dropReveal.words}
          tagline={landing.dropReveal.tagline}
          stats={landing.dropReveal.stats}
          primaryCta={landing.dropReveal.primaryCta}
          secondaryCta={landing.dropReveal.secondaryCta}
          dropIcon={landing.dropReveal.dropIcon}
        />
      </Suspense>

      <PiecesGrid
        products={products}
        actLabel={landing.pieces.actLabel}
        headingLineOne={landing.pieces.headingLineOne}
        headingLineTwo={landing.pieces.headingLineTwo}
        viewAllLabel={landing.pieces.viewAllLabel}
        viewAllHref={landing.pieces.viewAllHref}
        footerLeftText={landing.pieces.footerLeftText}
        footerLinkLabel={landing.pieces.footerLinkLabel}
        footerLinkHref={landing.pieces.footerLinkHref}
      />

      <MaterialsMarquee
        actLabel={landing.materials.actLabel}
        counterSuffix={landing.materials.counterSuffix}
        heading={landing.materials.heading}
        intro={landing.materials.intro}
        materials={landing.materials.materials}
      />

      <WaitlistSection
        content={landing.waitlist}
        products={products}
        emblemSrc={emblemSrc}
      />
    </div>
  );
}
