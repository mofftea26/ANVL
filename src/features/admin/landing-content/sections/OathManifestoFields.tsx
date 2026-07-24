import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { StringListField } from '@/features/admin/components/StringListField'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.manifesto

export function OathManifestoFields({
  register,
  control,
  setValue,
}: {
  register: UseFormRegister<OathContentFormValues>
  control: Control<OathContentFormValues>
  setValue: UseFormSetValue<OathContentFormValues>
}) {
  const lines = useWatch({ control, name: 'manifesto.lines' }) ?? []

  return (
    <ContentSection
      title="Manifesto — The Creed"
      previewTarget={{ kind: 'content-field', id: 'the-oath:manifesto' }}
      hint="Each row is one masked manifesto line (max 6). Add, edit, and reorder them."
    >
      <FormField label="Eyebrow" htmlFor="oath-manifesto-eyebrow" labelStyle="stacked">
        <Input
          id="oath-manifesto-eyebrow"
          placeholder={d.eyebrow}
          {...register('manifesto.eyebrow')}
          density="compact"
        />
      </FormField>
      <FormField label="Lines" className="sm:col-span-2" labelStyle="stacked">
        <StringListField
          items={lines}
          onChange={(next) => setValue('manifesto.lines', next, { shouldDirty: true })}
          addLabel="Add line"
          itemLabel="line"
          placeholder={d.lines[0] ?? 'A manifesto line'}
          maxItems={6}
        />
      </FormField>
    </ContentSection>
  )
}
