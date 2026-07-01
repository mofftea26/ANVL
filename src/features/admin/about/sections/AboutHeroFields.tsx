import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.hero

export function AboutHeroFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection title="Hero — Origin" hint="The opening scene. Headline drives the word reveal.">
      <AdminFormField label="Eyebrow" htmlFor="about-hero-eyebrow">
        <AdminInput id="about-hero-eyebrow" placeholder={d.eyebrow} {...register('hero.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Headline" htmlFor="about-hero-headline">
        <AdminInput id="about-hero-headline" placeholder={d.headline} {...register('hero.headline')} />
      </AdminFormField>
      <AdminFormField label="Subhead" htmlFor="about-hero-subhead" className="sm:col-span-2">
        <AdminTextarea id="about-hero-subhead" rows={2} placeholder={d.subhead} {...register('hero.subhead')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA label" htmlFor="about-hero-cta1-label">
        <AdminInput id="about-hero-cta1-label" placeholder={d.primaryCta.label} {...register('hero.primaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField
        label="Primary CTA link"
        htmlFor="about-hero-cta1-href"
        hint="Relative path (/shop), #anchor, or https URL."
      >
        <AdminInput id="about-hero-cta1-href" placeholder={d.primaryCta.href} {...register('hero.primaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA label" htmlFor="about-hero-cta2-label">
        <AdminInput id="about-hero-cta2-label" placeholder={d.secondaryCta.label} {...register('hero.secondaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA link" htmlFor="about-hero-cta2-href">
        <AdminInput id="about-hero-cta2-href" placeholder={d.secondaryCta.href} {...register('hero.secondaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Scroll cue" htmlFor="about-hero-cue">
        <AdminInput id="about-hero-cue" placeholder={d.scrollCue} {...register('hero.scrollCue')} />
      </AdminFormField>
    </ContentSection>
  )
}
