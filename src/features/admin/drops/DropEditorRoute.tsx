import { Link, useNavigate } from '@tanstack/react-router'
import { Check, ExternalLink, Eye, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import { DropEditorLivePreview } from '@/features/admin/drops/DropEditorLivePreview'
import { DropLandingActsEditor } from '@/features/admin/drops/DropLandingActsEditor'
import type { DropStatus } from '@/features/admin/drops/drops.types'
import {
  deleteDrop,
  resetDropToDefaults,
  saveDrop,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import {
  collectDropDraftErrors,
  type DropFieldErrors,
} from '@/features/admin/drops/drops.editor.validation'
import { useDropsList } from '@/features/admin/drops/useDrops'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getAdminProducts } from '@/features/admin/products/products.service'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import { composeLandingPageFromDrop } from '@/features/admin/drops/drops.compose'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { Button } from '@/shared/components/ui/Button'
import { ColorField } from '@/shared/components/ui/ColorField'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'

function padDt(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function isoToDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${padDt(d.getMonth() + 1)}-${padDt(d.getDate())}T${padDt(d.getHours())}:${padDt(d.getMinutes())}`
}

function localInputToIso(local: string): string | undefined {
  if (!local.trim()) return undefined
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

const fieldClass =
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-ring'

const fieldErrorClass = 'border-red-500/60 bg-red-500/5'

type TabId =
  | 'basics'
  | 'visuals'
  | 'theme'
  | 'landing'
  | 'products'
  | 'seo'

type LeaveEmptyMap = Partial<{
  logoImageUrl: boolean
  wordmarkImageUrl: boolean
  heroImageUrl: boolean
  loadingEmblemUrl: boolean
}>

/** Field error label used under inline inputs. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-[11px] text-red-300">
      {message}
    </p>
  )
}

export function DropEditorRoute({ dropId }: { dropId: string }) {
  const navigate = useNavigate()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const drops = useDropsList()
  const catalog = useAdminProductsList()
  const saved = useMemo(() => drops.find((d) => d.id === dropId), [drops, dropId])

  const [draft, setDraft] = useState(saved)
  const [tab, setTab] = useState<TabId>('basics')
  const [makeActiveAfterSave, setMakeActiveAfterSave] = useState(false)
  const [leaveEmpty, setLeaveEmpty] = useState<LeaveEmptyMap>({})

  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmActivateOnly, setConfirmActivateOnly] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraft(saved)
  }, [saved])

  // ---- All hooks above this gate ----
  const errors: DropFieldErrors = useMemo(() => {
    if (!draft) return { summary: [], fields: {} }
    return collectDropDraftErrors(draft, drops)
  }, [draft, drops])
  const hasErrors = errors.summary.length > 0

  const previewLabel = useMemo(
    () => (draft ? `${draft.dropNumber}: ${draft.name}` : ''),
    [draft],
  )

  const previewProducts = useMemo(() => {
    if (!draft) return []
    const map = new Map(getAdminProducts().map((p) => [p.id, p]))
    return draft.productIds
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter(adminProductIsPubliclyVisible)
      .map((p) => adminProductToLegacy(p, previewLabel))
  }, [draft, previewLabel])

  const previewLanding = useMemo(
    () =>
      draft ? composeLandingPageFromDrop(draft, getWebsiteLayoutContent()) : null,
    [draft],
  )

  if (!saved || !draft || !previewLanding) {
    return (
      <AdminLayout title="Drop not found" description="This drop does not exist in storage.">
        <AdminCard title="Missing drop">
          <p className="text-sm text-[var(--color-text-muted)]">
            The editor could not resolve this drop id.
          </p>
          <Link
            to="/admin/drops"
            className="mt-4 inline-flex text-[var(--color-heading)] underline"
          >
            Back to drops
          </Link>
        </AdminCard>
      </AdminLayout>
    )
  }

  const tabDefs: Array<{ id: TabId; label: string; badge?: string }> = [
    { id: 'basics', label: 'Basics' },
    { id: 'theme', label: 'Theme' },
    { id: 'visuals', label: 'Visuals' },
    { id: 'landing', label: 'Acts' },
    { id: 'products', label: 'Products' },
    { id: 'seo', label: 'SEO' },
  ]

  // Annotate tab labels with error indicator dots for quick navigation
  const tabWithErrors = (id: TabId): boolean => {
    const prefixes: Record<TabId, string> = {
      basics: 'basics',
      theme: 'theme',
      visuals: 'visuals',
      landing: 'landing',
      products: 'products',
      seo: 'seo',
    }
    const prefix = prefixes[id]
    return Object.keys(errors.fields).some((k) => k.startsWith(`${prefix}.`))
  }

  function toggleProduct(id: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const has = prev.productIds.includes(id)
      const productIds = has
        ? prev.productIds.filter((x) => x !== id)
        : [...prev.productIds, id]
      return { ...prev, productIds }
    })
  }

  function moveProduct(id: string, dir: -1 | 1) {
    setDraft((prev) => {
      if (!prev) return prev
      const idx = prev.productIds.indexOf(id)
      if (idx === -1) return prev
      const next = [...prev.productIds]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { ...prev, productIds: next }
    })
  }

  function applyPreset(id: string) {
    const preset = DROP_THEME_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            theme: structuredClone(preset),
          }
        : prev,
    )
  }

  function attemptSave() {
    if (hasErrors) {
      toast.error(`${errors.summary.length} issue(s) to fix before saving.`)
      // Jump to first errored tab automatically
      const order: TabId[] = ['basics', 'theme', 'visuals', 'landing', 'products', 'seo']
      const next = order.find((t) => tabWithErrors(t))
      if (next) setTab(next)
      return
    }
    setConfirmSave(true)
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
          {draft.isActive ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">
              Active drop
            </span>
          ) : null}
          {hasErrors ? (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-red-200">
              {errors.summary.length} validation issue(s)
            </span>
          ) : null}
        </span>
      }
    >
      <AdminSectionHeader
        eyebrow="Drop editor"
        title={draft.name}
        description="Preview-centric: every edit on the right updates the live preview on the left in real time. Save commits changes to storage."
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/drop/${draft.slug}`}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)]"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Live route
            </a>
            {!draft.isActive ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmActivateOnly(true)}
              >
                <Sparkles size={14} className="mr-1" aria-hidden="true" />
                Make active
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              Reset
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={attemptSave}
              aria-disabled={hasErrors || undefined}
              title={hasErrors ? errors.summary.join('\n') : undefined}
            >
              {showSuccess ? (
                <>
                  <Check size={16} className="mr-1.5" aria-hidden="true" />
                  Saved
                </>
              ) : (
                'Save drop'
              )}
            </Button>
          </div>
        }
      />

      <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <input
          type="checkbox"
          checked={makeActiveAfterSave}
          onChange={(e) => setMakeActiveAfterSave(e.target.checked)}
        />
        Activate this drop after saving (deactivates any other active drop)
      </label>

      {/* Preview-centric grid: preview gets the bigger column on large screens. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)] xl:grid-cols-[minmax(0,1.7fr)_460px] xl:gap-8">
        {/* Preview pillar — order-1 on mobile (story-first), order-1 on desktop (left). */}
        <section className="order-1 lg:order-1">
          <AdminCard
            title={
              <span className="inline-flex items-center gap-2">
                <Eye size={16} aria-hidden="true" />
                Live preview
              </span>
            }
            description="Theme, acts, copy, and media render here as you type. Toggle viewport to QA each breakpoint."
            className="lg:sticky lg:top-24"
          >
            <DropEditorLivePreview
              landing={previewLanding}
              products={previewProducts}
              palette={draft.theme}
              emblemUrl={draft.visuals.emblemImageUrl}
            />
          </AdminCard>
        </section>

        {/* Editor side panel — compact, scrolls independently. */}
        <section className="order-2 min-w-0 space-y-5 lg:order-2">
          <div
            role="tablist"
            aria-label="Drop editor sections"
            className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-1.5 backdrop-blur"
          >
            {tabDefs.map((t) => {
              const hasError = tabWithErrors(t.id)
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  type="button"
                  className={cn(
                    'focus-ring inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition',
                    tab === t.id
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
                  )}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {hasError ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-red-400"
                    />
                  ) : null}
                </button>
              )
            })}
          </div>

          {tab === 'basics' ? (
            <AdminCard title="Basics" description="Identity surfaced across admin and routing.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Drop name (internal)
                  <input
                    className={cn(
                      fieldClass,
                      errors.fields['basics.name'] && fieldErrorClass,
                    )}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                  <FieldError message={errors.fields['basics.name']} />
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Drop number
                  <input
                    className={fieldClass}
                    value={draft.dropNumber}
                    onChange={(e) =>
                      setDraft({ ...draft, dropNumber: e.target.value })
                    }
                  />
                </label>
                <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                  Slug (URL: /drop/&lt;slug&gt;)
                  <input
                    className={cn(
                      fieldClass,
                      errors.fields['basics.slug'] && fieldErrorClass,
                    )}
                    value={draft.slug}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                  />
                  <FieldError message={errors.fields['basics.slug']} />
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Status
                  <select
                    className={fieldClass}
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        status: e.target.value as DropStatus,
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Release date (optional)
                  <input
                    type="datetime-local"
                    className={cn(
                      fieldClass,
                      errors.fields['basics.releaseDate'] && fieldErrorClass,
                    )}
                    value={isoToDatetimeLocalValue(draft.releaseDate)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        releaseDate: e.target.value
                          ? localInputToIso(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <FieldError message={errors.fields['basics.releaseDate']} />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Title (public)
                  <input
                    className={cn(
                      fieldClass,
                      errors.fields['basics.title'] && fieldErrorClass,
                    )}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                  <FieldError message={errors.fields['basics.title']} />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Subtitle
                  <input
                    className={fieldClass}
                    value={draft.subtitle}
                    onChange={(e) =>
                      setDraft({ ...draft, subtitle: e.target.value })
                    }
                  />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Description
                  <textarea
                    className={`${fieldClass} min-h-[96px]`}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
              </div>
            </AdminCard>
          ) : null}

          {tab === 'theme' ? (
            <AdminCard
              title="Theme palette"
              description="Pick a preset or fine-tune every token. Each picker exposes hex, RGB, and an opacity slider; rgba(…) is used automatically whenever opacity is below 1."
            >
              <label className="text-xs text-[var(--color-text-muted)]">
                Palette preset
                <select
                  className={fieldClass}
                  value={
                    DROP_THEME_PRESETS.find((p) => p.id === draft.theme.id)
                      ? draft.theme.id
                      : ''
                  }
                  onChange={(e) =>
                    e.target.value ? applyPreset(e.target.value) : undefined
                  }
                >
                  <option value="">Custom (no preset)</option>
                  {DROP_THEME_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-xs text-[var(--color-text-muted)]">
                Palette display name
                <input
                  className={fieldClass}
                  value={draft.theme.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      theme: { ...draft.theme, name: e.target.value },
                    })
                  }
                />
              </label>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(Object.entries(draft.theme.colors) as Array<
                  [keyof typeof draft.theme.colors, string | undefined]
                >).map(([key, val]) => (
                  <ColorField
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').trim()}
                    value={val}
                    withAlpha
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        theme: {
                          ...draft.theme,
                          colors: {
                            ...draft.theme.colors,
                            [key]: next,
                          },
                        },
                      })
                    }
                  />
                ))}
              </div>
            </AdminCard>
          ) : null}

          {tab === 'visuals' ? (
            <AdminCard
              title="Visuals"
              description="Drop emblem, logo lockups, and hero backdrop. Empty fields default to the bundled ANVL crest; check “Leave empty (no fallback)” to render nothing."
            >
              <div className="space-y-4">
                <MediaPickerField
                  label="Drop emblem"
                  kind="image"
                  hint="Mark used in hero / manifesto / join slots."
                  value={draft.visuals.emblemImageUrl}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      visuals: { ...draft.visuals, emblemImageUrl: next },
                    })
                  }
                  fallback="crest"
                />
                <label className="block text-xs text-[var(--color-text-muted)]">
                  Emblem alt text
                  <input
                    className={cn(
                      fieldClass,
                      errors.fields['visuals.emblemAlt'] && fieldErrorClass,
                    )}
                    value={draft.visuals.emblemAlt}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, emblemAlt: e.target.value },
                      })
                    }
                  />
                  <FieldError message={errors.fields['visuals.emblemAlt']} />
                </label>

                <MediaPickerField
                  label="Drop page hero backdrop"
                  hint="Optional large mood image behind /drop/:slug hero."
                  kind="any"
                  value={draft.visuals.heroImageUrl ?? ''}
                  leaveEmpty={leaveEmpty.heroImageUrl}
                  onLeaveEmptyChange={(v) =>
                    setLeaveEmpty((prev) => ({ ...prev, heroImageUrl: v }))
                  }
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      visuals: {
                        ...draft.visuals,
                        heroImageUrl: next || undefined,
                      },
                    })
                  }
                  error={errors.fields['visuals.heroImageUrl']}
                  fallback="crest"
                />

                <MediaPickerField
                  label="Drop logo (optional)"
                  kind="image"
                  hint="Campaign lockup — leave empty to inherit the official ANVL crest."
                  value={draft.visuals.logoImageUrl ?? ''}
                  leaveEmpty={leaveEmpty.logoImageUrl}
                  onLeaveEmptyChange={(v) =>
                    setLeaveEmpty((prev) => ({ ...prev, logoImageUrl: v }))
                  }
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      visuals: { ...draft.visuals, logoImageUrl: next || undefined },
                    })
                  }
                  error={errors.fields['visuals.logoImageUrl']}
                  fallback="crest"
                />

                <MediaPickerField
                  label="Wordmark (optional)"
                  kind="image"
                  hint="Wide lockup asset for marquee surfaces."
                  value={draft.visuals.wordmarkImageUrl ?? ''}
                  leaveEmpty={leaveEmpty.wordmarkImageUrl}
                  onLeaveEmptyChange={(v) =>
                    setLeaveEmpty((prev) => ({ ...prev, wordmarkImageUrl: v }))
                  }
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      visuals: {
                        ...draft.visuals,
                        wordmarkImageUrl: next || undefined,
                      },
                    })
                  }
                  error={errors.fields['visuals.wordmarkImageUrl']}
                  fallback="crest"
                />

                <MediaPickerField
                  label="Loading emblem"
                  kind="image"
                  hint="Crest shown during initial mark hydration. Default: ANVL crest."
                  value={draft.visuals.loadingEmblemUrl ?? ''}
                  leaveEmpty={leaveEmpty.loadingEmblemUrl}
                  onLeaveEmptyChange={(v) =>
                    setLeaveEmpty((prev) => ({ ...prev, loadingEmblemUrl: v }))
                  }
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      visuals: {
                        ...draft.visuals,
                        loadingEmblemUrl: next || undefined,
                      },
                    })
                  }
                  error={errors.fields['visuals.loadingEmblemUrl']}
                  fallback="crest"
                />
              </div>
            </AdminCard>
          ) : null}

          {tab === 'landing' ? (
            <DropLandingActsEditor
              value={draft.landingContent}
              onChange={(landingContent) =>
                setDraft({ ...draft, landingContent })
              }
              acts={draft.acts}
              landingActSequence={draft.landingActSequence}
              onActsChange={({ acts, landingActSequence }) =>
                setDraft({ ...draft, acts, landingActSequence })
              }
              catalogProducts={catalog.map((c) => ({ id: c.id, name: c.name }))}
            />
          ) : null}

          {tab === 'products' ? (
            <AdminCard
              title="Products in this drop"
              description="Selections sync both drop.productIds and product.dropIds."
            >
              <div className="space-y-2">
                {catalog.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    No catalog products yet.{' '}
                    <Link
                      to="/admin/products/new"
                      className="text-[var(--color-heading)] underline-offset-4 hover:underline"
                    >
                      Create one →
                    </Link>
                  </p>
                ) : null}
                {catalog.map((p) => {
                  const checked = draft.productIds.includes(p.id)
                  const idx = draft.productIds.indexOf(p.id)
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm transition',
                        checked
                          ? 'border-[var(--color-accent)]/40 bg-[var(--color-surface-elevated)]'
                          : 'border-[var(--color-line)] bg-[var(--color-bg)]/40',
                      )}
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                        />
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          ${p.price}
                        </span>
                      </label>
                      {checked ? (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx <= 0}
                            onClick={() => moveProduct(p.id, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === draft.productIds.length - 1}
                            onClick={() => moveProduct(p.id, 1)}
                          >
                            ↓
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              <Link
                to="/admin/products/new"
                className="mt-4 inline-flex text-xs uppercase tracking-[0.18em] text-[var(--color-heading)] underline-offset-4 hover:underline"
              >
                Create product →
              </Link>
            </AdminCard>
          ) : null}

          {tab === 'seo' ? (
            <AdminCard
              title="SEO"
              description="Per-drop metadata used by the homepage compose target and /drop/:slug share unfurls."
            >
              <div className="grid gap-4">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Title{' '}
                  <span className="ml-1 text-[10px] text-[var(--color-text-muted)]/70">
                    ({draft.seo.title.length}/70)
                  </span>
                  <input
                    className={cn(
                      fieldClass,
                      errors.fields['seo.title'] && fieldErrorClass,
                    )}
                    value={draft.seo.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, title: e.target.value },
                      })
                    }
                  />
                  <FieldError message={errors.fields['seo.title']} />
                </label>
                <label className="text-xs text-[var(--color-text-muted)]">
                  Description{' '}
                  <span className="ml-1 text-[10px] text-[var(--color-text-muted)]/70">
                    ({draft.seo.description.length}/200)
                  </span>
                  <textarea
                    className={cn(
                      `${fieldClass} min-h-[96px]`,
                      errors.fields['seo.description'] && fieldErrorClass,
                    )}
                    value={draft.seo.description}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, description: e.target.value },
                      })
                    }
                  />
                  <FieldError message={errors.fields['seo.description']} />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-[var(--color-text-muted)]">
                    OG title
                    <input
                      className={fieldClass}
                      value={draft.seo.ogTitle ?? ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          seo: { ...draft.seo, ogTitle: e.target.value },
                        })
                      }
                    />
                  </label>
                  <div>
                    <MediaPickerField
                      label="OG image"
                      kind="image"
                      hint="Used by social unfurls. Optional."
                      value={draft.seo.ogImage ?? ''}
                      onChange={(next) =>
                        setDraft({
                          ...draft,
                          seo: { ...draft.seo, ogImage: next || undefined },
                        })
                      }
                      fallback="none"
                      error={errors.fields['seo.ogImage']}
                    />
                  </div>
                </div>
                <label className="text-xs text-[var(--color-text-muted)]">
                  OG description
                  <textarea
                    className={`${fieldClass} min-h-[72px]`}
                    value={draft.seo.ogDescription ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, ogDescription: e.target.value },
                      })
                    }
                  />
                </label>
              </div>
            </AdminCard>
          ) : null}
        </section>
      </div>

      <Modal open={confirmSave} onClose={() => setConfirmSave(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">
            {makeActiveAfterSave ? 'Save & activate drop?' : 'Save this drop?'}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {makeActiveAfterSave
              ? 'This will make this drop active and deactivate all other drops.'
              : 'Updates persist only in this browser until a backend ships.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmSave(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                saveDrop(draft, { makeActive: makeActiveAfterSave })
                toast.success('Drop saved.')
                flashSuccess()
                setConfirmSave(false)
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmActivateOnly} onClose={() => setConfirmActivateOnly(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Make this drop active?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            This will deactivate the currently active drop and update the public landing page.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmActivateOnly(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveDrop(draft.id)
                toast.success('Active drop updated.')
                setDraft({ ...draft, isActive: true, status: 'active' })
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
          <p className="text-sm text-[var(--color-text-muted)]">
            Restores landing defaults while keeping this drop&apos;s id and slug.
          </p>
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
          <p className="text-sm text-[var(--color-text-muted)]">
            Removes the drop locally. At least one drop always remains — defaults will respawn if needed.
          </p>
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
                navigate({ to: '/admin/drops' })
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
