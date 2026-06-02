import { useMemo, useState } from 'react'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { cinematicConfigSchema } from '@/features/admin/drops/acts/landingActs.zod'
import type { DropLandingContent } from '@/features/admin/drops/drops.types'
import { defaultCinematicConfig } from '@/features/marketing/cinematic-hero/cinematicHero.defaults'
import type { CinematicConfig } from '@/features/marketing/cinematic-hero/cinematicHero.types'
import { CinematicHeroGlobalSettings } from './CinematicHeroGlobalSettings'
import {
  CinematicHeroSectionEditor,
  CinematicHeroSectionList,
} from './CinematicHeroSectionList'
import { createEmptyCinematicSection } from './CinematicHeroSectionForm'

type CinematicHeroEditorProps = {
  act: LandingAct
  landingContent: DropLandingContent
  patchContent: (patch: Record<string, unknown>) => void
}

function readConfig(
  content: Record<string, unknown> | undefined,
  landingContent: DropLandingContent,
): CinematicConfig {
  const parsed = cinematicConfigSchema.safeParse(content?.cinematicConfig)
  if (parsed.success && parsed.data.sections.length > 0) {
    return {
      enabled: parsed.data.enabled ?? true,
      scrollLength: parsed.data.scrollLength ?? 'standard',
      navMode: parsed.data.navMode ?? 'auto',
      backgroundMode: parsed.data.backgroundMode ?? 'video',
      reducedMotionFallback: parsed.data.reducedMotionFallback ?? {
        mode: 'stack',
        showAllSections: true,
      },
      sections: [...parsed.data.sections].sort((a, b) => a.sortOrder - b.sortOrder),
    }
  }
  return defaultCinematicConfig(landingContent)
}

export function CinematicHeroEditor({
  act,
  landingContent,
  patchContent,
}: CinematicHeroEditorProps) {
  const content = (act.content ?? {}) as Record<string, unknown>
  const config = useMemo(
    () => readConfig(content, landingContent),
    [content, landingContent],
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    () => config.sections[0]?.id ?? null,
  )

  const pushConfig = (next: CinematicConfig) => {
    patchContent({ cinematicConfig: next })
  }

  const selected =
    config.sections.find((s) => s.id === selectedId) ?? config.sections[0] ?? null

  return (
    <AdminPanel variant="inset" className="mt-3 space-y-4">
      <div>
        <AdminMicroHeading>Cinematic scroll hero</AdminMicroHeading>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Pinned scroll beats on desktop; stacked sections on mobile and reduced motion.
        </p>
      </div>

      <CinematicHeroGlobalSettings
        config={config}
        onChange={(patch) => pushConfig({ ...config, ...patch })}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Sections
            </p>
            <button
              type="button"
              className="text-xs text-[var(--color-accent)] underline"
              onClick={() => {
                const section = createEmptyCinematicSection(config.sections.length)
                pushConfig({ ...config, sections: [...config.sections, section] })
                setSelectedId(section.id)
              }}
            >
              Add section
            </button>
          </div>
          <CinematicHeroSectionList
            sections={config.sections}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onReorder={(sections) => pushConfig({ ...config, sections })}
            onToggle={(id, enabled) =>
              pushConfig({
                ...config,
                sections: config.sections.map((s) =>
                  s.id === id ? { ...s, isEnabled: enabled } : s,
                ),
              })
            }
          />
        </div>
        <CinematicHeroSectionEditor
          section={selected}
          onChange={(section) =>
            pushConfig({
              ...config,
              sections: config.sections.map((s) => (s.id === section.id ? section : s)),
            })
          }
        />
      </div>
    </AdminPanel>
  )
}
