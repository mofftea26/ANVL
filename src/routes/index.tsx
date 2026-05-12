import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useRef } from "react";
import { toast } from "sonner";
import { buildSeoMeta } from "@/app/seo/meta";
import { runtimeClients } from "@/app/config/runtime";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { organizationJsonLd } from "@/shared/components/seo/structuredData";
import {
  Button,
  Container,
  FormField,
  Input,
  Select,
} from "@/shared/components/ui";
import { useLenisScroll } from "@/shared/hooks/useLenisScroll";
import { useWaitlistForm } from "@/features/marketing/hooks/useWaitlistForm";
import { submitWaitlistMock } from "@/features/marketing/data/waitlist.mock";
import { useCartAnalytics } from "@/features/analytics/hooks/useCartAnalytics";
import { HeroForgeSequence } from "@/features/marketing/components/HeroForgeSequence";
import { OathStampSequence } from "@/features/marketing/components/OathStampSequence";
import { PiecesGrid } from "@/features/marketing/components/PiecesGrid";
import { MaterialsMarquee } from "@/features/marketing/components/MaterialsMarquee";
import { AnvlOathShape } from "@/shared/assets/brand";
import { gsap, useGSAP } from "@/shared/lib/gsap";

// Act III is heavy (large SVG decoration) — defer it so the hero
// can paint first.
const DropRevealSection = lazy(() =>
  import("@/features/marketing/components/DropRevealSection").then(
    (module) => ({
      default: module.DropRevealSection,
    }),
  ),
);

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, homepage] = await Promise.all([
      runtimeClients.commerce.getProducts(),
      runtimeClients.cms.getHomepageContent(),
    ]);
    return { products, homepage };
  },
  head: () =>
    buildSeoMeta({
      title: "ANVL Athletics | Forged Under Pressure",
      description:
        "Premium bodybuilding gymwear built for disciplined lifters.",
      path: "/",
    }),
  component: HomePage,
});

