import { Info } from '@/shared/icons'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminSaveAction } from '@/features/admin/components/AdminSaveAction'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { SectionListField } from '@/features/admin/components/SectionListField'
import { FaqListField } from '@/features/admin/support/FaqListField'
import { PerProductCareField } from '@/features/admin/support/PerProductCareField'
import { PerProductSizeField } from '@/features/admin/support/PerProductSizeField'
import {
  readSupportContentFromStorage,
  saveSupportContentAsync,
  subscribeSupportContentChange,
} from '@/features/cms/support/supportContent.settings'
import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import type { SupportContentConfig } from '@/features/cms/support/supportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { PhoneInput } from '@/shared/components/ui/PhoneInput'
import { Textarea } from '@/shared/components/ui/Textarea'
import { cn } from '@/shared/lib/cn'

const SUPPORT_TABS = [
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'returns', label: 'Returns' },
  { key: 'careGuide', label: 'Care guide' },
  { key: 'sizeGuide', label: 'Size guide' },
] as const

type SupportTab = (typeof SUPPORT_TABS)[number]['key']

function useStoredSupportContent(): SupportContentConfig {
  return useSyncExternalStore(
    subscribeSupportContentChange,
    () => readSupportContentFromStorage(),
    () => readSupportContentFromStorage(),
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
 * Support content editor — a tabbed editor over the six help pages
 * (FAQ · Contact · Shipping · Returns · Care guide · Size guide). FAQ items and
 * the shipping/returns/care section lists are reorderable; care/size also carry
 * per-product entries keyed by commerce slug. Every blank field falls back to
 * the designed default at render (shown here as the placeholder). Writes a local
 * working copy and pushes to Supabase (`cms_settings.support_content` +
 * `storefront_publication.support_content`) on save; the live-preview iframe
 * tracks unsaved edits via the draft bridge.
 */
export function SupportEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredSupportContent()
  const { config, setConfig, isDirty, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'support',
    stored,
    saveAsync: saveSupportContentAsync,
    successMessage: 'Support content saved.',
    errorFallbackMessage: 'Could not save the support content.',
  })
  usePushPreviewDraft('supportContent', config)

  const [tab, setTab] = useState<SupportTab>('faq')
  const D = SUPPORT_CONTENT_DEFAULTS

  const patch = useCallback(
    <K extends keyof SupportContentConfig>(key: K, value: SupportContentConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig],
  )

  const toolbar = useMemo(
    () => (
      <AdminSaveAction
        onSave={save}
        saving={saving}
        showSuccess={showSuccess}
        dirty={isDirty}
        label="Save support"
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
      title="How support pages work"
      icon={<Info size={17} />}
      description="Author the customer-help copy. Blank fields fall back to the built-in defaults."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Each tab is one page — FAQ, Contact, Shipping, Returns, Care, or Size.</li>
        <li>Leave a field blank to keep the designed default (shown as the placeholder).</li>
        <li>Care and Size carry per-product entries picked by product.</li>
        <li>Drag headers (or use the arrows) to reorder FAQ items and sections.</li>
      </ul>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Support help" aside={rail}>
      <div className="space-y-6" data-testid="support-editor">
        <div role="tablist" aria-label="Support pages" className="flex flex-wrap gap-2">
          {SUPPORT_TABS.map(({ key, label }) => (
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
              {label}
            </button>
          ))}
        </div>

        {tab === 'faq' ? (
          <Section title="FAQ">
            <div className="space-y-4">
              <FormField label="Intro" labelStyle="stacked">
                <Textarea
                  density="compact"
                  rows={2}
                  placeholder={D.faq.intro}
                  value={config.faq.intro}
                  onChange={(e) => patch('faq', { ...config.faq, intro: e.target.value })}
                />
              </FormField>
              <FaqListField
                items={config.faq.items}
                onChange={(items) => patch('faq', { ...config.faq, items })}
              />
            </div>
          </Section>
        ) : null}

        {tab === 'contact' ? (
          <Section title="Contact">
            <div className="space-y-4">
              <FormField label="Intro" labelStyle="stacked">
                <Textarea
                  density="compact"
                  rows={2}
                  placeholder={D.contact.intro}
                  value={config.contact.intro}
                  onChange={(e) =>
                    patch('contact', { ...config.contact, intro: e.target.value })
                  }
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Email" labelStyle="stacked">
                  <Input
                    density="compact"
                    type="email"
                    placeholder={D.contact.email}
                    value={config.contact.email}
                    onChange={(e) =>
                      patch('contact', { ...config.contact, email: e.target.value })
                    }
                  />
                </FormField>
                <FormField label="Phone" labelStyle="stacked" htmlFor="support-contact-phone">
                  <PhoneInput
                    id="support-contact-phone"
                    value={config.contact.phone}
                    onChange={(phone) => patch('contact', { ...config.contact, phone })}
                  />
                </FormField>
                <FormField label="Instagram" labelStyle="stacked">
                  <Input
                    density="compact"
                    placeholder={D.contact.instagram}
                    value={config.contact.instagram}
                    onChange={(e) =>
                      patch('contact', { ...config.contact, instagram: e.target.value })
                    }
                  />
                </FormField>
                <FormField label="Address" labelStyle="stacked">
                  <Input
                    density="compact"
                    placeholder={D.contact.address}
                    value={config.contact.address}
                    onChange={(e) =>
                      patch('contact', { ...config.contact, address: e.target.value })
                    }
                  />
                </FormField>
              </div>
              <FormField label="Hours" hint="Support availability window." labelStyle="stacked">
                <Input
                  density="compact"
                  placeholder={D.contact.hours}
                  value={config.contact.hours}
                  onChange={(e) => patch('contact', { ...config.contact, hours: e.target.value })}
                />
              </FormField>
            </div>
          </Section>
        ) : null}

        {tab === 'shipping' ? (
          <Section title="Shipping">
            <div className="space-y-4">
              <FormField label="Intro" labelStyle="stacked">
                <Textarea
                  density="compact"
                  rows={2}
                  placeholder={D.shipping.intro}
                  value={config.shipping.intro}
                  onChange={(e) =>
                    patch('shipping', { ...config.shipping, intro: e.target.value })
                  }
                />
              </FormField>
              <SectionListField
                sections={config.shipping.sections}
                onChange={(sections) => patch('shipping', { ...config.shipping, sections })}
                idPrefix="shipping"
                bodyHint="Plain text — a blank line starts a new paragraph."
              />
            </div>
          </Section>
        ) : null}

        {tab === 'returns' ? (
          <Section title="Returns">
            <div className="space-y-4">
              <FormField label="Intro" labelStyle="stacked">
                <Textarea
                  density="compact"
                  rows={2}
                  placeholder={D.returns.intro}
                  value={config.returns.intro}
                  onChange={(e) =>
                    patch('returns', { ...config.returns, intro: e.target.value })
                  }
                />
              </FormField>
              <SectionListField
                sections={config.returns.sections}
                onChange={(sections) => patch('returns', { ...config.returns, sections })}
                idPrefix="returns"
                bodyHint="Plain text — a blank line starts a new paragraph."
              />
            </div>
          </Section>
        ) : null}

        {tab === 'careGuide' ? (
          <>
            <Section title="Care guide">
              <div className="space-y-4">
                <FormField label="Intro" labelStyle="stacked">
                  <Textarea
                    density="compact"
                    rows={2}
                    placeholder={D.careGuide.intro}
                    value={config.careGuide.intro}
                    onChange={(e) =>
                      patch('careGuide', { ...config.careGuide, intro: e.target.value })
                    }
                  />
                </FormField>
                <SectionListField
                  sections={config.careGuide.sections}
                  onChange={(sections) =>
                    patch('careGuide', { ...config.careGuide, sections })
                  }
                  idPrefix="care"
                  bodyHint="Plain text — a blank line starts a new paragraph."
                />
              </div>
            </Section>
            <Section title="Per-product care notes">
              <PerProductCareField
                perProduct={config.careGuide.perProduct}
                onChange={(perProduct) =>
                  patch('careGuide', { ...config.careGuide, perProduct })
                }
              />
            </Section>
          </>
        ) : null}

        {tab === 'sizeGuide' ? (
          <>
            <Section title="Size guide">
              <div className="space-y-4">
                <FormField label="Intro" labelStyle="stacked">
                  <Textarea
                    density="compact"
                    rows={2}
                    placeholder={D.sizeGuide.intro}
                    value={config.sizeGuide.intro}
                    onChange={(e) =>
                      patch('sizeGuide', { ...config.sizeGuide, intro: e.target.value })
                    }
                  />
                </FormField>
                <FormField
                  label="Note"
                  hint="Global how-to-measure guidance shown above the tables."
                  labelStyle="stacked"
                >
                  <Textarea
                    density="compact"
                    rows={4}
                    placeholder={D.sizeGuide.note}
                    value={config.sizeGuide.note}
                    onChange={(e) =>
                      patch('sizeGuide', { ...config.sizeGuide, note: e.target.value })
                    }
                  />
                </FormField>
              </div>
            </Section>
            <Section title="Per-product size tables">
              <PerProductSizeField
                perProduct={config.sizeGuide.perProduct}
                onChange={(perProduct) =>
                  patch('sizeGuide', { ...config.sizeGuide, perProduct })
                }
              />
            </Section>
          </>
        ) : null}
      </div>
    </AdminWorkspace>
  )
}
