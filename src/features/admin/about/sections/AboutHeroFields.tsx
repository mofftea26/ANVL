import type { UseFormRegister } from 'react-hook-form'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.hero

export function AboutHeroFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection title="Hero — Origin" hint="The opening scene. Headline drives the word reveal.">
      <FormField label="Eyebrow" htmlFor="about-hero-eyebrow" labelStyle="stacked">
        <Input id="about-hero-eyebrow" placeholder={d.eyebrow} {...register('hero.eyebrow')} density="compact" />
      </FormField>
      <FormField label="Headline" htmlFor="about-hero-headline" labelStyle="stacked">
        <Input id="about-hero-headline" placeholder={d.headline} {...register('hero.headline')} density="compact" />
      </FormField>
      <FormField label="Subhead" htmlFor="about-hero-subhead" className="sm:col-span-2" labelStyle="stacked">
        <Textarea id="about-hero-subhead" rows={2} placeholder={d.subhead} {...register('hero.subhead')} density="compact" />
      </FormField>
      <FormField label="Primary CTA label" htmlFor="about-hero-cta1-label" labelStyle="stacked">
        <Input id="about-hero-cta1-label" placeholder={d.primaryCta.label} {...register('hero.primaryCtaLabel')} density="compact" />
      </FormField>
      <FormField
        label="Primary CTA link"
        htmlFor="about-hero-cta1-href"
        hint="Relative path (/shop), #anchor, or https URL."
        labelStyle="stacked"
      >
        <Input id="about-hero-cta1-href" placeholder={d.primaryCta.href} {...register('hero.primaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA label" htmlFor="about-hero-cta2-label" labelStyle="stacked">
        <Input id="about-hero-cta2-label" placeholder={d.secondaryCta.label} {...register('hero.secondaryCtaLabel')} density="compact" />
      </FormField>
      <FormField label="Secondary CTA link" htmlFor="about-hero-cta2-href" labelStyle="stacked">
        <Input id="about-hero-cta2-href" placeholder={d.secondaryCta.href} {...register('hero.secondaryCtaHref')} density="compact" />
      </FormField>
      <FormField label="Scroll cue" htmlFor="about-hero-cue" labelStyle="stacked">
        <Input id="about-hero-cue" placeholder={d.scrollCue} {...register('hero.scrollCue')} density="compact" />
      </FormField>
    </ContentSection>
  )
}
