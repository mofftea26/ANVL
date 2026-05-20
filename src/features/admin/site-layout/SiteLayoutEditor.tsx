import { Check, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  ensureDropSystemHydrated,
  getActiveDrop,
} from '@/features/admin/drops/drops.service'
import type { CmsLinkItem } from '@/features/admin/landing-cms/landingCms.types'
import { isActiveDropNavTemplateHref } from '@/features/admin/website-layout/websiteLayout.nav'
import {
  getWebsiteLayoutContent,
  getWebsiteLayoutSaveError,
  saveWebsiteLayoutContentAsync,
} from '@/features/admin/website-layout/websiteLayout.service'
import type {
  WebsiteFooterLinkGroup,
  WebsiteLayoutContent,
  WebsiteSocialLink,
} from '@/features/admin/website-layout/websiteLayout.types'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { cn } from '@/shared/lib/cn'
import {
  emptyDropCampaignLink,
  emptyGroup,
  emptyLink,
  emptySocial,
} from './siteLayoutEditor.helpers'
import { SiteLayoutPreview } from './SiteLayoutPreview'
import { SiteHomeExtrasEditor } from '@/features/admin/site-home/SiteHomeExtrasEditor'
import {
  getSiteHomeExtrasContent,
  saveSiteHomeExtrasContentAsync,
} from '@/features/admin/site-home/siteHome.service'
import type { SiteHomeExtrasContent } from '@/features/admin/site-home/siteHome.types'

const LAYOUT_TABS = [
  { id: 'header' as const, label: 'Header' },
  { id: 'footer' as const, label: 'Footer' },
  { id: 'announcement' as const, label: 'Announcement' },
  { id: 'homeExtras' as const, label: 'Home extras' },
]

type LayoutTabId = (typeof LAYOUT_TABS)[number]['id']

const DROP_SLOT_NOTE =
  'Active campaign slot — live site uses the active drop title and /drop/<slug>.'

