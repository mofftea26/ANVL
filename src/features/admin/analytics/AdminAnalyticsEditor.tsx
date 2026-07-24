import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import { Info, Plus, Trash2 } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { makeSectionId } from '@/features/admin/components/SectionListField'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import {
  getSiteSeoContent,
  saveSiteSeoContentAsync,
  subscribeSiteSeoChange,
  type MarketingToolEntry,
  type MarketingToolProvider,
  type SiteSeoContent,
} from '@/features/cms/siteSeo.local'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'

/** Provider vocabulary → label + the ID/URL the storefront injector expects. */
const PROVIDER_OPTIONS: readonly {
  value: MarketingToolProvider
  label: string
  placeholder: string
  hint: string
}[] = [
  { value: 'ga4', label: 'Google Analytics 4', placeholder: 'G-XXXXXXXXXX', hint: 'Measurement ID (starts with G-).' },
  { value: 'gtm', label: 'Google Tag Manager', placeholder: 'GTM-XXXXXXX', hint: 'Container ID (starts with GTM-).' },
  { value: 'metaPixel', label: 'Meta (Facebook) Pixel', placeholder: '000000000000000', hint: 'Pixel ID (numeric).' },
  { value: 'hotjar', label: 'Hotjar', placeholder: '1234567', hint: 'Site ID (numeric).' },
  {
    value: 'googleSiteVerification',
    label: 'Google site verification',
    placeholder: 'verification token',
    hint: 'The token from the meta-tag verification method.',
  },
  {
    value: 'customScript',
    label: 'Custom script (URL)',
    placeholder: 'https://example.com/script.js',
    hint: 'An https:// URL loaded async in the page head.',
  },
]

function providerMeta(provider: MarketingToolProvider) {
  return PROVIDER_OPTIONS.find((p) => p.value === provider) ?? PROVIDER_OPTIONS[0]
}

function useStoredSiteSeo(): SiteSeoContent {
  return useSyncExternalStore(subscribeSiteSeoChange, getSiteSeoContent, getSiteSeoContent)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="anvl-heading mb-1 text-base font-normal">{children}</h2>
  )
}

/**
 * Analytics & SEO editor — the ONE surface for the site-wide `site_seo` blob:
 * search-engine visibility, global SEO defaults, and the analytics/marketing
 * tags (GA4, GTM, Meta Pixel, Hotjar, verification, custom script) the
 * storefront injects via `MarketingToolsHead`. Save = publish through
 * `saveSiteSeoContentAsync` → the standard `cms_settings` + `storefront_publication`
 * dual-write (`site_seo` column).
 */
