import type { UseFormRegister } from 'react-hook-form'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
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
      <FormField label="Marquee text" htmlFor="about-marquee-text" className="sm:col-span-2" labelStyle="stacked">
        <Input id="about-marquee-text" placeholder={d.text} {...register('marquee.text')} density="compact" />
      </FormField>
    </ContentSection>
  )
}
