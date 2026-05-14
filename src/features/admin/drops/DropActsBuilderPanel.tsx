import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { LandingActSlot } from '@/features/admin/drops/drops.actSequence'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { landingContentToSimpleActs } from '@/features/admin/drops/acts/landingActs.seed'

const NATURE_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'manifesto', label: 'Manifesto' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'dropReveal', label: 'Drop reveal' },
  { value: 'productShowcase', label: 'Product showcase' },
  { value: 'materialShowcase', label: 'Material showcase' },
  { value: 'specialEvent', label: 'Special event' },
  { value: 'lookbook', label: 'Lookbook' },
  { value: 'newsletterWaitlist', label: 'Newsletter / waitlist' },
  { value: 'finalCTA', label: 'Final CTA' },
] as const

const PRESETS: Record<string, readonly string[]> = {
  hero: ['theOathCinematic', 'splitProduct', 'minimalEmblem'],
  manifesto: ['oathStampLedger', 'splitText', 'scrollStacked'],
  storytelling: ['chapterScroll', 'editorialArticle', 'imageLed'],
  dropReveal: ['monolithReveal', 'countdownTrio', 'emblemFirst'],
  productShowcase: ['threeCardEditorial', 'carousel', 'productStory'],
  materialShowcase: ['fabricRunway', 'specsGrid', 'splitDetail'],
  specialEvent: ['eventCard', 'countdownEvent', 'locationSplit'],
  lookbook: ['masonry', 'carousel', 'editorial'],
  newsletterWaitlist: ['oathFullWidthForm', 'minimalForm', 'splitForm'],
  finalCTA: ['centered', 'footerOverlap', 'productCta'],
}

function slotKeyForNature(nature: string): LandingActSlot['key'] | null {
  switch (nature) {
    case 'hero':
      return 'hero'
    case 'manifesto':
    case 'storytelling':
      return 'manifesto'
    case 'dropReveal':
      return 'dropReveal'
    case 'productShowcase':
      return 'pieces'
    case 'materialShowcase':
      return 'materials'
    case 'newsletterWaitlist':
      return 'waitlist'
    default:
      return null
  }
}

function syncSequence(
  acts: LandingAct[],
  previous: LandingActSlot[],
): LandingActSlot[] {
  const base = defaultLandingActSequence()
  const prevByKey = new Map(previous.map((s) => [s.key, s.enabled]))
  return base.map((slot) => {
    const mapped = acts.some(
      (a) => a.isEnabled && slotKeyForNature(a.nature) === slot.key,
    )
    if (mapped) return { ...slot, enabled: true }
    const was = prevByKey.get(slot.key)
    return { ...slot, enabled: was !== false }
  })
}

const fieldClass =
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]'

type Props = {
  landingContentJson: string
  acts: LandingAct[]
  landingActSequence: LandingActSlot[]
  onChange: (next: {
    acts: LandingAct[]
    landingActSequence: LandingActSlot[]
  }) => void
}

export function DropActsBuilderPanel({
  landingContentJson,
  acts,
  landingActSequence,
  onChange,
}: Props) {
  const seeded = useRef(false)

  const sorted = useMemo(
    () => [...acts].sort((a, b) => a.sortOrder - b.sortOrder),
    [acts],
  )

  const emit = useCallback(
    (nextActs: LandingAct[]) => {
      onChange({
        acts: nextActs,
        landingActSequence: syncSequence(nextActs, landingActSequence),
      })
    },
    [landingActSequence, onChange],
  )

  const bootstrapFromLanding = useCallback(() => {
    try {
      const lc = JSON.parse(landingContentJson) as Parameters<
        typeof landingContentToSimpleActs
      >[0]
      emit(landingContentToSimpleActs(lc))
    } catch {
      /* ignore */
    }
  }, [emit, landingContentJson])

  useEffect(() => {
    if (acts.length > 0 || seeded.current) return
    seeded.current = true
    bootstrapFromLanding()
  }, [acts.length, bootstrapFromLanding])

  function removeAct(id: string) {
    emit(acts.filter((a) => a.id !== id).map((a, i) => ({ ...a, sortOrder: i })))
  }

  function moveAct(id: string, dir: -1 | 1) {
    const list = [...sorted]
    const idx = list.findIndex((a) => a.id === id)
    if (idx < 0) return
    const swap = idx + dir
    if (swap < 0 || swap >= list.length) return
    ;[list[idx], list[swap]] = [list[swap], list[idx]]
    emit(list.map((a, i) => ({ ...a, sortOrder: i })))
  }

  function updateAct(id: string, patch: Partial<LandingAct>) {
    emit(acts.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function addAct() {
    const nature = 'hero'
    const preset = PRESETS[nature]?.[0] ?? 'default'
    const next: LandingAct = {
      id: createCmsId('act'),
      nature,
      preset,
      isEnabled: true,
      sortOrder: acts.length,
      title: '',
      animation: mergeActAnimationConfig(),
      content: safeParseActContent(nature, {}),
    }
    emit([...acts, next])
  }

  return (
    <AdminCard
      title="Acts builder"
      description="Configure act order, visibility, nature, presets, and copy. Legacy section fields remain below for fine edits."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--color-heading)]"
          onClick={bootstrapFromLanding}
        >
          Reset acts from landing copy
        </button>
        <button
          type="button"
          className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--color-heading)]"
          onClick={addAct}
        >
          Add act
        </button>
      </div>

      <div className="space-y-4">
        {sorted.map((act) => (
          <div
            key={act.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/30 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  checked={act.isEnabled}
                  onChange={(e) =>
                    updateAct(act.id, { isEnabled: e.target.checked })
                  }
                />
                On
              </label>
              <span className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
                #{act.sortOrder + 1}
              </span>
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[10px] uppercase"
                  onClick={() => moveAct(act.id, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[10px] uppercase"
                  onClick={() => moveAct(act.id, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="rounded border border-red-500/40 px-2 py-0.5 text-[10px] uppercase text-red-300"
                  onClick={() => removeAct(act.id)}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-[var(--color-text-muted)]">
                Nature
                <select
                  className={fieldClass}
                  value={act.nature}
                  onChange={(e) => {
                    const nature = e.target.value
                    const preset = PRESETS[nature]?.[0] ?? 'default'
                    updateAct(act.id, {
                      nature,
                      preset,
                      content: safeParseActContent(nature, act.content ?? {}),
                    })
                  }}
                >
                  {NATURE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Preset
                <select
                  className={fieldClass}
                  value={act.preset}
                  onChange={(e) => updateAct(act.id, { preset: e.target.value })}
                >
                  {(PRESETS[act.nature] ?? ['default']).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Eyebrow
                <input
                  className={fieldClass}
                  value={act.eyebrow ?? ''}
                  onChange={(e) => updateAct(act.id, { eyebrow: e.target.value })}
                />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Title
                <input
                  className={fieldClass}
                  value={act.title ?? ''}
                  onChange={(e) => updateAct(act.id, { title: e.target.value })}
                />
              </label>
              <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                Subtitle
                <input
                  className={fieldClass}
                  value={act.subtitle ?? ''}
                  onChange={(e) =>
                    updateAct(act.id, { subtitle: e.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                Body
                <textarea
                  className={`${fieldClass} min-h-[72px]`}
                  value={act.body ?? ''}
                  onChange={(e) => updateAct(act.id, { body: e.target.value })}
                />
              </label>
            </div>

            {act.nature === 'productShowcase' ? (
              <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                Product grid uses drop-assigned products in preview and on the live homepage.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </AdminCard>
  )
}