export function AdminAnalyticsEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredSiteSeo()
  const { config, setConfig, isDirty, saving, showSuccess, save } = useSingletonCmsEditor<SiteSeoContent>({
    id: 'analytics-seo',
    stored,
    // saveSiteSeoContentAsync resolves the sanitized blob; the editor only needs
    // the persist side-effect (and its thrown error on failure).
    saveAsync: async (next) => {
      await saveSiteSeoContentAsync(next)
    },
    successMessage: 'Analytics & SEO saved.',
    errorFallbackMessage: 'Could not save analytics & SEO.',
  })

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save analytics"
      />
    ),
    [save, saving, showSuccess, isDirty],
  )
  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const tools = config.marketingTools ?? []
  const setTools = useCallback(
    (next: MarketingToolEntry[]) => setConfig((prev) => ({ ...prev, marketingTools: next })),
    [setConfig],
  )
  const patchTool = (id: string, patch: Partial<MarketingToolEntry>) =>
    setTools(tools.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  const removeTool = (id: string) => setTools(tools.filter((t) => t.id !== id))
  const addTool = () =>
    setTools([
      ...tools,
      { id: makeSectionId('tag'), provider: 'ga4', snippetId: '', enabled: true },
    ])

  const setDefault = (key: 'metaTitle' | 'metaDescription' | 'defaultShareImage', value: string) =>
    setConfig((prev) => ({ ...prev, globalDefaults: { ...prev.globalDefaults, [key]: value } }))
  const setTechnical = (key: 'robotsIndex' | 'sitemapEnabled', value: boolean) =>
    setConfig((prev) => ({ ...prev, technical: { ...prev.technical, [key]: value } }))

  const robotsIndex = config.technical?.robotsIndex !== false
  const sitemapEnabled = config.technical?.sitemapEnabled !== false

  const rail = (
    <AdminRailPanel
      title="How these apply"
      icon={<Info size={17} />}
      description="Saved to Supabase and read by the storefront on every page."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Analytics tags are injected into every storefront page's &lt;head&gt;.</li>
        <li>Only enabled tags with an ID load — toggle one off without deleting it.</li>
        <li>Turning off search-engine visibility adds a site-wide noindex.</li>
        <li>Per-page titles/descriptions still come from each page's own content.</li>
      </ul>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Analytics help" aside={rail}>
      <div className="space-y-6" data-testid="analytics-seo-editor">
        <section className="rounded-xl border border-[var(--color-line)] p-5">
          <SectionTitle>Analytics &amp; marketing tags</SectionTitle>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">
            Add your tracking tags — they load on the live storefront (not the admin).
          </p>
          <div className="space-y-3">
            {tools.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--color-line)] px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
                No tags yet. Add GA4, GTM, a Meta Pixel, and more below.
              </p>
            ) : null}
            {tools.map((tool, index) => {
              const meta = providerMeta(tool.provider)
              return (
                <div
                  key={tool.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
                    <AdminFieldSelect
                      label="Provider"
                      value={tool.provider}
                      onChange={(v) => patchTool(tool.id, { provider: v as MarketingToolProvider })}
                      options={PROVIDER_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
                    />
                    <FormField label={meta.value === 'customScript' ? 'Script URL' : 'ID'} hint={meta.hint} labelStyle="micro">
                      <Input
                        density="compact"
                        placeholder={meta.placeholder}
                        value={tool.snippetId}
                        onChange={(e) => patchTool(tool.id, { snippetId: e.target.value })}
                        aria-label={`Tag ${index + 1} id`}
                      />
                    </FormField>
                    <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end">
                      <Checkbox
                        label="On"
                        checked={tool.enabled}
                        onChange={(e) => patchTool(tool.id, { enabled: e.target.checked })}
                      />
                      <IconButton
                        type="button"
                        size="sm"
                        aria-label={`Remove tag ${index + 1}`}
                        onClick={() => removeTool(tool.id)}
                      >
                        <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )
            })}
            <Button type="button" variant="secondary" size="sm" density="compact" onClick={addTool}>
              <Plus size={ICON_SIZE.sm} aria-hidden="true" />
              Add tag
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-line)] p-5">
          <SectionTitle>Search-engine visibility</SectionTitle>
          <div className="mt-3 space-y-3">
            <Checkbox
              label="Let search engines index the site"
              description="Off adds a site-wide noindex,nofollow — use only for staging/pre-launch."
              checked={robotsIndex}
              onChange={(e) => setTechnical('robotsIndex', e.target.checked)}
            />
            <Checkbox
              label="Expose the sitemap"
              description="Keep on so search engines can discover every page."
              checked={sitemapEnabled}
              onChange={(e) => setTechnical('sitemapEnabled', e.target.checked)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-line)] p-5">
          <SectionTitle>Global SEO defaults</SectionTitle>
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">
            Fallbacks used when a page doesn&apos;t set its own. Blank keeps the coded default.
          </p>
          <div className="space-y-4">
            <FormField label="Default meta title" labelStyle="stacked">
              <Input
                density="compact"
                value={config.globalDefaults.metaTitle ?? ''}
                onChange={(e) => setDefault('metaTitle', e.target.value)}
              />
            </FormField>
            <FormField label="Default meta description" labelStyle="stacked">
              <Textarea
                rows={2}
                value={config.globalDefaults.metaDescription ?? ''}
                onChange={(e) => setDefault('metaDescription', e.target.value)}
              />
            </FormField>
            <FormField
              label="Default share image URL"
              hint="Used for social previews when a page has no image of its own."
              labelStyle="stacked"
            >
              <Input
                density="compact"
                placeholder="https://…/og-default.png"
                value={config.globalDefaults.defaultShareImage ?? ''}
                onChange={(e) => setDefault('defaultShareImage', e.target.value)}
              />
            </FormField>
          </div>
        </section>
      </div>
    </AdminWorkspace>
  )
}
