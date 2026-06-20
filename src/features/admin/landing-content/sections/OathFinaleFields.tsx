import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.finale

export function OathFinaleFields({
  register,
}: {
  register: UseFormRegister<OathContentFormValues>
}) {
  return (
    <ContentSection
      title="Finale — Take the Oath"
      hint="The closing vow. The brand line beneath it is fixed (global brand rule)."
    >
      <AdminFormField label="Eyebrow" htmlFor="oath-finale-eyebrow">
        <AdminInput id="oath-finale-eyebrow" placeholder={d.eyebrow} {...register('finale.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Title" htmlFor="oath-finale-title">
        <AdminInput id="oath-finale-title" placeholder={d.title} {...register('finale.title')} />
      </AdminFormField>
      <AdminFormField label="Body" htmlFor="oath-finale-body" className="sm:col-span-2">
        <AdminTextarea id="oath-finale-body" rows={2} placeholder={d.body} {...register('finale.body')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA label" htmlFor="oath-finale-cta1-label">
        <AdminInput id="oath-finale-cta1-label" placeholder={d.primaryCta.label} {...register('finale.primaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA link" htmlFor="oath-finale-cta1-href">
        <AdminInput id="oath-finale-cta1-href" placeholder={d.primaryCta.href} {...register('finale.primaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA label" htmlFor="oath-finale-cta2-label">
        <AdminInput id="oath-finale-cta2-label" placeholder={d.secondaryCta.label} {...register('finale.secondaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA link" htmlFor="oath-finale-cta2-href">
        <AdminInput id="oath-finale-cta2-href" placeholder={d.secondaryCta.href} {...register('finale.secondaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Tagline" htmlFor="oath-finale-tagline">
        <AdminInput id="oath-finale-tagline" placeholder={d.tagline} {...register('finale.tagline')} />
      </AdminFormField>
    </ContentSection>
  )
}
