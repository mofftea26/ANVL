import type { StorefrontCampaign } from '@/features/cms/api/publicStorefrontPublication'
import { Container } from '@/shared/components/ui/Container'

export type CampaignCardsSectionProps = {
  campaigns: StorefrontCampaign[]
}

export function CampaignCardsSection({ campaigns }: CampaignCardsSectionProps) {
  if (campaigns.length === 0) return null

  return (
    <section
      className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-16 md:py-20"
      aria-label="Campaigns"
    >
      <Container>
        <p className="anvl-micro mb-6 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          Campaigns
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6"
            >
              <h2 className="text-lg font-semibold uppercase tracking-[0.08em]">
                {campaign.title}
              </h2>
              {campaign.description ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {campaign.description}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
