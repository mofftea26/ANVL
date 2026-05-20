import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  ensureDropSystemHydrated,
  getActiveDrop,
} from '@/features/admin/drops/drops.service'
import type { CmsLinkItem } from '@/features/admin/landing-cms/landingCms.types'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import { isActiveDropNavTemplateHref } from '@/features/admin/website-layout/websiteLayout.nav'
import {
  getWebsiteLayoutContent,
  getWebsiteLayoutSaveError,
  saveWebsiteLayoutContent,
} from '@/features/admin/website-layout/websiteLayout.service'
import type {
  WebsiteFooterLinkGroup,
  WebsiteLayoutContent,
  WebsiteSocialLink,
} from '@/features/admin/website-layout/websiteLayout.types'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminTextarea } from '@/features/admin/components/AdminInput'

export function WebsiteLayoutPageRoute() {
  return (
    <ProtectedAdminRoute>
      <WebsiteLayoutPage />
    </ProtectedAdminRoute>
  )
}

function emptyLink(): CmsLinkItem {
  return {
    id: createCmsId('nav'),
    label: 'New link',
    href: '/',
    isVisible: true,
  }
}

function emptySocial(): WebsiteSocialLink {
  return {
    id: createCmsId('soc'),
    label: 'Social',
    href: '#',
  }
}

function emptyGroup(): WebsiteFooterLinkGroup {
  return {
    id: createCmsId('fg'),
    title: 'Group',
    links: [emptyLink()],
  }
}

function emptyDropCampaignLink(): CmsLinkItem {
  return {
    id: createCmsId('nav'),
    label: 'Active campaign',
    href: '/drop/the-oath',
    isVisible: true,
  }
}

