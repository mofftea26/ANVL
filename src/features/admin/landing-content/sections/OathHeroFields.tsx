import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
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
      hint="The scroll-scrubbed video opening. Headline drives the word reveal."
    >
      <AdminFormField label="Eyebrow" htmlFor="oath-hero-eyebrow">
        <AdminInput id="oath-hero-eyebrow" placeholder={d.eyebrow} {...register('hero.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Headline" htmlFor="oath-hero-headline">
        <AdminInput id="oath-hero-headline" placeholder={d.headline} {...register('hero.headline')} />
      </AdminFormField>
      <AdminFormField label="Subhead" htmlFor="oath-hero-subhead" className="sm:col-span-2">
        <AdminTextarea id="oath-hero-subhead" rows={2} placeholder={d.subhead} {...register('hero.subhead')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA label" htmlFor="oath-hero-cta1-label">
        <AdminInput id="oath-hero-cta1-label" placeholder={d.primaryCta.label} {...register('hero.primaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField
        label="Primary CTA link"
        htmlFor="oath-hero-cta1-href"
        hint="Relative path (/shop), #anchor, or https URL."
      >
        <AdminInput id="oath-hero-cta1-href" placeholder={d.primaryCta.href} {...register('hero.primaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA label" htmlFor="oath-hero-cta2-label">
        <AdminInput id="oath-hero-cta2-label" placeholder={d.secondaryCta.label} {...register('hero.secondaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA link" htmlFor="oath-hero-cta2-href">
        <AdminInput id="oath-hero-cta2-href" placeholder={d.secondaryCta.href} {...register('hero.secondaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Scroll cue" htmlFor="oath-hero-cue">
        <AdminInput id="oath-hero-cue" placeholder={d.scrollCue} {...register('hero.scrollCue')} />
      </AdminFormField>
    </ContentSection>
  )
}
