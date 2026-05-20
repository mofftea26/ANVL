import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import type { SeoFieldPatch } from '@/features/cms/types/cms.types'
import type { SiteStaticSeoPath } from '@/features/cms/siteSeo.local'
import { cn } from '@/shared/lib/cn'
import { SeoFieldsGroup } from './siteSeoEditor.shared'

export const STATIC_SEO_PAGE_OPTIONS: Array<{
  path: SiteStaticSeoPath
  label: string
}> = [
  { path: '/', label: 'Home' },
  { path: '/shop', label: 'Shop' },
  { path: '/about', label: 'About' },
  { path: '/size-guide', label: 'Size guide' },
]

export function SiteSeoStaticPagesPanel({
  activePath,
  pagePatch,
  onSelectPath,
  onChange,
}: {
  activePath: SiteStaticSeoPath
  pagePatch: SeoFieldPatch
  onSelectPath: (path: SiteStaticSeoPath) => void
  onChange: (patch: Partial<SeoFieldPatch>) => void
}) {
  return (
    <AdminCard title="Static pages">
      <div
        role="tablist"
        aria-label="Static page paths"
        className="mb-6 flex flex-wrap gap-1"
      >
        {STATIC_SEO_PAGE_OPTIONS.map((opt) => (
          <AdminButton
            key={opt.path}
            type="button"
            role="tab"
            aria-selected={activePath === opt.path}
            variant="adminTabList"
            data-active={activePath === opt.path ? 'true' : 'false'}
            onClick={() => onSelectPath(opt.path)}
          >
            {opt.label}
          </AdminButton>
        ))}
      </div>
      <p className={cn('mb-4 text-xs text-[var(--color-text-muted)]')}>
        Overrides for <code className="rounded bg-[var(--color-surface)] px-1">{activePath}</code>
      </p>
      <SeoFieldsGroup value={pagePatch} onChange={onChange} />
    </AdminCard>
  )
}
