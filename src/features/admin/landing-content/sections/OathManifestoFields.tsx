import type { UseFormRegister } from 'react-hook-form'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import type { OathContentFormValues } from '../landingContentForm'
import { ContentSection } from './ContentSection'

const d = OATH_DEFAULT_CONTENT.manifesto

export function OathManifestoFields({
  register,
}: {
  register: UseFormRegister<OathContentFormValues>
}) {
  return (
    <ContentSection
      title="Manifesto — The Creed"
      hint="Each non-empty row is one masked manifesto line (max 6)."
    >
      <FormField label="Eyebrow" htmlFor="oath-manifesto-eyebrow" labelStyle="stacked">
        <Input
          id="oath-manifesto-eyebrow"
          placeholder={d.eyebrow}
          {...register('manifesto.eyebrow')}
          density="compact"
        />
      </FormField>
      <FormField
        label="Lines (one per row)"
        htmlFor="oath-manifesto-lines"
        className="sm:col-span-2"
        labelStyle="stacked"
      >
        <Textarea
          id="oath-manifesto-lines"
          rows={4}
          placeholder={d.lines.join('\n')}
          {...register('manifesto.linesText')}
          density="compact"
        />
      </FormField>
    </ContentSection>
  )
}