function HomePage() {
  useLenisScroll(true);
  const { products, homepage } = Route.useLoaderData();
  const waitlistForm = useWaitlistForm();
  const { trackWaitlist } = useCartAnalytics();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const onWaitlistSubmit = waitlistForm.handleSubmit(async (values) => {
    await submitWaitlistMock(values);
    trackWaitlist(values.email, values.preferredProduct);
    toast.success("You are on the waitlist.");
    waitlistForm.reset();
  });

  // Page-level reveals only handle Act VI (Join) since each section
  // component owns its own entrance choreography.
  useGSAP(
    () => {
      const ctx = gsap.matchMedia();

      ctx.add(
        {
          motionOk: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const conds = context.conditions ?? {};
          if (conds.reduced) return;

          const eyebrow = document.querySelector("[data-join-eyebrow]");
          const headingWords = gsap.utils.toArray<HTMLElement>(
            "[data-join-word]",
          );
          const intro = document.querySelector("[data-join-intro]");
          const bullets = gsap.utils.toArray<HTMLElement>("[data-join-bullet]");
          const form = document.querySelector("[data-join-form]");
          const shape = document.querySelector("[data-join-shape]");

          if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 14 });
          gsap.set(headingWords, { yPercent: 100, opacity: 0 });
          if (intro) gsap.set(intro, { opacity: 0, y: 14 });
          gsap.set(bullets, { opacity: 0, x: -14 });
          if (form) gsap.set(form, { opacity: 0, y: 24 });

          const trigger = document.querySelector("#waitlist");
          if (!trigger) return;

          gsap
            .timeline({
              scrollTrigger: {
                trigger,
                start: "top bottom-=120",
                toggleActions: "play none none reverse",
              },
              defaults: { ease: "expo.out" },
            })
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0)
            .to(
              headingWords,
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.95,
                stagger: 0.08,
              },
              0.05,
            )
            .to(intro, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
            .to(
              bullets,
              {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.07,
                ease: "power3.out",
              },
              0.45,
            )
            .to(form, { opacity: 1, y: 0, duration: 0.8 }, 0.55);

          if (shape) {
            gsap.fromTo(
              shape,
              { yPercent: -6, rotate: 0 },
              {
                yPercent: 6,
                rotate: 8,
                ease: "none",
                scrollTrigger: {
                  trigger,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          }
        },
        pageRef,
      );

      return () => ctx.revert();
    },
    { scope: pageRef },
  );

  const joinBullets = [
    "Priority access window",
    "Sizing & fit recommendations",
    "Manifesto in your inbox",
  ];

  return (
    <div ref={pageRef}>
      <JsonLd data={organizationJsonLd()} />

      <HeroForgeSequence
        badgeText="Drop 01 — The Oath"
        title={homepage.hero.title}
        subtitle={homepage.hero.subtitle}
        primaryCta={homepage.hero.primaryCta}
        secondaryCta={homepage.hero.secondaryCta}
      />

      <OathStampSequence
        heading={homepage.manifesto.heading}
        lines={homepage.manifesto.lines}
      />

      <Suspense
        fallback={
          <section className="anvl-screen-section flex items-center justify-center">
            <Container>
              <p className="anvl-micro text-[var(--color-text-muted)]">
                Loading drop...
              </p>
            </Container>
          </section>
        }
      >
        <DropRevealSection products={products} />
      </Suspense>

      <PiecesGrid products={products} />

      <MaterialsMarquee materials={homepage.materials} />

      {/* Act VI — Join The Oath */}
      <section
        id="waitlist"
        className="anvl-screen-section relative w-full overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-surface)] py-16 sm:py-20 md:py-24"
        aria-label="Join the waitlist"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-end"
        >
          <span
            data-join-shape="true"
            className="-mr-24 block will-change-transform md:-mr-16"
          >
            <AnvlOathShape className="h-[110svh] w-auto text-[var(--color-heading)] opacity-[0.05]" />
          </span>
        </div>

        <Container className="relative z-10">
          <div className="flex items-baseline justify-between gap-4">
            <p
              data-join-eyebrow="true"
              className="anvl-micro will-change-transform"
            >
              Act VI — Join The Oath
            </p>
            <p className="anvl-micro text-[var(--color-text-muted)]">
              Final · Drop 01
            </p>
          </div>

          <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
            <div>
              <h2 className="anvl-heading font-normal leading-[0.88] text-[clamp(2rem,7vw,4.75rem)]">
                {['Take', 'the', 'oath.'].map((word) => (
                  <span
                    key={word}
                    className="mr-2 inline-block overflow-hidden pb-[0.06em] align-baseline"
                  >
                    <span
                      data-join-word="true"
                      className="inline-block will-change-transform"
                    >
                      {word}
                    </span>
                  </span>
                ))}
              </h2>
              <p
                data-join-intro="true"
                className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] will-change-transform sm:text-base"
              >
                Drop 01 launches in limited quantities. Reserve your place
                before public release — manifesto, sizing guide and first-look
                imagery land in your inbox.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-[var(--color-text-muted)]">
                {joinBullets.map((bullet) => (
                  <li
                    key={bullet}
                    data-join-bullet="true"
                    className="flex items-center gap-3 will-change-transform"
                  >
                    <span className="inline-block h-px w-6 bg-[var(--color-accent)]" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <form
              data-join-form="true"
              className="space-y-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/70 p-5 backdrop-blur will-change-transform sm:space-y-4 sm:p-7"
              onSubmit={onWaitlistSubmit}
            >
              <FormField
                label="Email"
                error={waitlistForm.formState.errors.email?.message}
              >
                <Input {...waitlistForm.register("email")} type="email" />
              </FormField>
              <FormField
                label="First Name (optional)"
                error={waitlistForm.formState.errors.firstName?.message}
              >
                <Input {...waitlistForm.register("firstName")} />
              </FormField>
              <FormField
                label="Preferred Product (optional)"
                error={waitlistForm.formState.errors.preferredProduct?.message}
              >
                <Select {...waitlistForm.register("preferredProduct")}>
                  <option value="">Select product</option>
                  {products.map((item) => (
                    <option value={item.slug} key={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                type="submit"
                disabled={waitlistForm.formState.isSubmitting}
              >
                {waitlistForm.formState.isSubmitting
                  ? "Submitting..."
                  : "Join Waitlist"}
              </Button>
            </form>
          </div>
        </Container>
      </section>
    </div>
  );
}
