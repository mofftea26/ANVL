import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.marquee

export function AboutMarqueeFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection
      title="Marquee — Type Band"
      hint="The counter-scrolling type band on the mobile/tablet page (the desktop altar has no marquee). Repeats automatically; keep it short."
    >
      <AdminFormField label="Marquee text" htmlFor="about-marquee-text" className="sm:col-span-2">
        <AdminInput id="about-marquee-text" placeholder={d.text} {...register('marquee.text')} />
      </AdminFormField>
    </ContentSection>
  )
}
