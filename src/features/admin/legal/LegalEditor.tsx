import { Info } from '@/shared/icons'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { SectionListField } from '@/features/admin/components/SectionListField'
import {
  readLegalContentFromStorage,
  saveLegalContentAsync,
  subscribeLegalContentChange,
} from '@/features/cms/legal/legalContent.settings'
import { LEGAL_CONTENT_DEFAULTS } from '@/features/cms/legal/legalContent.defaults'
import {
  LEGAL_PAGE_KEYS,
  type LegalContentConfig,
  type LegalPage,
  type LegalPageKey,
} from '@/features/cms/legal/legalContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { cn } from '@/shared/lib/cn'

const TAB_LABELS: Record<LegalPageKey, string> = {
  privacy: 'Privacy',
  terms: 'Terms',
  cookies: 'Cookies',
  accessibility: 'Accessibility',
}

function useStoredLegalContent(): LegalContentConfig {
  return useSyncExternalStore(
    subscribeLegalContentChange,
    () => readLegalContentFromStorage(),
    () => readLegalContentFromStorage(),
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Legal content editor — a tabbed editor over the four legal pages
 * (Privacy · Terms · Cookies · Accessibility). Per page: title, "last updated"
 * date, intro, and a reorderable section-list editor. Every blank field falls
 * back to the designed default copy at render, shown here as the placeholder.
 * Writes a local working copy and pushes to Supabase
 * (`cms_settings.legal_content` + `storefront_publication.legal_content`) on
 * save; the live-preview iframe tracks unsaved edits via the draft bridge.
 */
export function LegalEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredLegalContent()
  const { config, setConfig, isDirty, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'legal',
    stored,
    saveAsync: saveLegalContentAsync,
    successMessage: 'Legal content saved.',
    errorFallbackMessage: 'Could not save the legal content.',
  })
  usePushPreviewDraft('legalContent', config)

  const [tab, setTab] = useState<LegalPageKey>('privacy')
  const page = config.pages[tab]
  const defaults = LEGAL_CONTENT_DEFAULTS[tab]

  const patchPage = useCallback(
    (patch: Partial<LegalPage>) =>
      setConfig((prev) => ({
        ...prev,
        pages: { ...prev.pages, [tab]: { ...prev.pages[tab], ...patch } },
      })),
    [setConfig, tab],
  )

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save legal"
      />
    ),
    [save, saving, showSuccess, isDirty],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const rail = (
    <AdminRailPanel
      title="How legal pages work"
      icon={<Info size={17} />}
      description="Author the site's policy copy. Blank fields fall back to the built-in defaults."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Each tab is one page — Privacy, Terms, Cookies, or Accessibility.</li>
        <li>Leave a field blank to keep the designed default (shown as the placeholder).</li>
        <li>Body text is plain — a blank line starts a new paragraph.</li>
        <li>Drag the section header (or use the arrows) to reorder sections.</li>
      </ul>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Legal help" aside={rail}>
      <div className="space-y-6" data-testid="legal-editor">
        <div
          role="tablist"
          aria-label="Legal pages"
          className="flex flex-wrap gap-2"
        >
          {LEGAL_PAGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'focus-ring rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
                tab === key
                  ? 'border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-text)]'
                  : 'border-[var(--color-line)] bg-[var(--color-bg)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <Section title={`${TAB_LABELS[tab]} page`}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" labelStyle="stacked">
                <Input
                  density="compact"
                  placeholder={defaults.title}
                  value={page.title}
                  onChange={(e) => patchPage({ title: e.target.value })}
                />
              </FormField>
              <FormField
                label="Last updated"
                hint="Shown as a date stamp. Blank uses the default."
                labelStyle="stacked"
              >
                <Input
                  density="compact"
                  type="date"
                  value={page.updatedAt}
                  onChange={(e) => patchPage({ updatedAt: e.target.value })}
                />
              </FormField>
            </div>
            <FormField
              label="Intro"
              hint="The lead paragraph under the title."
              labelStyle="stacked"
            >
              <Textarea
                density="compact"
                rows={3}
                placeholder={defaults.intro}
                value={page.intro}
                onChange={(e) => patchPage({ intro: e.target.value })}
              />
            </FormField>
          </div>
        </Section>

        <Section title="Sections">
          <p className="mb-4 text-xs text-[var(--color-text-muted)]">
            {page.sections.length === 0
              ? `No custom sections — the page runs on the ${defaults.sections.length} designed defaults. Add one to override them.`
              : 'These replace the designed default sections entirely.'}
          </p>
          <SectionListField
            sections={page.sections}
            onChange={(sections) => patchPage({ sections })}
            addLabel="Add section"
            idPrefix={`legal-${tab}`}
            bodyHint="Plain text — a blank line starts a new paragraph."
          />
        </Section>
      </div>
    </AdminWorkspace>
  )
}
