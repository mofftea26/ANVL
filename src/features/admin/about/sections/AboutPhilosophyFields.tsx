import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.philosophy

export function AboutPhilosophyFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection
      title="Philosophy — Pressure. Repetition. Discipline."
      hint="Each non-empty row is one masked reveal line (max 6)."
    >
      <AdminFormField label="Eyebrow" htmlFor="about-philosophy-eyebrow">
        <AdminInput id="about-philosophy-eyebrow" placeholder={d.eyebrow} {...register('philosophy.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Lines (one per row)" htmlFor="about-philosophy-lines" className="sm:col-span-2">
        <AdminTextarea
          id="about-philosophy-lines"
          rows={5}
          placeholder={d.lines.join('\n')}
          {...register('philosophy.linesText')}
        />
      </AdminFormField>
    </ContentSection>
  )
}
