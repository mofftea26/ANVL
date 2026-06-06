import type { WebsiteLayoutContent } from '@/features/admin/website-layout/websiteLayout.types'
import { cn } from '@/shared/lib/cn'

export type SiteLayoutPreviewProps = {
  layout: WebsiteLayoutContent
  className?: string
}

export function SiteLayoutPreview({
  layout,
  className,
}: SiteLayoutPreviewProps) {
  const visibleNav = layout.header.headerLinks.filter((l) => l.isVisible)
  const announcementOn = layout.header.announcement.enabled
  const announcementMessage =
    layout.header.announcement.message.trim() || 'Announcement message'

  return (
    <div
      data-testid="site-layout-preview"
      className={cn(
        'rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
        Preview
      </p>

      {announcementOn ? (
        <div
          className="mt-3 rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg)]/50 px-3 py-2 text-center text-[11px] text-[var(--color-text)]"
          data-testid="site-layout-preview-announcement"
        >
          {announcementMessage}
        </div>
      ) : null}

      <nav
        aria-label="Header navigation preview"
        className="mt-4 flex flex-wrap gap-2"
        data-testid="site-layout-preview-nav"
      >
        {visibleNav.length === 0 ? (
          <span className="text-xs text-[var(--color-text-muted)]">
            No visible nav links
          </span>
        ) : (
          visibleNav.map((link) => (
            <span
              key={link.id}
              className="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]"
            >
              {link.label}
            </span>
          ))
        )}
      </nav>

      <footer className="mt-6 border-t border-[var(--color-line)] pt-4">
        <p
          className="text-xs leading-relaxed text-[var(--color-text-muted)]"
          data-testid="site-layout-preview-tagline"
        >
          {layout.footer.tagline.trim() || 'Footer tagline'}
        </p>
        {layout.footer.microCaption.trim() ? (
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {layout.footer.microCaption}
          </p>
        ) : null}
      </footer>
    </div>
  )
}
