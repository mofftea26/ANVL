import type { UseFormRegister } from 'react-hook-form'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { ContentSection } from '@/features/admin/landing-content/sections/ContentSection'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutContentFormValues } from '../aboutContentForm'

const d = ABOUT_DEFAULT_CONTENT.process
const STEP_NAMES = ['Materials', 'Construction', 'Testing'] as const

/**
 * The three forge-process beats (materials, construction, testing) — a fixed
 * count matching the designed scenes, not a free-form list. Construction
 * carries three annotated hotspot slots over its close-up image (position as
 * % over the image, assigned on the Assets page).
 */
export function AboutProcessFields({ register }: { register: UseFormRegister<AboutContentFormValues> }) {
  return (
    <ContentSection title="The Forge — Process" hint="Materials → Construction → Testing.">
      <AdminFormField label="Section eyebrow" htmlFor="about-process-eyebrow">
        <AdminInput id="about-process-eyebrow" placeholder={d.eyebrow} {...register('process.eyebrow')} />
      </AdminFormField>
      <AdminFormField label="Section title" htmlFor="about-process-title">
        <AdminInput id="about-process-title" placeholder={d.title} {...register('process.title')} />
      </AdminFormField>

      {d.steps.map((def, i) => (
        <fieldset key={def.id} className="rounded-lg border border-[var(--color-line)] p-4 sm:col-span-2">
          <legend className="anvl-display px-1 text-[10px] tracking-[0.28em] text-[var(--color-highlight-bright)]">
            {String(i + 1).padStart(2, '0')} · {STEP_NAMES[i]}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="Eyebrow" htmlFor={`about-step-${i}-eyebrow`}>
              <AdminInput id={`about-step-${i}-eyebrow`} placeholder={def.eyebrow} {...register(`process.steps.${i}.eyebrow` as const)} />
            </AdminFormField>
            <AdminFormField label="Title" htmlFor={`about-step-${i}-title`}>
              <AdminInput id={`about-step-${i}-title`} placeholder={def.title} {...register(`process.steps.${i}.title` as const)} />
            </AdminFormField>
            <AdminFormField label="Body" htmlFor={`about-step-${i}-body`} className="sm:col-span-2">
              <AdminTextarea id={`about-step-${i}-body`} rows={3} placeholder={def.body} {...register(`process.steps.${i}.body` as const)} />
            </AdminFormField>
          </div>

          {def.hotspots.length > 0 ? (
            <>
              <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Annotated points on the construction image (label, description, % position)
              </p>
              <div className="mt-3 space-y-4">
                {def.hotspots.map((hsDef, h) => (
                  <div key={hsDef.id} className="grid gap-3 rounded-lg border border-[var(--color-line)] p-3 sm:grid-cols-2">
                    <AdminFormField label={`Point ${h + 1} label`} htmlFor={`about-step-${i}-h-${h}-label`}>
                      <AdminInput
                        id={`about-step-${i}-h-${h}-label`}
                        placeholder={hsDef.label}
                        {...register(`process.steps.${i}.hotspots.${h}.label` as const)}
                      />
                    </AdminFormField>
                    <AdminFormField label="Description" htmlFor={`about-step-${i}-h-${h}-desc`}>
                      <AdminInput
                        id={`about-step-${i}-h-${h}-desc`}
                        placeholder={hsDef.description}
                        {...register(`process.steps.${i}.hotspots.${h}.description` as const)}
                      />
                    </AdminFormField>
                    <AdminFormField label="X (%)" htmlFor={`about-step-${i}-h-${h}-x`}>
                      <AdminInput
                        id={`about-step-${i}-h-${h}-x`}
                        inputMode="numeric"
                        placeholder={String(hsDef.x)}
                        {...register(`process.steps.${i}.hotspots.${h}.x` as const)}
                      />
                    </AdminFormField>
                    <AdminFormField label="Y (%)" htmlFor={`about-step-${i}-h-${h}-y`}>
                      <AdminInput
                        id={`about-step-${i}-h-${h}-y`}
                        inputMode="numeric"
                        placeholder={String(hsDef.y)}
                        {...register(`process.steps.${i}.hotspots.${h}.y` as const)}
                      />
                    </AdminFormField>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </fieldset>
      ))}
    </ContentSection>
  )
}
