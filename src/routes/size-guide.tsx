import type { ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import { buildSeoMetaFromCmsSource, seoContentToMetaSource } from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { Container, Section } from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { IndustrialDivider } from '@/shared/components/layout/IndustrialDivider'

function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-text)] ${className}`}
    >
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-[var(--color-line)] px-4 py-3 text-[var(--color-text-muted)] ${className}`}>
      {children}
    </td>
  )
}

export const Route = createFileRoute('/size-guide')({
  loader: async () => {
    const [siteSeo, seoDoc] = await Promise.all([
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath('/size-guide'),
    ])
    return { siteSeo, seoDoc }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: 'Size Guide | ANVL Athletics',
            description:
              'ANVL sizing for Lebanon & EU retail: body measurements in cm, EU top sizes 44â€“52, and charts for Oversized Tee, Stringer, and Compression Tee.',
            canonicalPath: '/size-guide',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoMetaFromCmsSource(
      seoContentToMetaSource(doc, site.globalDefaults),
      site.globalDefaults,
    )
  },
  component: SizeGuidePage,
})

function SizeGuidePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <GrainOverlay />
        <Container className="relative z-10 py-14 md:py-20">
          <p className="anvl-micro">Fit & sizing</p>
          <h1 className="anvl-heading mt-4 max-w-4xl text-5xl leading-[0.95] md:text-7xl">Size guide</h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--color-text-muted)] md:text-lg">
            All measurements are in centimetres. EU numbers follow the usual menâ€™s woven/knit top scale you see in
            Beirut and wider Lebanon (44â€“52), shown next to our letter sizes so you can match what you already wear.
          </p>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-6">
          <h2 className="anvl-heading text-4xl">How to measure</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-[var(--color-text-muted)]">
            <li>
              <span className="text-[var(--color-text)]">Chest:</span> tape horizontal around the fullest part, arms
              relaxedâ€”breathe normally.
            </li>
            <li>
              <span className="text-[var(--color-text)]">Length:</span> top of shoulder seam at base of neck down to
              where you want the hem (we list approximate finished garment back length per piece).
            </li>
          </ul>
          <p className="text-xs text-[var(--color-text-muted)]">
            Between sizes? For oversized and stringer, choose the larger chest bracket for more drape or room. For
            compression, see the note belowâ€”most lifters size down for maximum hold.
          </p>
        </Container>
      </Section>

      <Section className="bg-[var(--color-surface)]">
        <Container className="space-y-6">
          <div>
            <h2 className="anvl-heading text-4xl">Lebanon / EU letter bridge</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--color-text-muted)]">
              Use this table to translate what you try on locallyâ€”EU values are indicative and align with common shop
              tagging; exact ease depends on the cut below.
            </p>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>ANVL</Th>
                <Th>EU (menâ€™s top)</Th>
                <Th>Body chest (cm)</Th>
                <Th>Notes</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">S</Td>
                <Td>44</Td>
                <Td>88â€“96</Td>
                <Td>Slim builds, newer lifters, or tight street fit on tees.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">M</Td>
                <Td>46</Td>
                <Td>96â€“104</Td>
                <Td>Most training builds in Lebanese retailâ€”start here if unsure.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">L</Td>
                <Td>48</Td>
                <Td>104â€“112</Td>
                <Td>Broad chest / heavier back session volume.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">XL</Td>
                <Td>50</Td>
                <Td>112â€“120</Td>
                <Td>Large chest & shoulders; common competition off-season bracket.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">2XL</Td>
                <Td>52</Td>
                <Td>120â€“128</Td>
                <Td>Oversized tee onlyâ€”extra drape for very wide frames.</Td>
              </tr>
            </tbody>
          </TableWrap>
        </Container>
      </Section>

      <Section>
        <Container className="space-y-6">
          <h2 className="anvl-heading text-4xl">Oversized tee</h2>
          <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
            True oversized: boxy block, drop shoulder, long drape. Sizes: Sâ€“2XL. Stay true to your chest bracket for the
            intended ANVL silhouetteâ€”only size up if you want extreme stack.
          </p>
          <TableWrap>
            <thead>
              <tr>
                <Th>Size</Th>
                <Th>Body chest (cm)</Th>
                <Th>Approx. back length (cm)</Th>
                <Th>Fit intent</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">S</Td>
                <Td>88â€“96</Td>
                <Td>70</Td>
                <Td>Relaxed street drape on smaller frames.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">M</Td>
                <Td>96â€“104</Td>
                <Td>72</Td>
                <Td>Reference oversized block for most lifters.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">L</Td>
                <Td>104â€“112</Td>
                <Td>74</Td>
                <Td>Extra room through chest and sleeve.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">XL</Td>
                <Td>112â€“120</Td>
                <Td>76</Td>
                <Td>Wide shoulder line, stacked hem.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">2XL</Td>
                <Td>120â€“128</Td>
                <Td>78</Td>
                <Td>Maximum volume; matches EU 52 floor racks.</Td>
              </tr>
            </tbody>
          </TableWrap>
        </Container>
      </Section>

      <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="space-y-6">
          <h2 className="anvl-heading text-4xl">Stringer</h2>
          <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
            Old-school reveal with controlled armholes. Sizes: Sâ€“XL. Choose your normal Lebanese letter; straps scale with
            chest bracket.
          </p>
          <TableWrap>
            <thead>
              <tr>
                <Th>Size</Th>
                <Th>Body chest (cm)</Th>
                <Th>Approx. back length (cm)</Th>
                <Th>Armhole depth</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">S</Td>
                <Td>88â€“96</Td>
                <Td>68</Td>
                <Td>Moderate revealâ€”gym-floor safe.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">M</Td>
                <Td>96â€“104</Td>
                <Td>70</Td>
                <Td>Balanced classic stringer line.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">L</Td>
                <Td>104â€“112</Td>
                <Td>72</Td>
                <Td>Wider strap base for big chest sweep.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">XL</Td>
                <Td>112â€“120</Td>
                <Td>74</Td>
                <Td>Maximum coverage while keeping racerback clear.</Td>
              </tr>
            </tbody>
          </TableWrap>
        </Container>
      </Section>

      <Section>
        <Container className="space-y-6">
          <h2 className="anvl-heading text-4xl">Compression tee</h2>
          <p className="max-w-3xl text-sm text-[var(--color-text-muted)]">
            Second-skin technical hold. Sizes: Sâ€“XL. If your chest sits on a boundary and you want maximum compression,
            take the smaller size; if you prioritise breathability between sets, take the larger.
          </p>
          <TableWrap>
            <thead>
              <tr>
                <Th>Size</Th>
                <Th>Body chest (cm)</Th>
                <Th>Compression level</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">S</Td>
                <Td>88â€“94</Td>
                <Td>Firm lockâ€”ideal for staged posing or hi-intensity upper days.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">M</Td>
                <Td>94â€“102</Td>
                <Td>Balanced sculptâ€”default for most athletes.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">L</Td>
                <Td>102â€“110</Td>
                <Td>Strong support with a touch more ease.</Td>
              </tr>
              <tr>
                <Td className="font-medium text-[var(--color-text)]">XL</Td>
                <Td>110â€“118</Td>
                <Td>Accommodates off-season mass while staying technical.</Td>
              </tr>
            </tbody>
          </TableWrap>
          <IndustrialDivider />
          <p className="text-xs text-[var(--color-text-muted)]">
            Measurements are developed for ANVL patterns and may differ from imported basics sold under the same EU
            numberâ€”always compare to your chest tape reading first.
          </p>
        </Container>
      </Section>

      <Section className="border-t border-[var(--color-line)]">
        <Container className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">Ready to match size to fabric? Browse Drop 01.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              search={defaultShopUrlSearch}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-bg)] no-underline hover:opacity-90"
            >
              Shop
            </Link>
            <Link
              to="/care-guide"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
            >
              Care guide
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
