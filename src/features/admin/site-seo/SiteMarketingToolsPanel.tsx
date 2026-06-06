import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminEditableList } from '@/features/admin/components/AdminEditableList'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { createCmsId } from '@/features/admin/lib/cmsId'
import type {
  MarketingToolProvider,
  SiteSeoContent,
  SiteTechnicalSeo,
} from '@/features/cms/siteSeo.local'

const PROVIDER_OPTIONS = [
  { value: 'gtm', label: 'Google Tag Manager' },
  { value: 'ga4', label: 'Google Analytics 4' },
  { value: 'metaPixel', label: 'Meta Pixel' },
  { value: 'hotjar', label: 'Hotjar' },
  { value: 'googleSiteVerification', label: 'Google site verification' },
  { value: 'customScript', label: 'Custom script URL' },
] as const

const ROBOTS_OPTIONS = [
  { value: 'index', label: 'Index (allow)' },
  { value: 'noindex', label: 'No index' },
] as const

export function SiteMarketingToolsPanel({
  content,
  onChange,
}: {
  content: SiteSeoContent
  onChange: (next: SiteSeoContent) => void
}) {
  const tools = content.marketingTools ?? []
  const technical = content.technical ?? {}

  function patchTechnical(patch: Partial<SiteTechnicalSeo>) {
    onChange({ ...content, technical: { ...technical, ...patch } })
  }

  return (
    <div className="space-y-6">
      <AdminCard title="Technical SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminFieldSelect
            label="Robots"
            value={technical.robotsIndex === false ? 'noindex' : 'index'}
            options={ROBOTS_OPTIONS}
            onChange={(v) => patchTechnical({ robotsIndex: v === 'index' })}
          />
          <AdminFieldSelect
            label="XML sitemap"
            value={technical.sitemapEnabled === false ? 'off' : 'on'}
            options={[
              { value: 'on', label: 'Enabled' },
              { value: 'off', label: 'Disabled' },
            ]}
            onChange={(v) => patchTechnical({ sitemapEnabled: v === 'on' })}
          />
          <div className="md:col-span-2">
            <label className="text-xs text-[var(--color-text-muted)]">Hreflang notes</label>
            <AdminInput
              className="mt-1"
              value={technical.hreflangNotes ?? ''}
              onChange={(e) =>
                patchTechnical({ hreflangNotes: e.target.value || undefined })
              }
              placeholder="e.g. en-US primary, fr-CA alternate /fr"
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Marketing & analytics tools"
        description="Inject tags at runtime — no code deploy required."
      >
        <AdminEditableList
          items={tools}
          onChange={(next) => onChange({ ...content, marketingTools: next })}
          createItem={() => ({
            id: createCmsId('tool'),
            provider: 'gtm' as MarketingToolProvider,
            snippetId: '',
            enabled: true,
          })}
          renderLabel={(t) =>
            `${PROVIDER_OPTIONS.find((p) => p.value === t.provider)?.label ?? t.provider}${t.enabled ? '' : ' (off)'}`
          }
          addLabel="Add tool"
          renderEditor={(item, onPatch) => (
            <div className="space-y-2">
              <AdminFieldSelect
                label="Provider"
                value={item.provider}
                options={PROVIDER_OPTIONS}
                onChange={(provider) =>
                  onPatch({ provider: provider as MarketingToolProvider })
                }
              />
              <AdminInput
                value={item.snippetId}
                onChange={(e) => onPatch({ snippetId: e.target.value })}
                placeholder="Container ID, measurement ID, or script URL"
              />
            </div>
          )}
        />
      </AdminCard>
    </div>
  )
}