export function SiteLayoutEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [layout, setLayout] = useState<WebsiteLayoutContent>(() =>
    getWebsiteLayoutContent(),
  )
  const [activeDropTitle, setActiveDropTitle] = useState('')
  const [activeTab, setActiveTab] = useState<LayoutTabId>('header')
  const [saving, setSaving] = useState(false)
  const [homeExtras, setHomeExtras] = useState<SiteHomeExtrasContent>(() =>
    getSiteHomeExtrasContent(),
  )

  useEffect(() => {
    ensureDropSystemHydrated()
    const drop = getActiveDrop()
    setActiveDropTitle(drop?.title?.trim() ? drop.title : 'No active drop')
  }, [])

  const headerDropSlotCount = useMemo(
    () =>
      layout.header.headerLinks.filter((l) =>
        isActiveDropNavTemplateHref(l.href),
      ).length,
    [layout.header.headerLinks],
  )

  const saveError = getWebsiteLayoutSaveError(layout)

  const patchHeader = (patch: Partial<WebsiteLayoutContent['header']>) => {
    setLayout((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))
  }

  const patchFooter = (patch: Partial<WebsiteLayoutContent['footer']>) => {
    setLayout((prev) => ({ ...prev, footer: { ...prev.footer, ...patch } }))
  }

  const updateHeaderLink = (index: number, next: Partial<CmsLinkItem>) => {
    const headerLinks = [...layout.header.headerLinks]
    headerLinks[index] = { ...headerLinks[index], ...next }
    patchHeader({ headerLinks })
  }

  const updateMobileLink = (index: number, next: Partial<CmsLinkItem>) => {
    const mobileExtraLinks = [...layout.header.mobileExtraLinks]
    mobileExtraLinks[index] = { ...mobileExtraLinks[index], ...next }
    patchHeader({ mobileExtraLinks })
  }

  const updateGroupLink = (
    gi: number,
    li: number,
    next: Partial<CmsLinkItem>,
  ) => {
    const linkGroups = layout.footer.linkGroups.map((g, idx) => {
      if (idx !== gi) return g
      const links = g.links.map((l, i) =>
        i === li ? { ...l, ...next } : l,
      )
      return { ...g, links }
    })
    patchFooter({ linkGroups })
  }

  const updateSocial = (index: number, next: Partial<WebsiteSocialLink>) => {
    const socialLinks = [...layout.footer.socialLinks]
    socialLinks[index] = { ...socialLinks[index], ...next }
    patchFooter({ socialLinks })
  }

  const save = useCallback(() => {
    const err = getWebsiteLayoutSaveError(layout)
    if (err) {
      toast.error(err)
      return
    }
    void (async () => {
      setSaving(true)
      try {
        await saveWebsiteLayoutContentAsync(layout)
        await saveSiteHomeExtrasContentAsync(homeExtras)
        toast.success('Website layout saved.')
        setLayout(getWebsiteLayoutContent())
        setHomeExtras(getSiteHomeExtrasContent())
        flashSuccess()
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Could not save layout.'
        toast.error(message)
      } finally {
        setSaving(false)
      }
    })()
  }, [layout, homeExtras, flashSuccess])

  const layoutToolbarActions = useMemo(
    () => (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminTopbarChipButton
          type="button"
          aria-label={
            saving
              ? 'Saving website layout'
              : saveError
                ? 'Save blocked by validation errors'
                : showSuccess
                  ? 'Website layout saved'
                  : 'Save website layout'
          }
          title={saveError ?? undefined}
          disabled={Boolean(saveError) || saving}
          icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
          variant={saveError ? 'default' : 'primary'}
          loading={saving}
          onClick={save}
        >
          {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save layout'}
        </AdminTopbarChipButton>
      </div>
    ),
    [save, saveError, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(layoutToolbarActions)
    return () => setPageActions(null)
  }, [layoutToolbarActions, setPageActions])

  return (
    <div
      className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,280px)] lg:items-start lg:gap-8"
      data-testid="site-layout-editor"
    >
      <div className="min-w-0 space-y-6">
        <div
          role="tablist"
          aria-label="Website layout sections"
          className="flex flex-wrap gap-1 border-b border-[var(--color-line)] pb-4"
        >
          {LAYOUT_TABS.map((tab) => (
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

        {activeTab === 'header' ? (
          <AdminCard title="Header & navigation">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <MediaPickerField
                  label="Header logo (stacked)"
                  kind="image"
                  hint="Leave empty for the bundled official ANVL mark. Optional override via file picker, drag-drop, or public path."
                  value={layout.header.logoStackedSrc ?? ''}
                  onChange={(next) => patchHeader({ logoStackedSrc: next })}
                  fallback="crest"
                />
              </div>
              <AdminCheckbox
                className="md:col-span-2"
                label="Show cart affordance in header"
                checked={layout.header.cartVisible}
                onChange={(e) =>
                  patchHeader({ cartVisible: e.target.checked })
                }
              />
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                URLs starting with{' '}
                <code className="rounded bg-[var(--color-surface)] px-1">
                  /drop/
                </code>{' '}
                are the campaign slot — the storefront uses the active drop (
                {activeDropTitle}).
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  Desktop navigation
                </p>
                <div className="flex flex-wrap gap-2">
                  {saveError ? (
                    <AdminButton
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        patchHeader({
                          headerLinks: [
                            ...layout.header.headerLinks,
                            emptyDropCampaignLink(),
                          ],
                        })
                      }
                    >
                      <Plus size={14} className="mr-1" aria-hidden="true" />
                      Add /drop/ campaign slot
                    </AdminButton>
                  ) : null}
                  <AdminButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      patchHeader({
                        headerLinks: [...layout.header.headerLinks, emptyLink()],
                      })
                    }
                  >
                    <Plus size={14} className="mr-1" aria-hidden="true" />
                    Add link
                  </AdminButton>
                </div>
              </div>
              <div className="space-y-3">
                {layout.header.headerLinks.map((link, index) => (
                  <NavLinkRow
                    key={link.id}
                    link={link}
                    dropSlotCount={headerDropSlotCount}
                    onUpdate={(next) => updateHeaderLink(index, next)}
                    onRemove={() =>
                      patchHeader({
                        headerLinks: layout.header.headerLinks.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  Mobile extras
                </p>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    patchHeader({
                      mobileExtraLinks: [
                        ...layout.header.mobileExtraLinks,
                        emptyLink(),
                      ],
                    })
                  }
                >
                  <Plus size={14} className="mr-1" aria-hidden="true" />
                  Add mobile link
                </AdminButton>
              </div>
              <div className="space-y-3">
                {layout.header.mobileExtraLinks.map((link, index) => (
                  <NavLinkRow
                    key={link.id}
                    link={link}
                    onUpdate={(next) => updateMobileLink(index, next)}
                    onRemove={() =>
                      patchHeader({
                        mobileExtraLinks:
                          layout.header.mobileExtraLinks.filter(
                            (_, i) => i !== index,
                          ),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </AdminCard>
        ) : null}

        {activeTab === 'footer' ? (
          <AdminCard title="Footer">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <MediaPickerField
                  label="Footer logo"
                  kind="image"
                  hint="Leave empty for the official bundled mark. Optional custom stacked mark via file picker, drag-drop, or public path."
                  value={layout.footer.logoStackedSrc ?? ''}
                  onChange={(next) => patchFooter({ logoStackedSrc: next })}
                  fallback="crest"
                />
              </div>
              <AdminFormField label="Decorative emblem fallback">
                <AdminInput
                  value={layout.footer.decorativeEmblemFallbackSrc ?? ''}
                  onChange={(e) =>
                    patchFooter({
                      decorativeEmblemFallbackSrc: e.target.value,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Tagline">
                <AdminTextarea
                  rows={2}
                  value={layout.footer.tagline}
                  onChange={(e) => patchFooter({ tagline: e.target.value })}
                />
              </AdminFormField>
              <AdminFormField label="Micro caption">
                <AdminInput
                  value={layout.footer.microCaption}
                  onChange={(e) =>
                    patchFooter({ microCaption: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Newsletter title">
                <AdminInput
                  value={layout.footer.newsletterTitle}
                  onChange={(e) =>
                    patchFooter({ newsletterTitle: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Newsletter placeholder">
                <AdminInput
                  value={layout.footer.newsletterPlaceholder}
                  onChange={(e) =>
                    patchFooter({ newsletterPlaceholder: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Newsletter button">
                <AdminInput
                  value={layout.footer.newsletterButtonText}
                  onChange={(e) =>
                    patchFooter({ newsletterButtonText: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Copyright">
                <AdminInput
                  value={layout.footer.copyrightText ?? ''}
                  onChange={(e) =>
                    patchFooter({ copyrightText: e.target.value })
                  }
                />
              </AdminFormField>
            </div>

            <FooterGroupsSection
              linkGroups={layout.footer.linkGroups}
              onPatchGroups={(linkGroups) => patchFooter({ linkGroups })}
              onUpdateGroupLink={updateGroupLink}
            />

            <div className="mt-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  Social links
                </p>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    patchFooter({
                      socialLinks: [...layout.footer.socialLinks, emptySocial()],
                    })
                  }
                >
                  Add social profile
                </AdminButton>
              </div>
              {layout.footer.socialLinks.map((soc, index) => (
                <div
                  key={soc.id}
                  className="grid gap-3 rounded-xl border border-[var(--color-line)] p-4 md:grid-cols-[1fr_1fr_auto]"
                >
                  <AdminFormField label="Label">
                    <AdminInput
                      value={soc.label}
                      onChange={(e) =>
                        updateSocial(index, { label: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminFormField label="Href">
                    <AdminInput
                      value={soc.href}
                      onChange={(e) =>
                        updateSocial(index, { href: e.target.value })
                      }
                    />
                  </AdminFormField>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patchFooter({
                        socialLinks: layout.footer.socialLinks.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    Remove
                  </AdminButton>
                </div>
              ))}
            </div>
          </AdminCard>
        ) : null}

        {activeTab === 'announcement' ? (
          <AdminCard title="Announcement bar">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminCheckbox
                className="md:col-span-2"
                label="Announcement bar visible"
                checked={layout.header.announcement.enabled}
                onChange={(e) =>
                  patchHeader({
                    announcement: {
                      ...layout.header.announcement,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <AdminFormField label="Announcement message">
                <AdminInput
                  value={layout.header.announcement.message}
                  onChange={(e) =>
                    patchHeader({
                      announcement: {
                        ...layout.header.announcement,
                        message: e.target.value,
                      },
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Announcement link (optional)">
                <AdminInput
                  value={layout.header.announcement.href ?? ''}
                  placeholder="/drop/the-oath"
                  onChange={(e) =>
                    patchHeader({
                      announcement: {
                        ...layout.header.announcement,
                        href: e.target.value,
                      },
                    })
                  }
                />
              </AdminFormField>
            </div>
          </AdminCard>
        ) : null}

        {activeTab === 'homeExtras' ? (
          <SiteHomeExtrasEditor value={homeExtras} onChange={setHomeExtras} />
        ) : null}

        {saveError ? (
          <p
            role="alert"
            className="text-xs text-red-300/90"
            data-testid="site-layout-save-error"
          >
            {saveError}
          </p>
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
          <div className="border-t border-[var(--color-line)] p-0 sm:p-4 lg:border-0 lg:p-0">
            <SiteLayoutPreview
              layout={layout}
              activeDropTitle={activeDropTitle}
            />
          </div>
        </details>
      </div>
    </div>
  )
}

function DropSlotNote() {
  return (
    <div className="md:col-span-2 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/60 p-3 text-xs text-[var(--color-text-muted)]">
      <p className="font-medium text-[var(--color-text)]">{DROP_SLOT_NOTE}</p>
    </div>
  )
}

function NavLinkRow({
  link,
  dropSlotCount,
  onUpdate,
  onRemove,
}: {
  link: CmsLinkItem
  dropSlotCount?: number
  onUpdate: (next: Partial<CmsLinkItem>) => void
  onRemove: () => void
}) {
  const dropSlot = isActiveDropNavTemplateHref(link.href)
  const blockDeleteDropSlot =
    dropSlot && dropSlotCount !== undefined && dropSlotCount === 1

  return (
    <div
      className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
    >
      {dropSlot ? (
        <DropSlotNote />
      ) : (
        <>
          <AdminFormField label="Label">
            <AdminInput
              value={link.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Href">
            <AdminInput
              value={link.href}
              onChange={(e) => onUpdate({ href: e.target.value })}
            />
          </AdminFormField>
        </>
      )}
      <AdminCheckbox
        label="Visible"
        className="text-xs"
        checked={link.isVisible}
        onChange={(e) => onUpdate({ isVisible: e.target.checked })}
      />
      <AdminButton
        type="button"
        variant="ghost"
        size="sm"
        disabled={blockDeleteDropSlot}
        title={
          blockDeleteDropSlot
            ? 'Desktop navigation must keep at least one /drop/ campaign slot.'
            : undefined
        }
        onClick={onRemove}
      >
        <Trash2 size={14} aria-hidden="true" />
      </AdminButton>
    </div>
  )
}

function FooterGroupsSection({
  linkGroups,
  onPatchGroups,
  onUpdateGroupLink,
}: {
  linkGroups: WebsiteFooterLinkGroup[]
  onPatchGroups: (groups: WebsiteFooterLinkGroup[]) => void
  onUpdateGroupLink: (
    gi: number,
    li: number,
    next: Partial<CmsLinkItem>,
  ) => void
}) {
  return (
    <div className="mt-10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
          Footer groups
        </p>
        <AdminButton
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onPatchGroups([...linkGroups, emptyGroup()])}
        >
          <Plus size={14} className="mr-1" aria-hidden="true" />
          Add group
        </AdminButton>
      </div>
      {linkGroups.map((group, gi) => (
        <div
          key={group.id}
          className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AdminFormField label="Group title (optional)">
              <AdminInput
                value={group.title ?? ''}
                onChange={(e) => {
                  onPatchGroups(
                    linkGroups.map((g, i) =>
                      i === gi ? { ...g, title: e.target.value } : g,
                    ),
                  )
                }}
              />
            </AdminFormField>
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onPatchGroups(linkGroups.filter((_, i) => i !== gi))
              }
            >
              Remove group
            </AdminButton>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Links
            </p>
            <AdminButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                onPatchGroups(
                  linkGroups.map((g, i) =>
                    i === gi ? { ...g, links: [...g.links, emptyLink()] } : g,
                  ),
                )
              }}
            >
              Add link
            </AdminButton>
          </div>
          <div className="space-y-3">
            {group.links.map((link, li) => {
              const dropSlot = isActiveDropNavTemplateHref(link.href)
              return (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-xl border border-[var(--color-line)]/80 p-3 md:grid-cols-[1fr_1fr_auto_auto]"
                >
                  {dropSlot ? (
                    <DropSlotNote />
                  ) : (
                    <>
                      <AdminFormField label="Label">
                        <AdminInput
                          value={link.label}
                          onChange={(e) =>
                            onUpdateGroupLink(gi, li, {
                              label: e.target.value,
                            })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Href">
                        <AdminInput
                          value={link.href}
                          onChange={(e) =>
                            onUpdateGroupLink(gi, li, { href: e.target.value })
                          }
                        />
                      </AdminFormField>
                    </>
                  )}
                  <AdminCheckbox
                    label="Visible"
                    className="text-xs"
                    checked={link.isVisible}
                    onChange={(e) =>
                      onUpdateGroupLink(gi, li, {
                        isVisible: e.target.checked,
                      })
                    }
                  />
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onPatchGroups(
                        linkGroups.map((g, i) =>
                          i === gi
                            ? {
                                ...g,
                                links: g.links.filter((_, j) => j !== li),
                              }
                            : g,
                        ),
                      )
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </AdminButton>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
