import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
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
      <AdminFormField label="Eyebrow" htmlFor="oath-manifesto-eyebrow">
        <AdminInput
          id="oath-manifesto-eyebrow"
          placeholder={d.eyebrow}
          {...register('manifesto.eyebrow')}
        />
      </AdminFormField>
      <AdminFormField
        label="Lines (one per row)"
        htmlFor="oath-manifesto-lines"
        className="sm:col-span-2"
      >
        <AdminTextarea
          id="oath-manifesto-lines"
          rows={4}
          placeholder={d.lines.join('\n')}
          {...register('manifesto.linesText')}
        />
      </AdminFormField>
    </ContentSection>
  )
}
