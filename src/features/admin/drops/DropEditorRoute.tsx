import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DropPreviewThemeScope } from '@/app/providers/ActiveDropThemeBridge'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import { DropLandingActsEditor } from '@/features/admin/drops/DropLandingActsEditor'
import type { DropStatus } from '@/features/admin/drops/drops.types'
import {
  deleteDrop,
  resetDropToDefaults,
  saveDrop,
  setActiveDrop,
} from '@/features/admin/drops/drops.service'
import { useDropsList } from '@/features/admin/drops/useDrops'
import {
  adminProductIsPubliclyVisible,
  adminProductToLegacy,
} from '@/features/admin/products/products.mapper'
import { getAdminProducts } from '@/features/admin/products/products.service'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import { composeLandingPageFromDrop } from '@/features/admin/drops/drops.compose'
import { getWebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.service'
import { PublicLandingActs } from '@/features/marketing/public-landing/PublicLandingActs'
import { Button } from '@/shared/components/ui/Button'
import { HexColorPicker } from '@/shared/components/ui/HexColorPicker'
import { ImageFileOrUrlField } from '@/shared/components/ui/ImageFileOrUrlField'
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
  'mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm'

type TabId =
  | 'basics'
  | 'visuals'
  | 'theme'
  | 'landing'
  | 'products'
  | 'seo'
  | 'preview'

export function DropEditorRoute({ dropId }: { dropId: string }) {
  const navigate = useNavigate()
  const drops = useDropsList()
  const catalog = useAdminProductsList()
  const saved = useMemo(() => drops.find((d) => d.id === dropId), [drops, dropId])

  const [draft, setDraft] = useState(saved)
  const [tab, setTab] = useState<TabId>('basics')
  const [makeActiveAfterSave, setMakeActiveAfterSave] = useState(false)

  const [confirmSave, setConfirmSave] = useState(false)
  const [confirmActivateOnly, setConfirmActivateOnly] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraft(saved)
  }, [saved])

  if (!saved || !draft) {
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

  const previewLabel = `${draft.dropNumber}: ${draft.name}`
  const previewProducts = useMemo(() => {
    const map = new Map(getAdminProducts().map((p) => [p.id, p]))
    return draft.productIds
      .map((id) => map.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter(adminProductIsPubliclyVisible)
      .map((p) => adminProductToLegacy(p, previewLabel))
  }, [draft.productIds, previewLabel])

  const tabDefs: Array<{ id: TabId; label: string }> = [
    { id: 'basics', label: 'Basics' },
    { id: 'visuals', label: 'Visuals' },
    { id: 'theme', label: 'Theme' },
    { id: 'landing', label: 'Landing acts' },
    { id: 'products', label: 'Products' },
    { id: 'seo', label: 'SEO' },
    { id: 'preview', label: 'Preview' },
  ]

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

  const previewLanding = useMemo(
    () => composeLandingPageFromDrop(draft, getWebsiteLayoutContent()),
    [draft],
  )

  const previewPanel = (
    <DropPreviewThemeScope palette={draft.theme} emblemUrl={draft.visuals.emblemImageUrl}>
      <div className="pointer-events-none select-none space-y-10 p-4 opacity-95 [&_a]:pointer-events-none">
        <PublicLandingActs
          landing={previewLanding}
          products={previewProducts}
          emblemSrc={draft.visuals.emblemImageUrl}
        />
      </div>
    </DropPreviewThemeScope>
  )

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
        </span>
      }
    >
      <AdminSectionHeader
        eyebrow="Drop editor"
        title={draft.name}
        description="Autosaves only when you confirm — edits stay local until you save."
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
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmActivateOnly(true)}
              >
                Make active
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              Reset drop
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete / archive flow
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={() => setConfirmSave(true)}>
              Save drop
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
        Make this the active drop after saving
      </label>

      <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
        {tabDefs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              'rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em]',
              tab === t.id
                ? 'border-[var(--color-accent)] bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                : 'border-[var(--color-line)] text-[var(--color-text-muted)]',
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-8">
          <div className="hidden flex-wrap gap-2 lg:flex">
            {tabDefs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={cn(
                  'rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em]',
                  tab === t.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                    : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)]',
                )}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'basics' ? (
            <AdminCard title="Basics" description="Identity surfaced across admin and routing.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-[var(--color-text-muted)]">
                  Drop name
                  <input
                    className={fieldClass}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
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
                <label className="text-xs text-[var(--color-text-muted)]">
                  Slug
                  <input
                    className={fieldClass}
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  />
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
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Title
                  <input
                    className={fieldClass}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
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
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Release date (optional)
                  <input
                    type="datetime-local"
                    className={fieldClass}
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
                  <span className="mt-1 block text-[10px] text-[var(--color-text-muted)]">
                    Shown on the public drop page with a live countdown after hydration.
                  </span>
                </label>
              </div>
            </AdminCard>
          ) : null}

          {tab === 'visuals' ? (
            <AdminCard title="Visuals" description="Emblems power hero, manifesto, join section, footer.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                  Emblem image URL / path
                  <input
                    className={fieldClass}
                    value={draft.visuals.emblemImageUrl}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, emblemImageUrl: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                  Emblem alt (informational)
                  <input
                    className={fieldClass}
                    value={draft.visuals.emblemAlt}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, emblemAlt: e.target.value },
                      })
                    }
                  />
                </label>
                <div className="md:col-span-2">
                  <ImageFileOrUrlField
                    label="Drop page hero backdrop (optional)"
                    hint="Large mood image behind the public `/drop/:slug` hero. Path, URL, or embedded file."
                    value={draft.visuals.heroImageUrl ?? ''}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, heroImageUrl: next || undefined },
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageFileOrUrlField
                    label="Logo (optional)"
                    hint="Pick a file to embed for this browser, or paste a path such as /brand/stacked.svg."
                    value={draft.visuals.logoImageUrl ?? ''}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        visuals: { ...draft.visuals, logoImageUrl: next },
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageFileOrUrlField
                    label="Wordmark (optional)"
                    hint="Wide lockup asset — embed via file picker or use a public URL/path."
                    value={draft.visuals.wordmarkImageUrl ?? ''}
                    onChange={(next) =>
                      setDraft({
                        ...draft,
                        visuals: {
                          ...draft.visuals,
                          wordmarkImageUrl: next,
                        },
                      })
                    }
                  />
                </div>
                <label className="text-xs text-[var(--color-text-muted)] md:col-span-2">
                  Loading emblem URL
                  <input
                    className={fieldClass}
                    value={draft.visuals.loadingEmblemUrl ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        visuals: {
                          ...draft.visuals,
                          loadingEmblemUrl: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              </div>
            </AdminCard>
          ) : null}

          {tab === 'theme' ? (
            <AdminCard title="Theme palette" description="Preset plus manual overrides for preview & saved drop.">
              <label className="text-xs text-[var(--color-text-muted)]">
                Palette preset
                <select
                  className={fieldClass}
                  value={draft.theme.id}
                  onChange={(e) => applyPreset(e.target.value)}
                >
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
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {(Object.entries(draft.theme.colors) as Array<
                  [string, string | undefined]
                >).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <span className="block text-xs capitalize text-[var(--color-text-muted)]">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <HexColorPicker
                      value={val}
                      ariaLabel={`Pick ${key.replace(/([A-Z])/g, ' $1').trim()} color`}
                      onChange={(hex) =>
                        setDraft({
                          ...draft,
                          theme: {
                            ...draft.theme,
                            colors: {
                              ...draft.theme.colors,
                              [key]: hex,
                            },
                          },
                        })
                      }
                    />
                  </div>
                ))}
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
              catalogProducts={catalog.map((p) => ({
                id: p.id,
                name: p.name,
              }))}
            />
          ) : null}

          {tab === 'products' ? (
            <AdminCard
              title="Products in this drop"
              description="Selections sync both drop.productIds and product.dropIds."
            >
              <div className="space-y-3">
                {catalog.map((p) => {
                  const checked = draft.productIds.includes(p.id)
                  const idx = draft.productIds.indexOf(p.id)
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--color-line)] px-3 py-2"
                    >
                      <label className="flex flex-1 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                        />
                        <span>{p.name}</span>
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
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === draft.productIds.length - 1}
                            onClick={() => moveProduct(p.id, 1)}
                          >
                            Down
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
            <AdminCard title="SEO" description="Dedicated metadata for this drop / homepage compose target.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Title
                  <input
                    className={fieldClass}
                    value={draft.seo.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, title: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
                  Description
                  <textarea
                    className={`${fieldClass} min-h-[96px]`}
                    value={draft.seo.description}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, description: e.target.value },
                      })
                    }
                  />
                </label>
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
                <label className="text-xs text-[var(--color-text-muted)]">
                  OG image URL
                  <input
                    className={fieldClass}
                    value={draft.seo.ogImage ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: { ...draft.seo, ogImage: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="md:col-span-2 text-xs text-[var(--color-text-muted)]">
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

          {tab === 'preview' ? (
            <div className="xl:hidden">{previewPanel}</div>
          ) : null}
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-28 space-y-3">
            <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
              Live preview
            </p>
            {previewPanel}
          </div>
        </div>
      </div>

      <Modal open={confirmSave} onClose={() => setConfirmSave(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">
            {makeActiveAfterSave
              ? 'Save & activate drop?'
              : 'Save this drop?'}
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
            Make this drop active? This will deactivate the currently active drop and update the public landing page.
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
