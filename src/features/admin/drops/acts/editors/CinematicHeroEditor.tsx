import { Plus, Trash2 } from 'lucide-react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFieldLabel } from '@/features/admin/components/AdminFieldLabel'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'

function readCta(
  c: Record<string, unknown>,
  key: string,
): { label: string; href: string } {
  const v = c[key]
  if (v && typeof v === 'object' && v !== null) {
    const o = v as Record<string, unknown>
    return {
      label: typeof o.label === 'string' ? o.label : '',
      href: typeof o.href === 'string' ? o.href : '',
    }
  }
  return { label: '', href: '' }
}

function readStr(c: Record<string, unknown>, key: string): string {
  const v = c[key]
  return typeof v === 'string' ? v : ''
}

type MetaRow = { id: string; label: string; value: string }

function readMetaRows(c: Record<string, unknown>): MetaRow[] {
  const raw = c.metaItems
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      return {
        id:
          typeof o.id === 'string' && o.id.trim()
            ? o.id.trim()
            : createCmsId('meta'),
        label: typeof o.label === 'string' ? o.label : '',
        value: typeof o.value === 'string' ? o.value : '',
      }
    })
    .filter(Boolean) as MetaRow[]
}

type Props = {
  act: LandingAct
  dropSlug?: string
  patchContent: (patch: Record<string, unknown>) => void
}

export function CinematicHeroEditor({ act, dropSlug, patchContent }: Props) {
  const c = act.content ?? {}
  const p = readCta(c, 'primaryCta')
  const s = readCta(c, 'secondaryCta')
  const metaRows = readMetaRows(c)
  const supabaseUpload = dropSlug?.trim()
    ? { dropSlug: dropSlug.trim(), role: 'hero' as const }
    : undefined
  const videoUpload = dropSlug?.trim()
    ? { dropSlug: dropSlug.trim(), role: 'media' as const }
    : undefined

  const setMetaRows = (rows: MetaRow[]) => {
    patchContent({
      metaItems: rows.map((row) => ({
        id: row.id,
        label: row.label,
        value: row.value,
      })),
    })
  }

  return (
    <div className="mt-3 space-y-4 border-t border-[var(--color-line)]/60 pt-3">
      <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        Full-screen cinematic hero with scroll-out into the next act below. Edit
        copy in Eyebrow / Title / Subtitle above; use this panel for backdrop
        media, buttons, and the meta strip.
      </p>

      <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em]">
        Background
      </AdminMicroHeading>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <MediaPickerField
            label="Poster image"
            kind="image"
            hint="Shown on mobile, while video loads, and when reduced motion is on."
            value={readStr(c, 'backgroundImageUrl')}
            onChange={(next) =>
              patchContent({ backgroundImageUrl: next || undefined })
            }
            fallback="crest"
            supabaseUpload={supabaseUpload}
          />
        </div>
        <div className="md:col-span-2">
          <MediaPickerField
            label="Background video (optional)"
            kind="video"
            hint="Looping .mp4 / .webm — upload to Supabase or paste a CDN URL."
            value={readStr(c, 'backgroundVideoUrl')}
            onChange={(next) =>
              patchContent({ backgroundVideoUrl: next || undefined })
            }
            fallback="none"
            supabaseUpload={videoUpload}
          />
        </div>
        <AdminCheckbox
          className="md:col-span-2 py-0"
          checked={c.playVideoOnMobile === true}
          onChange={(e) =>
            patchContent({ playVideoOnMobile: e.target.checked || undefined })
          }
          label="Play background video on mobile (default: poster only)"
        />
      </div>

      <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em]">
        Emblem
      </AdminMicroHeading>
      <MediaPickerField
        label="Hero watermark / crest"
        kind="image"
        hint="Overrides the drop emblem for this act only."
        value={readStr(c, 'emblemWatermarkSrc')}
        onChange={(next) =>
          patchContent({ emblemWatermarkSrc: next || undefined })
        }
        fallback="crest"
        supabaseUpload={supabaseUpload}
      />

      <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em]">
        Actions
      </AdminMicroHeading>
      <div className="grid gap-3 md:grid-cols-2">
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA label
          <AdminInput
            value={p.label}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Primary CTA href
          <AdminInput
            value={p.href}
            onChange={(e) =>
              patchContent({ primaryCta: { ...p, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA label
          <AdminInput
            value={s.label}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, label: e.target.value } })
            }
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Secondary CTA href
          <AdminInput
            value={s.href}
            onChange={(e) =>
              patchContent({ secondaryCta: { ...s, href: e.target.value } })
            }
          />
        </AdminFieldLabel>
      </div>

      <AdminMicroHeading as="p" className="text-[10px] tracking-[0.14em]">
        Meta strip (optional)
      </AdminMicroHeading>
      <div className="space-y-2">
        {metaRows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-md border border-[var(--color-line)]/50 p-2 md:grid-cols-[1fr_1fr_auto]"
          >
            <AdminFieldLabel labelStyle="stacked" className="block">
              Label
              <AdminInput
                value={row.label}
                onChange={(e) => {
                  const next = [...metaRows]
                  next[index] = { ...row, label: e.target.value }
                  setMetaRows(next)
                }}
              />
            </AdminFieldLabel>
            <AdminFieldLabel labelStyle="stacked" className="block">
              Value
              <AdminInput
                value={row.value}
                onChange={(e) => {
                  const next = [...metaRows]
                  next[index] = { ...row, value: e.target.value }
                  setMetaRows(next)
                }}
              />
            </AdminFieldLabel>
            <div className="flex items-end">
              <AdminButton
                type="button"
                variant="secondary"
                size="sm"
                className="text-red-300"
                onClick={() => setMetaRows(metaRows.filter((_, i) => i !== index))}
                aria-label={`Remove meta row ${index + 1}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </AdminButton>
            </div>
          </div>
        ))}
        {metaRows.length < 6 ? (
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setMetaRows([
                ...metaRows,
                { id: createCmsId('meta'), label: '', value: '' },
              ])
            }
          >
            <Plus size={14} className="me-1.5" aria-hidden="true" />
            Add meta row
          </AdminButton>
        ) : null}
      </div>

      <AdminFieldLabel labelStyle="stacked" className="block md:max-w-md">
        Countdown target (ISO datetime)
        <AdminInput
          value={readStr(c, 'countdownTargetIso')}
          onChange={(e) =>
            patchContent({ countdownTargetIso: e.target.value || undefined })
          }
        />
      </AdminFieldLabel>
    </div>
  )
}
