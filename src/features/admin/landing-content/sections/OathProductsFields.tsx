import { Plus, Trash2 } from 'lucide-react'
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const d = OATH_DEFAULT_CONTENT.products

export function OathProductsFields({
  register,
  taglines,
}: {
  register: UseFormRegister<OathContentFormValues>
  taglines: UseFieldArrayReturn<OathContentFormValues, 'products.taglines'>
}) {
  return (
    <ContentSection
      title="Products — The Arsenal"
      hint="Live catalog pieces render here; taglines attach by product slug."
    >
      <FormField label="Eyebrow" htmlFor="oath-products-eyebrow" labelStyle="stacked">
        <Input id="oath-products-eyebrow" placeholder={d.eyebrow} {...register('products.eyebrow')} density="compact" />
      </FormField>
      <FormField label="Title" htmlFor="oath-products-title" labelStyle="stacked">
        <Input id="oath-products-title" placeholder={d.title} {...register('products.title')} density="compact" />
      </FormField>
      <FormField label="View-all label" htmlFor="oath-products-viewall" labelStyle="stacked">
        <Input id="oath-products-viewall" placeholder={d.viewAllLabel} {...register('products.viewAllLabel')} density="compact" />
      </FormField>

      <div className="sm:col-span-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Product taglines
        </p>
        <div className="mt-3 space-y-3">
          {taglines.fields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap items-end gap-3">
              <FormField
                label="Product slug"
                htmlFor={`oath-tagline-${i}-slug`}
                className="w-full sm:w-64"
                labelStyle="stacked"
              >
                <Input
                  id={`oath-tagline-${i}-slug`}
                  placeholder="the-oath-stringer"
                  {...register(`products.taglines.${i}.slug` as const)}
                  density="compact"
                />
              </FormField>
              <FormField
                label="Tagline"
                htmlFor={`oath-tagline-${i}-line`}
                className="min-w-0 flex-1"
                labelStyle="stacked"
              >
                <Input
                  id={`oath-tagline-${i}-line`}
                  placeholder="Old-school cut. Built for range, heat, and hard training."
                  {...register(`products.taglines.${i}.line` as const)}
                  density="compact"
                />
              </FormField>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                density="compact"
                onClick={() => taglines.remove(i)}
                aria-label={`Remove tagline ${i + 1}`}
              >
                <Trash2 size={ICON_SIZE.sm} />
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            onClick={() => taglines.append({ slug: '', line: '' })}
          >
            <Plus size={ICON_SIZE.sm} />
            Add tagline
          </Button>
        </div>
      </div>
    </ContentSection>
  )
}
