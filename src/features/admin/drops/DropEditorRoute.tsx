import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import {
  datetimeLocalToScheduledIso,
  scheduledIsoToDatetimeLocal,
  validateDropEditorDraft,
} from '@/features/admin/drops/drops.editor.validation'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import type { Drop } from '@/features/admin/drops/drops.types'
import { deleteDrop, resetDropToDefaults, saveDrop } from '@/features/admin/drops/drops.service'
import { useDropsList } from '@/features/admin/drops/useDrops'
import { Button } from '@/shared/components/ui/Button'
import { HexColorPicker } from '@/shared/components/ui/HexColorPicker'
import { ImageFileOrUrlField } from '@/shared/components/ui/ImageFileOrUrlField'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

const fieldClass =
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm'

function buildPersistedDrop(
  draft: Drop,
  opts: { makeActiveAfterSave: boolean; scheduleEnabled: boolean; scheduleLocal: string },
): Drop {
  const { makeActiveAfterSave, scheduleEnabled, scheduleLocal } = opts
  if (makeActiveAfterSave) return { ...draft, status: 'active', scheduledActivationAt: undefined }
  if (scheduleEnabled) {
    const iso = datetimeLocalToScheduledIso(scheduleLocal)
    if (iso) return { ...draft, status: 'scheduled', scheduledActivationAt: iso }
  }
  let nextStatus = draft.status
  if (draft.status === 'scheduled') nextStatus = 'inactive'
  return { ...draft, status: nextStatus, scheduledActivationAt: undefined }
}

function PreviewPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col justify-center rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)]/40 p-8 text-center xl:min-h-[420px]',
        className,
      )}
    >
      <p className="anvl-heading text-lg font-normal text-[var(--color-heading)]">Preview panel</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--color-text-muted)]">
        Live preview will mount here. Edits stay in memory until you save.
      </p>
    </div>
  )
}

