import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { cn } from '@/shared/lib/cn'
import {
  getSiteSeoContent,
  saveSiteSeoContentAsync,
  type SiteSeoContent,
  type SiteStaticSeoPath,
} from '@/features/cms/siteSeo.local'
import { SiteSeoGlobalPanel } from './SiteSeoGlobalPanel'
import { SiteSeoPreviewPanel, type SiteSeoPreviewState } from './SiteSeoPreviewPanel'
import { SiteSeoStaticPagesPanel } from './SiteSeoStaticPagesPanel'
import { SiteMarketingToolsPanel } from './SiteMarketingToolsPanel'

const SEO_TABS = [
  { id: 'defaults' as const, label: 'Defaults' },
  { id: 'pages' as const, label: 'Pages' },
  { id: 'marketing' as const, label: 'Marketing & technical' },
]

type SeoTabId = (typeof SEO_TABS)[number]['id']

export function SiteSeoEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [content, setContent] = useState<SiteSeoContent>(() => getSiteSeoContent())
  const [activeTab, setActiveTab] = useState<SeoTabId>('defaults')
  const [activePath, setActivePath] = useState<SiteStaticSeoPath>('/')
  const [saving, setSaving] = useState(false)

  const pagePatch = content.staticPages[activePath] ?? {}

  const previewState = useMemo((): SiteSeoPreviewState => {
    const g = content.globalDefaults
    if (activeTab === 'defaults') {
      return {
        metaTitle: g.metaTitle ?? '',
        metaDescription: g.metaDescription ?? '',
        path: '/',
        ogTitle: g.ogTitle,
        ogDescription: g.ogDescription,
        ogImage: g.ogImage,
        twitterTitle: g.twitterTitle,
        twitterDescription: g.twitterDescription,
        twitterImage: g.twitterImage,
        defaultShareImage: g.defaultShareImage,
      }
    }
    const p = pagePatch
    return {
      metaTitle: p.metaTitle ?? g.metaTitle ?? '',
      metaDescription: p.metaDescription ?? g.metaDescription ?? '',
      path: activePath,
      ogTitle: p.ogTitle ?? g.ogTitle,
      ogDescription: p.ogDescription ?? g.ogDescription,
      ogImage: p.ogImage ?? g.ogImage,
      twitterTitle: p.twitterTitle ?? g.twitterTitle,
      twitterDescription: p.twitterDescription ?? g.twitterDescription,
      twitterImage: p.twitterImage ?? g.twitterImage,
      defaultShareImage: g.defaultShareImage,
    }
  }, [activeTab, activePath, content.globalDefaults, pagePatch])

  const patchGlobal = useCallback((patch: Partial<SiteSeoContent['globalDefaults']>) => {
    setContent((prev) => ({
      ...prev,
      globalDefaults: { ...prev.globalDefaults, ...patch },
    }))
  }, [])

  const patchStaticPage = useCallback(
    (patch: Partial<SiteSeoContent['staticPages'][SiteStaticSeoPath]>) => {
      setContent((prev) => ({
        ...prev,
        staticPages: {
          ...prev.staticPages,
          [activePath]: { ...(prev.staticPages[activePath] ?? {}), ...patch },
        },
      }))
    },
    [activePath],
  )

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveSiteSeoContentAsync(content)
        toast.success('Site SEO saved.')
        setContent(getSiteSeoContent())
        flashSuccess()
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Could not save site SEO.'
        toast.error(message)
      } finally {
        setSaving(false)
      }
    })()
  }, [content, flashSuccess])

  const seoToolbarActions = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminTopbarChipButton
          type="button"
          aria-label={
            saving
              ? 'Saving site SEO'
              : showSuccess
                ? 'Site SEO saved'
                : 'Save site SEO'
          }
          disabled={saving}
          icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
          variant="primary"
          loading={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save SEO'}
        </AdminTopbarChipButton>
      </div>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(seoToolbarActions)
    return () => setPageActions(null)
  }, [seoToolbarActions, setPageActions])

  return (
    <div
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,280px)] lg:items-start lg:gap-8"
      data-testid="site-seo-editor"
    >
      <div className="min-w-0 space-y-6">
        <div
          role="tablist"
          aria-label="Site SEO sections"
          className="flex flex-wrap gap-1 border-b border-[var(--color-line)] pb-4"
        >
          {SEO_TABS.map((tab) => (
            <AdminButton
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              variant="adminTabList"
              data-active={activeTab === tab.id ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </AdminButton>
          ))}
        </div>

        {activeTab === 'defaults' ? (
          <SiteSeoGlobalPanel defaults={content.globalDefaults} onChange={patchGlobal} />
        ) : null}
        {activeTab === 'pages' ? (
          <SiteSeoStaticPagesPanel
            activePath={activePath}
            pagePatch={pagePatch}
            onSelectPath={setActivePath}
            onChange={patchStaticPage}
          />
        ) : null}
        {activeTab === 'marketing' ? (
          <SiteMarketingToolsPanel content={content} onChange={setContent} />
        ) : null}
      </div>

      <div
        className={cn(
          'max-sm:hidden lg:sticky lg:top-[calc(var(--admin-topbar-height)+1.5rem)] lg:self-start',
        )}
      >
        <details className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] lg:open lg:border-0 lg:bg-transparent">
          <summary className="cursor-pointer list-none px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)] marker:content-none lg:hidden [&::-webkit-details-marker]:hidden">
            Preview
          </summary>
          <div className="border-t border-[var(--color-line)] p-4 lg:border-0 lg:p-0">
            <SiteSeoPreviewPanel state={previewState} />
          </div>
        </details>
      </div>
    </div>
  )
}
