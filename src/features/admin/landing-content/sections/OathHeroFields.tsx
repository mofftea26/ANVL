import type { UseFormRegister } from 'react-hook-form'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.hero

export function OathHeroFields({
  register,
}: {
  register: UseFormRegister<OathContentFormValues>
}) {
  return (
    <ContentSection
      title="Hero — Genesis"
      previewTarget={{ kind: 'content-field', id: 'the-oath:hero' }}
      hint="The scroll-scrubbed video opening. Headline drives the word reveal."
    >
      <FormField label="Eyebrow" htmlFor="oath-hero-eyebrow" labelStyle="stacked">
        <Input id="oath-hero-eyebrow" placeholder={d.eyebrow} {...register('hero.eyebrow')} density="compact" />
      </FormField>
      <FormField label="Headline" htmlFor="oath-hero-headline" labelStyle="stacked">
        <Input id="oath-hero-headline" placeholder={d.headline} {...register('hero.headline')} density="compact" />
      </FormField>
      <FormField label="Subhead" htmlFor="oath-hero-subhead" className="sm:col-span-2" labelStyle="stacked">
        <Textarea id="oath-hero-subhead" rows={2} placeholder={d.subhead} {...register('hero.subhead')} density="compact" />
      </FormField>
      <FormField label="Primary CTA label" htmlFor="oath-hero-cta1-label" labelStyle="stacked">
        <Input id="oath-hero-cta1-label" placeholder={d.primaryCta.label} {...register('hero.primaryCtaLabel')} density="compact" />
      </FormField>
      <FormField
        label="Primary CTA link"
        htmlFor="oath-hero-cta1-href"
        hint="Relative path (/shop), #anchor, or https URL."
        labelStyle="stacked"
      >
        <Input id="oath-hero-cta1-href" placeholder={d.primaryCta.href} {...register('hero.primaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA label" htmlFor="oath-hero-cta2-label" labelStyle="stacked">
        <Input id="oath-hero-cta2-label" placeholder={d.secondaryCta.label} {...register('hero.secondaryCtaLabel')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA link" htmlFor="oath-hero-cta2-href" labelStyle="stacked">
        <Input id="oath-hero-cta2-href" placeholder={d.secondaryCta.href} {...register('hero.secondaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Scroll cue" htmlFor="oath-hero-cue" labelStyle="stacked">
        <Input id="oath-hero-cue" placeholder={d.scrollCue} {...register('hero.scrollCue')} density="compact" />
      </FormField>
    </ContentSection>
  )
}
