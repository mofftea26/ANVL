import type { UseFormRegister } from 'react-hook-form'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
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
      <FormField label="Eyebrow" htmlFor="oath-finale-eyebrow" labelStyle="stacked">
        <Input id="oath-finale-eyebrow" placeholder={d.eyebrow} {...register('finale.eyebrow')} density="compact" />
      </FormField>
      <FormField label="Title" htmlFor="oath-finale-title" labelStyle="stacked">
        <Input id="oath-finale-title" placeholder={d.title} {...register('finale.title')} density="compact" />
      </FormField>
      <FormField label="Body" htmlFor="oath-finale-body" className="sm:col-span-2" labelStyle="stacked">
        <Textarea id="oath-finale-body" rows={2} placeholder={d.body} {...register('finale.body')} density="compact" />
      </FormField>
      <FormField label="Primary CTA label" htmlFor="oath-finale-cta1-label" labelStyle="stacked">
        <Input id="oath-finale-cta1-label" placeholder={d.primaryCta.label} {...register('finale.primaryCtaLabel')} density="compact" />
      </FormField>
      <FormField label="Primary CTA link" htmlFor="oath-finale-cta1-href" labelStyle="stacked">
        <Input id="oath-finale-cta1-href" placeholder={d.primaryCta.href} {...register('finale.primaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA label" htmlFor="oath-finale-cta2-label" labelStyle="stacked">
        <Input id="oath-finale-cta2-label" placeholder={d.secondaryCta.label} {...register('finale.secondaryCtaLabel')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA link" htmlFor="oath-finale-cta2-href" labelStyle="stacked">
        <Input id="oath-finale-cta2-href" placeholder={d.secondaryCta.href} {...register('finale.secondaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Tagline" htmlFor="oath-finale-tagline" labelStyle="stacked">
        <Input id="oath-finale-tagline" placeholder={d.tagline} {...register('finale.tagline')} density="compact" />
      </FormField>
    </ContentSection>
  )
}
