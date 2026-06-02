import { useState } from 'react'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import type { CinematicHeroSection } from '@/features/marketing/cinematic-hero/cinematicHero.types'
import { CinematicHeroSectionForm } from './CinematicHeroSectionForm'

type CinematicHeroSectionListProps = {
  sections: CinematicHeroSection[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (sections: CinematicHeroSection[]) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function CinematicHeroSectionList({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onToggle,
}: CinematicHeroSectionListProps) {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((s) => s.id === id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= sorted.length) return
    const next = [...sorted]
    const tmp = next[idx]!
    next[idx] = next[target]!
    next[target] = tmp
    onReorder(next.map((s, i) => ({ ...s, sortOrder: i })))
  }

  return (
    <ul className="space-y-2">
      {sorted.map((section) => (
        <li key={section.id}>
          <button
            type="button"
            onClick={() => onSelect(section.id)}
            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
              selectedId === section.id
                ? 'border-[var(--color-accent)] bg-[var(--color-surface-muted)]'
                : 'border-[var(--color-line)]/50 hover:border-[var(--color-line)]'
            }`}
          >
            <span className={section.isEnabled ? '' : 'opacity-50 line-through'}>
              {section.title || section.heading || `Section ${section.sortOrder + 1}`}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                className="px-1 text-xs"
                aria-label="Move up"
                onClick={(e) => {
                  e.stopPropagation()
                  move(section.id, -1)
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="px-1 text-xs"
                aria-label="Move down"
                onClick={(e) => {
                  e.stopPropagation()
                  move(section.id, 1)
                }}
              >
                ↓
              </button>
              <button
                type="button"
                className="px-1 text-xs"
                aria-label={section.isEnabled ? 'Disable section' : 'Enable section'}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(section.id, !section.isEnabled)
                }}
              >
                {section.isEnabled ? 'On' : 'Off'}
              </button>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

type CinematicHeroSectionEditorProps = {
  section: CinematicHeroSection | null
  onChange: (section: CinematicHeroSection) => void
}

export function CinematicHeroSectionEditor({
  section,
  onChange,
}: CinematicHeroSectionEditorProps) {
  const [tab, setTab] = useState<'content' | 'media' | 'buttons' | 'layout'>('content')
  if (!section) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        Select a section to edit copy, media, buttons, and layout.
      </p>
    )
  }

  return (
    <AdminPanel variant="inset" className="space-y-3">
      <AdminMicroHeading>Cinematic section</AdminMicroHeading>
      <div className="flex flex-wrap gap-2">
        {(['content', 'media', 'buttons', 'layout'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded px-2 py-1 text-xs uppercase tracking-wider ${
              tab === t
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'border border-[var(--color-line)]/50'
            }`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <CinematicHeroSectionForm section={section} tab={tab} onChange={onChange} />
    </AdminPanel>
  )
}
