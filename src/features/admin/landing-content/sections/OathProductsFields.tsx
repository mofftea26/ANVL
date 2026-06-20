import { Plus, Trash2 } from 'lucide-react'
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

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
      <AdminFormField label="Eyebrow" htmlFor="oath-products-eyebrow">
        <AdminInput id="oath-products-eyebrow" placeholder={d.eyebrow} {...register('products.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Title" htmlFor="oath-products-title">
        <AdminInput id="oath-products-title" placeholder={d.title} {...register('products.title')} />
      </AdminFormField>
      <AdminFormField label="View-all label" htmlFor="oath-products-viewall">
        <AdminInput id="oath-products-viewall" placeholder={d.viewAllLabel} {...register('products.viewAllLabel')} />
      </AdminFormField>

      <div className="sm:col-span-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Product taglines
        </p>
        <div className="mt-3 space-y-3">
          {taglines.fields.map((field, i) => (
            <div key={field.id} className="flex flex-wrap items-end gap-3">
              <AdminFormField
                label="Product slug"
                htmlFor={`oath-tagline-${i}-slug`}
                className="w-full sm:w-64"
              >
                <AdminInput
                  id={`oath-tagline-${i}-slug`}
                  placeholder="the-oath-stringer"
                  {...register(`products.taglines.${i}.slug` as const)}
                />
              </AdminFormField>
              <AdminFormField
                label="Tagline"
                htmlFor={`oath-tagline-${i}-line`}
                className="min-w-0 flex-1"
              >
                <AdminInput
                  id={`oath-tagline-${i}-line`}
                  placeholder="Old-school cut. Built for range, heat, and hard training."
                  {...register(`products.taglines.${i}.line` as const)}
                />
              </AdminFormField>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => taglines.remove(i)}
                aria-label={`Remove tagline ${i + 1}`}
              >
                Remove
              </AdminButton>
            </div>
          ))}
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => taglines.append({ slug: '', line: '' })}
          >
            Add tagline
          </AdminButton>
        </div>
      </div>
    </ContentSection>
  )
}
