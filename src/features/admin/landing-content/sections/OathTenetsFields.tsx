import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.tenets

export function OathTenetsFields({
  register,
}: {
  register: UseFormRegister<OathContentFormValues>
}) {
  return (
    <ContentSection
      title="Four Tenets"
      hint="The pinned horizontal panorama. Position is fixed; copy is yours."
    >
      <AdminFormField label="Eyebrow" htmlFor="oath-tenets-eyebrow" className="sm:col-span-2">
        <AdminInput id="oath-tenets-eyebrow" placeholder={d.eyebrow} {...register('tenets.eyebrow')} />
      </AdminFormField>

      {d.items.map((tenet, i) => (
        <fieldset
          key={tenet.id}
          className="rounded-lg border border-[var(--color-line)] p-4 sm:col-span-2"
        >
          <legend className="anvl-display px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
            Tenet {tenet.index}
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminFormField label="Title" htmlFor={`oath-tenet-${i}-title`}>
              <AdminInput
                id={`oath-tenet-${i}-title`}
                placeholder={tenet.title}
                {...register(`tenets.items.${i}.title` as const)}
              />
            </AdminFormField>
            <AdminFormField label="Line" htmlFor={`oath-tenet-${i}-line`}>
              <AdminInput
                id={`oath-tenet-${i}-line`}
                placeholder={tenet.line}
                {...register(`tenets.items.${i}.line` as const)}
              />
            </AdminFormField>
            <AdminFormField label="Marker" htmlFor={`oath-tenet-${i}-marker`}>
              <AdminInput
                id={`oath-tenet-${i}-marker`}
                placeholder={tenet.marker}
                {...register(`tenets.items.${i}.marker` as const)}
              />
            </AdminFormField>
          </div>
        </fieldset>
      ))}
    </ContentSection>
  )
}
