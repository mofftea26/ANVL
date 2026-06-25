import { Plus, Trash2 } from 'lucide-react'
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { TM_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheoathModern/content/theoathModernContent.defaults'
import type { TmContentFormValues } from '../tmLandingContentForm'
import { ContentSection } from './ContentSection'

const d = TM_DEFAULT_CONTENT

/**
 * Theoath Modern landing content editor body — per-scene copy for hero (incl.
 * hotspots + side index), tech-knit, collection (taglines by slug), benefits,
 * materials (specs + notes), and conversion. Blank fields fall back to the
 * designed defaults (rendered as placeholders).
 */
export function TmContentFields({
  register,
  taglines,
}: {
  register: UseFormRegister<TmContentFormValues>
  taglines: UseFieldArrayReturn<TmContentFormValues, 'collection.taglines'>
}) {
  return (
    <>
      <ContentSection
        title="Hero — Engineered To Endure"
        hint="Editorial headline + the compression-shirt stage. Highlight words render in the champagne ink."
      >
        <AdminFormField label="Eyebrow" htmlFor="tm-hero-eyebrow">
          <AdminInput id="tm-hero-eyebrow" placeholder={d.hero.eyebrow} {...register('hero.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Heading" htmlFor="tm-hero-heading">
          <AdminInput id="tm-hero-heading" placeholder={d.hero.heading} {...register('hero.heading')} />
        </AdminFormField>
        <AdminFormField label="Highlight words" htmlFor="tm-hero-highlight" hint="Comma-separated words within the heading to accent.">
          <AdminInput id="tm-hero-highlight" placeholder={d.hero.highlightWords.join(', ')} {...register('hero.highlightWordsText')} />
        </AdminFormField>
        <AdminFormField label="Scroll prompt" htmlFor="tm-hero-scroll">
          <AdminInput id="tm-hero-scroll" placeholder={d.hero.scrollPrompt} {...register('hero.scrollPrompt')} />
        </AdminFormField>
        <AdminFormField label="Description" htmlFor="tm-hero-desc" className="sm:col-span-2">
          <AdminTextarea id="tm-hero-desc" rows={2} placeholder={d.hero.description} {...register('hero.description')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA label" htmlFor="tm-hero-cta1l">
          <AdminInput id="tm-hero-cta1l" placeholder={d.hero.primaryCta.label} {...register('hero.primaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA link" htmlFor="tm-hero-cta1h" hint="Relative path, #anchor, or https URL.">
          <AdminInput id="tm-hero-cta1h" placeholder={d.hero.primaryCta.href} {...register('hero.primaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA label" htmlFor="tm-hero-cta2l">
          <AdminInput id="tm-hero-cta2l" placeholder={d.hero.secondaryCta.label} {...register('hero.secondaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA link" htmlFor="tm-hero-cta2h">
          <AdminInput id="tm-hero-cta2h" placeholder={d.hero.secondaryCta.href} {...register('hero.secondaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Side index" htmlFor="tm-hero-side" className="sm:col-span-2" hint="One label per line (e.g. 01 — Knit).">
          <AdminTextarea id="tm-hero-side" rows={3} placeholder={d.hero.sideIndex.join('\n')} {...register('hero.sideIndexText')} />
        </AdminFormField>

        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Hotspots (technical callouts, % position over the product)
          </p>
          <div className="mt-3 space-y-4">
            {d.hero.hotspots.map((def, i) => (
              <div key={def.id} className="grid gap-3 rounded-lg border border-[var(--color-line)] p-3 sm:grid-cols-2">
                <AdminFormField label={`Hotspot ${i + 1} label`} htmlFor={`tm-hotspot-${i}-label`}>
                  <AdminInput id={`tm-hotspot-${i}-label`} placeholder={def.label} {...register(`hero.hotspots.${i}.label` as const)} />
                </AdminFormField>
                <AdminFormField label="Line" htmlFor={`tm-hotspot-${i}-line`}>
                  <AdminInput id={`tm-hotspot-${i}-line`} placeholder={def.line} {...register(`hero.hotspots.${i}.line` as const)} />
                </AdminFormField>
                <AdminFormField label="X (%)" htmlFor={`tm-hotspot-${i}-x`}>
                  <AdminInput id={`tm-hotspot-${i}-x`} inputMode="numeric" placeholder={String(def.x)} {...register(`hero.hotspots.${i}.x` as const)} />
                </AdminFormField>
                <AdminFormField label="Y (%)" htmlFor={`tm-hotspot-${i}-y`}>
                  <AdminInput id={`tm-hotspot-${i}-y`} inputMode="numeric" placeholder={String(def.y)} {...register(`hero.hotspots.${i}.y` as const)} />
                </AdminFormField>
              </div>
            ))}
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Tech Knit Laboratory" hint="Macro-knit storytelling and the four construction callouts.">
        <AdminFormField label="Eyebrow" htmlFor="tm-tk-eyebrow">
          <AdminInput id="tm-tk-eyebrow" placeholder={d.techKnit.eyebrow} {...register('techKnit.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="tm-tk-title">
          <AdminInput id="tm-tk-title" placeholder={d.techKnit.title} {...register('techKnit.title')} />
        </AdminFormField>
        <AdminFormField label="Description" htmlFor="tm-tk-desc" className="sm:col-span-2">
          <AdminTextarea id="tm-tk-desc" rows={2} placeholder={d.techKnit.description} {...register('techKnit.description')} />
        </AdminFormField>
        {d.techKnit.callouts.map((def, i) => (
          <AdminFormField key={def.id} label={`Callout ${i + 1}`} htmlFor={`tm-callout-${i}`} className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput id={`tm-callout-${i}`} placeholder={def.label} {...register(`techKnit.callouts.${i}.label` as const)} />
              <AdminInput aria-label={`Callout ${i + 1} line`} placeholder={def.line} {...register(`techKnit.callouts.${i}.line` as const)} />
            </div>
          </AdminFormField>
        ))}
      </ContentSection>

      <ContentSection title="Collection" hint="Live catalog pieces render here; taglines attach by product slug.">
        <AdminFormField label="Eyebrow" htmlFor="tm-col-eyebrow">
          <AdminInput id="tm-col-eyebrow" placeholder={d.collection.eyebrow} {...register('collection.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="tm-col-title">
          <AdminInput id="tm-col-title" placeholder={d.collection.title} {...register('collection.title')} />
        </AdminFormField>
        <AdminFormField label="View-all label" htmlFor="tm-col-viewall">
          <AdminInput id="tm-col-viewall" placeholder={d.collection.viewAllLabel} {...register('collection.viewAllLabel')} />
        </AdminFormField>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Product taglines</p>
          <div className="mt-3 space-y-3">
            {taglines.fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3">
                <AdminFormField label="Product slug" htmlFor={`tm-tagline-${i}-slug`} className="w-full sm:w-64">
                  <AdminInput id={`tm-tagline-${i}-slug`} placeholder="compression-tee" {...register(`collection.taglines.${i}.slug` as const)} />
                </AdminFormField>
                <AdminFormField label="Tagline" htmlFor={`tm-tagline-${i}-line`} className="min-w-0 flex-1">
                  <AdminInput id={`tm-tagline-${i}-line`} placeholder="Dense seamless compression…" {...register(`collection.taglines.${i}.line` as const)} />
                </AdminFormField>
                <AdminButton type="button" variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => taglines.remove(i)} aria-label={`Remove tagline ${i + 1}`}>
                  Remove
                </AdminButton>
              </div>
            ))}
            <AdminButton type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => taglines.append({ slug: '', line: '' })}>
              Add tagline
            </AdminButton>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Performance Benefits" hint="Icon tokens (shield, thermometer, move, droplets, anvil) live in code; edit headings + copy here.">
        <AdminFormField label="Eyebrow" htmlFor="tm-ben-eyebrow">
          <AdminInput id="tm-ben-eyebrow" placeholder={d.benefits.eyebrow} {...register('benefits.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="tm-ben-title">
          <AdminInput id="tm-ben-title" placeholder={d.benefits.title} {...register('benefits.title')} />
        </AdminFormField>
        {d.benefits.items.map((def, i) => (
          <AdminFormField key={def.id} label={`Benefit ${i + 1}`} htmlFor={`tm-benefit-${i}`} className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput id={`tm-benefit-${i}`} placeholder={def.heading} {...register(`benefits.items.${i}.heading` as const)} />
              <AdminInput aria-label={`Benefit ${i + 1} description`} placeholder={def.description} {...register(`benefits.items.${i}.description` as const)} />
            </div>
          </AdminFormField>
        ))}
      </ContentSection>

      <ContentSection title="Materials & Engineering" hint="All figures are CMS/product data — never invented. One note per line.">
        <AdminFormField label="Eyebrow" htmlFor="tm-mat-eyebrow">
          <AdminInput id="tm-mat-eyebrow" placeholder={d.materials.eyebrow} {...register('materials.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="tm-mat-title">
          <AdminInput id="tm-mat-title" placeholder={d.materials.title} {...register('materials.title')} />
        </AdminFormField>
        <AdminFormField label="Description" htmlFor="tm-mat-desc" className="sm:col-span-2">
          <AdminTextarea id="tm-mat-desc" rows={2} placeholder={d.materials.description} {...register('materials.description')} />
        </AdminFormField>
        <AdminFormField label="Construction notes" htmlFor="tm-mat-notes" className="sm:col-span-2" hint="One note per line.">
          <AdminTextarea id="tm-mat-notes" rows={3} placeholder={d.materials.notes.join('\n')} {...register('materials.notesText')} />
        </AdminFormField>
        {d.materials.specs.map((def, i) => (
          <AdminFormField key={`${def.label}-${i}`} label={`Spec ${i + 1}`} htmlFor={`tm-spec-${i}`} className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput id={`tm-spec-${i}`} placeholder={def.label} {...register(`materials.specs.${i}.label` as const)} />
              <AdminInput aria-label={`Spec ${i + 1} value`} placeholder={def.value} {...register(`materials.specs.${i}.value` as const)} />
            </div>
          </AdminFormField>
        ))}
      </ContentSection>

      <ContentSection title="Conversion" hint="The final purchase band — strong close + CTAs.">
        <AdminFormField label="Eyebrow" htmlFor="tm-cv-eyebrow">
          <AdminInput id="tm-cv-eyebrow" placeholder={d.conversion.eyebrow} {...register('conversion.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="tm-cv-title">
          <AdminInput id="tm-cv-title" placeholder={d.conversion.title} {...register('conversion.title')} />
        </AdminFormField>
        <AdminFormField label="Body" htmlFor="tm-cv-body" className="sm:col-span-2">
          <AdminTextarea id="tm-cv-body" rows={2} placeholder={d.conversion.body} {...register('conversion.body')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA label" htmlFor="tm-cv-cta1l">
          <AdminInput id="tm-cv-cta1l" placeholder={d.conversion.primaryCta.label} {...register('conversion.primaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA link" htmlFor="tm-cv-cta1h">
          <AdminInput id="tm-cv-cta1h" placeholder={d.conversion.primaryCta.href} {...register('conversion.primaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA label" htmlFor="tm-cv-cta2l">
          <AdminInput id="tm-cv-cta2l" placeholder={d.conversion.secondaryCta.label} {...register('conversion.secondaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA link" htmlFor="tm-cv-cta2h">
          <AdminInput id="tm-cv-cta2h" placeholder={d.conversion.secondaryCta.href} {...register('conversion.secondaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Tagline" htmlFor="tm-cv-tagline">
          <AdminInput id="tm-cv-tagline" placeholder={d.conversion.tagline} {...register('conversion.tagline')} />
        </AdminFormField>
      </ContentSection>
    </>
  )
}