function WebsiteLayoutPage() {
  const [layout, setLayout] = useState<WebsiteLayoutContent>(() =>
    getWebsiteLayoutContent(),
  )
  const [activeDropTitle, setActiveDropTitle] = useState<string>('')

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

  const save = () => {
    const err = getWebsiteLayoutSaveError(layout)
    if (err) {
      toast.error(err)
      return
    }
    try {
      saveWebsiteLayoutContent(layout)
      toast.success('Website layout saved.')
      setLayout(getWebsiteLayoutContent())
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save layout.'
      toast.error(message)
    }
  }

  return (
    <AdminLayout
      title="Website layout"
      description="Global chrome — palettes still follow whichever drop is active."
    >
      <AdminSectionHeader
        eyebrow="Global"
        title="Header & footer"
        actions={
          <AdminButton type="button" variant="primary" size="sm" onClick={save}>
            <Save size={14} className="mr-1.5" aria-hidden="true" />
            Save layout
          </AdminButton>
        }
      />

      <AdminCard title="Header & announcement">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <MediaPickerField
              label="Header logo (stacked)"
              kind="image"
              hint="Leave empty to use the bundled official ANVL mark. Optional override: drag-drop, file picker, or paste a URL/public path."
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

        <div className="mt-8 space-y-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Links whose URL starts with{' '}
            <code className="rounded bg-[var(--color-surface)] px-1">/drop/</code>{' '}
            are the active campaign slot: the storefront replaces label and path
            using the active drop (currently:{' '}
            <span className="text-[var(--color-text)]">{activeDropTitle}</span>
            ).
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
              Desktop navigation
            </p>
            <div className="flex flex-wrap gap-2">
              {getWebsiteLayoutSaveError(layout) ? (
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
            {layout.header.headerLinks.map((link, index) => {
              const dropSlot = isActiveDropNavTemplateHref(link.href)
              const blockDeleteDropSlot = dropSlot && headerDropSlotCount === 1
              return (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
                >
                  {dropSlot ? (
                    <div className="md:col-span-2 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/60 p-3 text-xs text-[var(--color-text-muted)]">
                      <p className="font-medium text-[var(--color-text)]">
                        Active campaign slot (system-managed)
                      </p>
                      <p className="mt-1">
                        The live site shows the active drop title and{' '}
                        <code className="rounded bg-[var(--color-surface)] px-1">
                          /drop/&lt;slug&gt;
                        </code>{' '}
                        instead of the placeholder values stored here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <AdminFormField label="Label">
                        <AdminInput
                          value={link.label}
                          onChange={(e) =>
                            updateHeaderLink(index, { label: e.target.value })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Href">
                        <AdminInput
                          value={link.href}
                          onChange={(e) =>
                            updateHeaderLink(index, { href: e.target.value })
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
                      updateHeaderLink(index, { isVisible: e.target.checked })
                    }
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
                    onClick={() =>
                      patchHeader({
                        headerLinks: layout.header.headerLinks.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </AdminButton>
                </div>
              )
            })}
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
            {layout.header.mobileExtraLinks.map((link, index) => {
              const dropSlot = isActiveDropNavTemplateHref(link.href)
              return (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
                >
                  {dropSlot ? (
                    <div className="md:col-span-2 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/60 p-3 text-xs text-[var(--color-text-muted)]">
                      <p className="font-medium text-[var(--color-text)]">
                        Active campaign slot (system-managed)
                      </p>
                      <p className="mt-1">
                        Label and URL follow the active drop on the storefront.
                      </p>
                    </div>
                  ) : (
                    <>
                      <AdminFormField label="Label">
                        <AdminInput
                          value={link.label}
                          onChange={(e) =>
                            updateMobileLink(index, { label: e.target.value })
                          }
                        />
                      </AdminFormField>
                      <AdminFormField label="Href">
                        <AdminInput
                          value={link.href}
                          onChange={(e) =>
                            updateMobileLink(index, { href: e.target.value })
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
                      updateMobileLink(index, {
                        isVisible: e.target.checked,
                      })
                    }
                  />
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patchHeader({
                        mobileExtraLinks:
                          layout.header.mobileExtraLinks.filter(
                            (_, i) => i !== index,
                          ),
                      })
                    }
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </AdminButton>
                </div>
              )
            })}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Footer">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <MediaPickerField
              label="Footer logo"
              kind="image"
              hint="Leave empty for the official bundled mark. Optional: custom stacked mark via file picker, drag-drop, or public path."
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

        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
              Footer groups
            </p>
            <AdminButton
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                patchFooter({
                  linkGroups: [...layout.footer.linkGroups, emptyGroup()],
                })
              }
            >
              <Plus size={14} className="mr-1" aria-hidden="true" />
              Add group
            </AdminButton>
          </div>
          {layout.footer.linkGroups.map((group, gi) => (
            <div
              key={group.id}
              className="space-y-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <AdminFormField label="Group title (optional)">
                  <AdminInput
                    value={group.title ?? ''}
                    onChange={(e) => {
                      const linkGroups = layout.footer.linkGroups.map((g, i) =>
                        i === gi ? { ...g, title: e.target.value } : g,
                      )
                      patchFooter({ linkGroups })
                    }}
                  />
                </AdminFormField>
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patchFooter({
                      linkGroups: layout.footer.linkGroups.filter(
                        (_, i) => i !== gi,
                      ),
                    })
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
                    const linkGroups = layout.footer.linkGroups.map((g, i) =>
                      i === gi
                        ? { ...g, links: [...g.links, emptyLink()] }
                        : g,
                    )
                    patchFooter({ linkGroups })
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
                        <div className="md:col-span-2 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/60 p-3 text-xs text-[var(--color-text-muted)]">
                          <p className="font-medium text-[var(--color-text)]">
                            Active campaign slot (system-managed)
                          </p>
                          <p className="mt-1">
                            Footer uses the active drop title and slug on the
                            storefront.
                          </p>
                        </div>
                      ) : (
                        <>
                          <AdminFormField label="Label">
                            <AdminInput
                              value={link.label}
                              onChange={(e) =>
                                updateGroupLink(gi, li, {
                                  label: e.target.value,
                                })
                              }
                            />
                          </AdminFormField>
                          <AdminFormField label="Href">
                            <AdminInput
                              value={link.href}
                              onChange={(e) =>
                                updateGroupLink(gi, li, {
                                  href: e.target.value,
                                })
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
                          updateGroupLink(gi, li, {
                            isVisible: e.target.checked,
                          })
                        }
                      />
                      <AdminButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const linkGroups = layout.footer.linkGroups.map(
                            (g, i) =>
                              i === gi
                                ? {
                                    ...g,
                                    links: g.links.filter((_, j) => j !== li),
                                  }
                                : g,
                          )
                          patchFooter({ linkGroups })
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
    </AdminLayout>
  )
}
