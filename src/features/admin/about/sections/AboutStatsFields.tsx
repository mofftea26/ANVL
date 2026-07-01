import { Plus, Trash2 } from 'lucide-react'
import type { UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import { createBlankStatFormValues, type AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.stats

/**
 * Fun facts / stats strip. A free-form list (add/remove), up to 8 — numeric
 * values ("500", "100", "3") count up on scroll; non-numeric values (a city
 * name, "N/A") just fade in as static text.
 */
export function AboutStatsFields({
  register,
  items,
}: {
  register: UseFormRegister<AboutContentFormValues>
  items: UseFieldArrayReturn<AboutContentFormValues, 'stats.items'>
}) {
  return (
    <ContentSection
      title="Fun Facts — By The Numbers"
      hint='Numeric values count up on scroll. Non-numeric values (e.g. a city name) just fade in.'
    >
      <AdminFormField label="Eyebrow" htmlFor="about-stats-eyebrow">
        <AdminInput id="about-stats-eyebrow" placeholder={d.eyebrow} {...register('stats.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Title" htmlFor="about-stats-title">
        <AdminInput id="about-stats-title" placeholder={d.title} {...register('stats.title')} />
      </AdminFormField>

      <div className="sm:col-span-2">
        <div className="space-y-3">
          {items.fields.map((field, i) => {
            const def = d.items[i]
            return (
              <div key={field.id} className="flex flex-wrap items-end gap-3">
                <AdminFormField label="Label" htmlFor={`about-stat-${i}-label`} className="min-w-0 flex-1">
                  <AdminInput
                    id={`about-stat-${i}-label`}
                    placeholder={def?.label ?? 'Fun fact label'}
                    {...register(`stats.items.${i}.label` as const)}
                  />
                </AdminFormField>
                <AdminFormField label="Value" htmlFor={`about-stat-${i}-value`} className="w-28">
                  <AdminInput
                    id={`about-stat-${i}-value`}
                    placeholder={def?.value ?? '100'}
                    {...register(`stats.items.${i}.value` as const)}
                  />
                </AdminFormField>
                <AdminFormField label="Suffix" htmlFor={`about-stat-${i}-suffix`} className="w-20">
                  <AdminInput
                    id={`about-stat-${i}-suffix`}
                    placeholder={def?.suffix || '%'}
                    {...register(`stats.items.${i}.suffix` as const)}
                  />
                </AdminFormField>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => items.remove(i)}
                  aria-label={`Remove fun fact ${i + 1}`}
                >
                  Remove
                </AdminButton>
              </div>
            )
          })}
        </div>
        {items.fields.length < 8 ? (
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            className="mt-3"
            onClick={() => items.append(createBlankStatFormValues())}
          >
            Add fun fact
          </AdminButton>
        ) : null}
      </div>
    </ContentSection>
  )
}