export function DropEditorRoute({ dropId }: { dropId: string }) {
  const drops = useDropsList()
  const saved = useMemo(() => drops.find((d: Drop) => d.id === dropId), [drops, dropId])
  const [draft, setDraft] = useState(saved)
  const [makeActiveAfterSave, setMakeActiveAfterSave] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleLocal, setScheduleLocal] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmActivateOnly, setConfirmActivateOnly] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saveSuccessFlash, setSaveSuccessFlash] = useState(false)
  const [inlineValidationErrors, setInlineValidationErrors] = useState<string[]>([])
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(saved)
  }, [saved])

  useEffect(() => {
    if (!saved) return
    if (saved.scheduledActivationAt) {
      setScheduleEnabled(true)
      setScheduleLocal(scheduledIsoToDatetimeLocal(saved.scheduledActivationAt))
    } else {
      setScheduleEnabled(false)
      setScheduleLocal('')
    }
  }, [saved?.id, saved?.updatedAt, saved?.scheduledActivationAt])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
    }
  }, [])

  if (!saved || !draft) {
    return (
      <AdminLayout title="Drop not found" description="This drop does not exist in storage.">
        <AdminCard title="Missing drop">
          <p className="text-sm text-[var(--color-text-muted)]">The editor could not resolve this drop id.</p>
          <a href="/admin/drops" className="mt-4 inline-flex text-[var(--color-heading)] underline">
            Back to drops
          </a>
        </AdminCard>
      </AdminLayout>
    )
  }

  const persistedPreview = buildPersistedDrop(draft, {
    makeActiveAfterSave,
    scheduleEnabled,
    scheduleLocal,
  })
  const validation = validateDropEditorDraft(persistedPreview)

  function flashSaveSuccess() {
    setSaveSuccessFlash(true)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    successTimerRef.current = setTimeout(() => {
      setSaveSuccessFlash(false)
      successTimerRef.current = null
    }, 2600)
  }

  function requestSave() {
    const nextErrors: string[] = []
    if (!validation.ok) nextErrors.push(...validation.errors)
    if (scheduleEnabled && !makeActiveAfterSave) {
      const iso = datetimeLocalToScheduledIso(scheduleLocal)
      if (!iso) nextErrors.push('Pick a valid date and time for scheduled activation.')
    }
    setInlineValidationErrors(nextErrors)
    if (nextErrors.length) {
      toast.error('Fix the highlighted issues before saving.')
      return
    }
    setConfirmSave(true)
  }

  function applyPreset(id: string) {
    const preset = DROP_THEME_PRESETS.find((x) => x.id === id)
    if (!preset) return
    setDraft((prev) => (prev ? { ...prev, theme: structuredClone(preset) } : prev))
  }

  return (
    <AdminLayout
      layout="wide"
      title={draft.name}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {draft.status}
          </span>
          {draft.scheduledActivationAt ? (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-sky-100/90">
              Scheduled
            </span>
          ) : null}
          {draft.isActive ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
              Active drop
            </span>
          ) : null}
        </span>
      }
    >
      <AdminSectionHeader
        eyebrow="Drop editor"
        title={draft.name}
        description="Draft edits stay on this page until you save — the published drop does not change."
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/drop/${draft.slug}`}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)]"
            >
              Preview live route
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)]"
            >
              View homepage
            </a>
            {!draft.isActive ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmActivateOnly(true)}>
                Make active
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              Reset drop
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        }
      />

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-12">
        <div className="space-y-12">
          <AdminCard title="Basic info" description="Identity and copy.">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="text-xs text-[var(--color-text-muted)]">
                Drop name
                <input className={fieldClass} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Drop number
                <input
                  className={fieldClass}
                  value={draft.dropNumber}
                  onChange={(e) => setDraft({ ...draft, dropNumber: e.target.value })}
                />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Slug
                <input
                  className={fieldClass}
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className="text-xs text-[var(--color-text-muted)]">
                Status (read-only)
                <input className={`${fieldClass} cursor-not-allowed opacity-80`} readOnly value={draft.status} />
              </label>
              <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                Title
                <input className={fieldClass} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </label>
              <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                Subtitle
                <input className={fieldClass} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
              </label>
              <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                Description
                <textarea
                  className={`${fieldClass} min-h-[112px]`}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </label>
            </div>
          </AdminCard>

          <AdminCard title="Theme & branding" description="Palette and emblem assets.">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Palette preset
                  <select className={fieldClass} value={draft.theme.id} onChange={(e) => applyPreset(e.target.value)}>
                    {DROP_THEME_PRESETS.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Palette display name
                  <input
                    className={fieldClass}
                    value={draft.theme.name}
                    onChange={(e) => setDraft({ ...draft, theme: { ...draft.theme, name: e.target.value } })}
                  />
                </label>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.entries(draft.theme.colors) as Array<[string, string | undefined]>).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <span className="block text-xs capitalize text-[var(--color-text-muted)]">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <HexColorPicker
                      value={val}
                      ariaLabel={`Pick ${key.replace(/([A-Z])/g, ' $1').trim()} color`}
                      onChange={(hex: string) =>
                        setDraft({
                          ...draft,
                          theme: { ...draft.theme, colors: { ...draft.theme.colors, [key]: hex } },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-line)] pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Branding</p>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                    Emblem image URL / path
                    <input
                      className={fieldClass}
                      value={draft.visuals.emblemImageUrl}
                      onChange={(e) =>
                        setDraft({ ...draft, visuals: { ...draft.visuals, emblemImageUrl: e.target.value } })
                      }
                    />
                  </label>
                  <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                    Emblem alt
                    <input
                      className={fieldClass}
                      value={draft.visuals.emblemAlt}
                      onChange={(e) => setDraft({ ...draft, visuals: { ...draft.visuals, emblemAlt: e.target.value } })}
                    />
                  </label>
                  <div className="md:col-span-2">
                    <ImageFileOrUrlField
                      label="Logo (optional)"
                      hint="File or path."
                      value={draft.visuals.logoImageUrl ?? ''}
                      onChange={(next: string) =>
                        setDraft({ ...draft, visuals: { ...draft.visuals, logoImageUrl: next } })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ImageFileOrUrlField
                      label="Wordmark (optional)"
                      hint="File or URL/path."
                      value={draft.visuals.wordmarkImageUrl ?? ''}
                      onChange={(next: string) =>
                        setDraft({ ...draft, visuals: { ...draft.visuals, wordmarkImageUrl: next } })
                      }
                    />
                  </div>
                  <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                    Loading emblem URL
                    <input
                      className={fieldClass}
                      value={draft.visuals.loadingEmblemUrl ?? ''}
                      onChange={(e) =>
                        setDraft({ ...draft, visuals: { ...draft.visuals, loadingEmblemUrl: e.target.value } })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Acts builder" description="Landing act sequence.">
            <p className="text-sm text-[var(--color-text-muted)]">
              Placeholder — full builder ships later. Landing content in storage is unchanged until edited elsewhere
              and saved.
            </p>
          </AdminCard>

          <AdminCard title="Products assignment" description="Catalog ↔ drop.">
            <p className="text-sm text-[var(--color-text-muted)]">
              Placeholder — pickers ship later. Linked products:{' '}
              <span className="font-semibold text-[var(--color-heading)]">{draft.productIds.length}</span>
            </p>
            <a
              href="/admin/products"
              className="mt-4 inline-flex text-xs uppercase tracking-[0.18em] text-[var(--color-heading)] underline-offset-4 hover:underline"
            >
              Open catalog →
            </a>
          </AdminCard>

          <AdminCard title="SEO" description="Metadata.">
            <p className="text-sm text-[var(--color-text-muted)]">
              Placeholder — SEO form ships later. Stored SEO still applies until replaced and saved.
            </p>
          </AdminCard>

          <div className="xl:hidden">
            <PreviewPlaceholder />
          </div>

          <AdminCard title="Save & publish" description="Write draft to local CMS storage.">
            <div className="space-y-6">
              {inlineValidationErrors.length ? (
                <ul
                  className="list-inside list-disc space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90"
                  role="alert"
                >
                  {inlineValidationErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : null}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--color-text)]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={makeActiveAfterSave}
                  onChange={(e) => {
                    const on = e.target.checked
                    setMakeActiveAfterSave(on)
                    if (on) {
                      setScheduleEnabled(false)
                      setScheduleLocal('')
                    }
                  }}
                />
                <span>
                  <span className="font-semibold text-[var(--color-heading)]">Make this drop active after saving</span>
                  <span className="mt-1 block text-[var(--color-text-muted)]">Deactivates other drops in this browser.</span>
                </span>
              </label>
              <div className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={scheduleEnabled}
                    disabled={makeActiveAfterSave}
                    onChange={(e) => {
                      const on = e.target.checked
                      setScheduleEnabled(on)
                      if (on) setMakeActiveAfterSave(false)
                      if (!on) setScheduleLocal('')
                    }}
                  />
                  <span className="flex-1">
                    <span className="font-semibold text-[var(--color-heading)]">Schedule activation</span>
                    <span className="mt-1 block text-[var(--color-text-muted)]">
                      Sets status to scheduled (stored for future automation).
                    </span>
                  </span>
                </label>
                {scheduleEnabled && !makeActiveAfterSave ? (
                  <label className="block text-xs text-[var(--color-text-muted)]">
                    Date &amp; time
                    <input
                      type="datetime-local"
                      className={fieldClass}
                      value={scheduleLocal}
                      onChange={(e) => setScheduleLocal(e.target.value)}
                    />
                  </label>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={requestSave}
                  className={cn(saveSuccessFlash && 'ring-2 ring-emerald-400/60')}
                >
                  {saveSuccessFlash ? 'Saved' : 'Save drop'}
                </Button>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {saveSuccessFlash ? 'Stored in this browser.' : 'Opens confirmation before writing.'}
                </span>
              </div>
            </div>
          </AdminCard>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-4">
            <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">Preview</p>
            <PreviewPlaceholder />
          </div>
        </aside>
      </div>

      <Modal open={confirmSave} onClose={() => setConfirmSave(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">
            {makeActiveAfterSave
              ? 'Save and activate this drop?'
              : scheduleEnabled
                ? 'Save with scheduled activation?'
                : 'Save this drop?'}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {makeActiveAfterSave
              ? 'Persist draft, activate this drop, and deactivate others in local storage.'
              : scheduleEnabled
                ? 'Persist draft and mark the drop scheduled with the chosen time.'
                : 'Persist draft to local CMS storage in this browser.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmSave(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const toSave = buildPersistedDrop(draft, {
                  makeActiveAfterSave,
                  scheduleEnabled,
                  scheduleLocal,
                })
                saveDrop(toSave, { makeActive: makeActiveAfterSave })
                toast.success(
                  makeActiveAfterSave
                    ? 'Drop saved and activated.'
                    : scheduleEnabled
                      ? 'Drop saved with schedule.'
                      : 'Drop saved.',
                )
                setConfirmSave(false)
                flashSaveSuccess()
              }}
            >
              Confirm save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmActivateOnly} onClose={() => setConfirmActivateOnly(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Make this drop active?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Deactivates the current active drop in this browser.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmActivateOnly(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const updated = saveDrop(
                  { ...draft, status: 'active', scheduledActivationAt: undefined },
                  { makeActive: true },
                )
                setDraft(updated)
                toast.success('Active drop updated.')
                setConfirmActivateOnly(false)
              }}
            >
              Activate
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Reset drop?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Restores landing defaults; keeps id and slug.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const next = resetDropToDefaults(draft.id)
                if (next) {
                  setDraft(next)
                  toast.success('Drop reset to defaults.')
                }
                setConfirmReset(false)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Delete this drop?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Removes locally; at least one drop remains.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                deleteDrop(draft.id)
                toast.success('Drop removed.')
                setConfirmDelete(false)
                window.location.assign('/admin/drops')
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
