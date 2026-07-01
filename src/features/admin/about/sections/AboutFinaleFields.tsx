import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.finale

export function AboutFinaleFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection
      title="Finale — The Oath Continues"
      hint="The closing beat. The brand name beneath it is fixed (global brand rule)."
    >
      <AdminFormField label="Eyebrow" htmlFor="about-finale-eyebrow">
        <AdminInput id="about-finale-eyebrow" placeholder={d.eyebrow} {...register('finale.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Title" htmlFor="about-finale-title">
        <AdminInput id="about-finale-title" placeholder={d.title} {...register('finale.title')} />
      </AdminFormField>
      <AdminFormField label="Body" htmlFor="about-finale-body" className="sm:col-span-2">
        <AdminTextarea id="about-finale-body" rows={2} placeholder={d.body} {...register('finale.body')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA label" htmlFor="about-finale-cta1-label">
        <AdminInput id="about-finale-cta1-label" placeholder={d.primaryCta.label} {...register('finale.primaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Primary CTA link" htmlFor="about-finale-cta1-href">
        <AdminInput id="about-finale-cta1-href" placeholder={d.primaryCta.href} {...register('finale.primaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA label" htmlFor="about-finale-cta2-label">
        <AdminInput id="about-finale-cta2-label" placeholder={d.secondaryCta.label} {...register('finale.secondaryCtaLabel')} />
      </AdminFormField>
      <AdminFormField label="Secondary CTA link" htmlFor="about-finale-cta2-href">
        <AdminInput id="about-finale-cta2-href" placeholder={d.secondaryCta.href} {...register('finale.secondaryCtaHref')} />
      </AdminFormField>
      <AdminFormField label="Tagline" htmlFor="about-finale-tagline">
        <AdminInput id="about-finale-tagline" placeholder={d.tagline} {...register('finale.tagline')} />
      </AdminFormField>
    </ContentSection>
  )
}
