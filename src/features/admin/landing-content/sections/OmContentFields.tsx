import { Plus, Trash2 } from 'lucide-react'
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { OM_DEFAULT_CONTENT } from '@/features/landingPages/pages/OathModern/content/oathModernContent.defaults'
import type { OmContentFormValues } from '../omLandingContentForm'
import { ContentSection } from './ContentSection'

const d = OM_DEFAULT_CONTENT

/**
 * The Oath Modern landing content editor body — per-chapter copy for the six-act
 * ceremonial journey: Threshold (hero), Pressure (vows), Formation (marks), The
 * Oath (sworn lines), The Armory (collection + taglines by slug), and The Vow
 * (conversion + reassurances). Blank fields fall back to the designed defaults
 * (rendered as placeholders).
 */
export function OmContentFields({
  register,
  taglines,
}: {
  register: UseFormRegister<OmContentFormValues>
  taglines: UseFieldArrayReturn<OmContentFormValues, 'collection.taglines'>
}) {
  return (
    <>
      <ContentSection
        title="I — Threshold"
        hint="The entrance: the campaign vow + the staged 3D garment. Highlight words render in the wax-metal ink."
      >
        <AdminFormField label="Eyebrow" htmlFor="om-th-eyebrow">
          <AdminInput id="om-th-eyebrow" placeholder={d.threshold.eyebrow} {...register('threshold.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Heading" htmlFor="om-th-heading">
          <AdminInput id="om-th-heading" placeholder={d.threshold.heading} {...register('threshold.heading')} />
        </AdminFormField>
        <AdminFormField label="Highlight words" htmlFor="om-th-highlight" hint="Comma-separated words within the heading to accent.">
          <AdminInput id="om-th-highlight" placeholder={d.threshold.highlightWords.join(', ')} {...register('threshold.highlightWordsText')} />
        </AdminFormField>
        <AdminFormField label="Scroll prompt" htmlFor="om-th-scroll">
          <AdminInput id="om-th-scroll" placeholder={d.threshold.scrollPrompt} {...register('threshold.scrollPrompt')} />
        </AdminFormField>
        <AdminFormField label="Body" htmlFor="om-th-body" className="sm:col-span-2">
          <AdminTextarea id="om-th-body" rows={2} placeholder={d.threshold.body} {...register('threshold.body')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA label" htmlFor="om-th-cta1l">
          <AdminInput id="om-th-cta1l" placeholder={d.threshold.primaryCta.label} {...register('threshold.primaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA link" htmlFor="om-th-cta1h" hint="Relative path, #anchor, or https URL.">
          <AdminInput id="om-th-cta1h" placeholder={d.threshold.primaryCta.href} {...register('threshold.primaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA label" htmlFor="om-th-cta2l">
          <AdminInput id="om-th-cta2l" placeholder={d.threshold.secondaryCta.label} {...register('threshold.secondaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA link" htmlFor="om-th-cta2h">
          <AdminInput id="om-th-cta2h" placeholder={d.threshold.secondaryCta.href} {...register('threshold.secondaryCtaHref')} />
        </AdminFormField>
      </ContentSection>

      <ContentSection title="II — Pressure" hint="The four forging forces, sworn as vows (label + line).">
        <AdminFormField label="Eyebrow" htmlFor="om-pr-eyebrow">
          <AdminInput id="om-pr-eyebrow" placeholder={d.pressure.eyebrow} {...register('pressure.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Heading" htmlFor="om-pr-heading">
          <AdminInput id="om-pr-heading" placeholder={d.pressure.heading} {...register('pressure.heading')} />
        </AdminFormField>
        <AdminFormField label="Body" htmlFor="om-pr-body" className="sm:col-span-2">
          <AdminTextarea id="om-pr-body" rows={2} placeholder={d.pressure.body} {...register('pressure.body')} />
        </AdminFormField>
        {d.pressure.vows.map((def, i) => (
          <AdminFormField key={def.id} label={`Vow ${i + 1}`} htmlFor={`om-vow-${i}`} className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput id={`om-vow-${i}`} placeholder={def.label} {...register(`pressure.vows.${i}.label` as const)} />
              <AdminInput aria-label={`Vow ${i + 1} line`} placeholder={def.line} {...register(`pressure.vows.${i}.line` as const)} />
            </div>
          </AdminFormField>
        ))}
      </ContentSection>

      <ContentSection title="III — Formation" hint="Forged-not-sewn construction marks (label + line).">
        <AdminFormField label="Eyebrow" htmlFor="om-fo-eyebrow">
          <AdminInput id="om-fo-eyebrow" placeholder={d.formation.eyebrow} {...register('formation.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Heading" htmlFor="om-fo-heading">
          <AdminInput id="om-fo-heading" placeholder={d.formation.heading} {...register('formation.heading')} />
        </AdminFormField>
        <AdminFormField label="Body" htmlFor="om-fo-body" className="sm:col-span-2">
          <AdminTextarea id="om-fo-body" rows={2} placeholder={d.formation.body} {...register('formation.body')} />
        </AdminFormField>
        {d.formation.marks.map((def, i) => (
          <AdminFormField key={def.id} label={`Mark ${i + 1}`} htmlFor={`om-mark-${i}`} className="sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput id={`om-mark-${i}`} placeholder={def.label} {...register(`formation.marks.${i}.label` as const)} />
              <AdminInput aria-label={`Mark ${i + 1} line`} placeholder={def.line} {...register(`formation.marks.${i}.line` as const)} />
            </div>
          </AdminFormField>
        ))}
      </ContentSection>

      <ContentSection title="IV — The Oath" hint="The sworn creed (the orbital moment). One line per row.">
        <AdminFormField label="Eyebrow" htmlFor="om-oa-eyebrow">
          <AdminInput id="om-oa-eyebrow" placeholder={d.oath.eyebrow} {...register('oath.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Heading" htmlFor="om-oa-heading">
          <AdminInput id="om-oa-heading" placeholder={d.oath.heading} {...register('oath.heading')} />
        </AdminFormField>
        <AdminFormField label="Oath lines" htmlFor="om-oa-lines" className="sm:col-span-2" hint="One sworn line per row.">
          <AdminTextarea id="om-oa-lines" rows={4} placeholder={d.oath.lines.join('\n')} {...register('oath.linesText')} />
        </AdminFormField>
        <AdminFormField label="Attribution" htmlFor="om-oa-attr" className="sm:col-span-2">
          <AdminInput id="om-oa-attr" placeholder={d.oath.attribution} {...register('oath.attribution')} />
        </AdminFormField>
      </ContentSection>

      <ContentSection title="V — The Armory" hint="Live catalog pieces render here; taglines attach by product slug.">
        <AdminFormField label="Eyebrow" htmlFor="om-ar-eyebrow">
          <AdminInput id="om-ar-eyebrow" placeholder={d.collection.eyebrow} {...register('collection.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="om-ar-title">
          <AdminInput id="om-ar-title" placeholder={d.collection.title} {...register('collection.title')} />
        </AdminFormField>
        <AdminFormField label="View-all label" htmlFor="om-ar-viewall">
          <AdminInput id="om-ar-viewall" placeholder={d.collection.viewAllLabel} {...register('collection.viewAllLabel')} />
        </AdminFormField>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Product taglines</p>
          <div className="mt-3 space-y-3">
            {taglines.fields.map((field, i) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3">
                <AdminFormField label="Product slug" htmlFor={`om-tagline-${i}-slug`} className="w-full sm:w-64">
                  <AdminInput id={`om-tagline-${i}-slug`} placeholder="compression-tee" {...register(`collection.taglines.${i}.slug` as const)} />
                </AdminFormField>
                <AdminFormField label="Tagline" htmlFor={`om-tagline-${i}-line`} className="min-w-0 flex-1">
                  <AdminInput id={`om-tagline-${i}-line`} placeholder="The second skin. Sworn to the muscle." {...register(`collection.taglines.${i}.line` as const)} />
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

      <ContentSection title="VI — The Vow" hint="The final purchase moment — strong close, CTAs, and reassurance.">
        <AdminFormField label="Eyebrow" htmlFor="om-cv-eyebrow">
          <AdminInput id="om-cv-eyebrow" placeholder={d.conversion.eyebrow} {...register('conversion.eyebrow')} />
        </AdminFormField>
        <AdminFormField label="Title" htmlFor="om-cv-title">
          <AdminInput id="om-cv-title" placeholder={d.conversion.title} {...register('conversion.title')} />
        </AdminFormField>
        <AdminFormField label="Body" htmlFor="om-cv-body" className="sm:col-span-2">
          <AdminTextarea id="om-cv-body" rows={2} placeholder={d.conversion.body} {...register('conversion.body')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA label" htmlFor="om-cv-cta1l">
          <AdminInput id="om-cv-cta1l" placeholder={d.conversion.primaryCta.label} {...register('conversion.primaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Primary CTA link" htmlFor="om-cv-cta1h">
          <AdminInput id="om-cv-cta1h" placeholder={d.conversion.primaryCta.href} {...register('conversion.primaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA label" htmlFor="om-cv-cta2l">
          <AdminInput id="om-cv-cta2l" placeholder={d.conversion.secondaryCta.label} {...register('conversion.secondaryCtaLabel')} />
        </AdminFormField>
        <AdminFormField label="Secondary CTA link" htmlFor="om-cv-cta2h">
          <AdminInput id="om-cv-cta2h" placeholder={d.conversion.secondaryCta.href} {...register('conversion.secondaryCtaHref')} />
        </AdminFormField>
        <AdminFormField label="Tagline" htmlFor="om-cv-tagline">
          <AdminInput id="om-cv-tagline" placeholder={d.conversion.tagline} {...register('conversion.tagline')} />
        </AdminFormField>
        <AdminFormField label="Reassurances" htmlFor="om-cv-reassure" className="sm:col-span-2" hint="One line per row (delivery / returns / sizing).">
          <AdminTextarea id="om-cv-reassure" rows={3} placeholder={d.conversion.reassurances.join('\n')} {...register('conversion.reassurancesText')} />
        </AdminFormField>
      </ContentSection>
    </>
  )
}
