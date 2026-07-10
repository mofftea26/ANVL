import { useSyncExternalStore } from 'react'
import type { LinkProps } from '@tanstack/react-router'
import { Hourglass } from 'lucide-react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import {
  readComingSoonConfigFromStorage,
  subscribeComingSoonConfigChange,
} from '@/features/cms/comingSoon/comingSoon.settings'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { adminNavItems } from '@/features/admin/components/adminNav'
import { LandingPagePickerCard } from '@/features/admin/landing-picker/LandingPagePickerCard'
import { Badge } from '@/shared/components/ui/Badge'

const dashboardCards = adminNavItems.filter((i) => i.href !== '/admin')

export function AdminDashboardPageRoute() {
  return <DashboardContent />
}

/** Warm warning band shown while Coming Soon mode hides the public site. */
function ComingSoonLiveBanner() {
  const comingSoonEnabled = useSyncExternalStore(
    subscribeComingSoonConfigChange,
    () => readComingSoonConfigFromStorage().enabled,
    () => false,
  )
  if (!comingSoonEnabled) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] px-5 py-4">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
        <Hourglass size={ICON_SIZE.sm} aria-hidden="true" className="text-[var(--color-warning)]" />
        Coming Soon mode is LIVE — visitors see the reveal page, not the storefront.
      </p>
      <AdminForgedLink to={'/admin/coming-soon' as LinkProps['to']}>
        <span className="relative z-10">Manage</span>
      </AdminForgedLink>
    </div>
  )
}

function DashboardContent() {
  const overviewRail = (
    <>
      <AdminWorkspaceStatusPanel />
      <AdminRailPanel
        title="Quick help"
        description="Pick a surface to start editing."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>Set the live drop with the active page picker above.</li>
          <li>
            <span className="text-[var(--color-text)]">Theme</span> &amp;{' '}
            <span className="text-[var(--color-text)]">Fonts</span> restyle the whole storefront.
          </li>
          <li>
            <span className="text-[var(--color-text)]">Assets</span> and{' '}
            <span className="text-[var(--color-text)]">Content</span> dress the active landing page.
          </li>
        </ul>
      </AdminRailPanel>
    </>
  )

  return (
    <AdminLayout
      title="Dashboard"
      description="Active drop, theme, fonts, and assets."
      layout="workspace"
    >
      <AdminWorkspace asideLabel="Studio overview" aside={overviewRail}>
        <div className="space-y-6">
          <ComingSoonLiveBanner />
          <LandingPagePickerCard />
          <div className="grid items-stretch gap-6 sm:grid-cols-2 2xl:grid-cols-3">
            {dashboardCards.map((card) => (
              <AdminCard
                key={card.href}
                className="min-h-[15.5rem] sm:min-h-[16rem]"
                title={card.label}
                description={card.description}
              >
                <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-4 pt-0.5">
                  <Badge tone="accent" className="px-3 py-1.5 tracking-[0.22em]">
                    {card.badge}
                  </Badge>
                  <AdminForgedLink to={card.href as LinkProps['to']}>
                    <span className="relative z-10">{card.cta}</span>
                  </AdminForgedLink>
                </div>
              </AdminCard>
            ))}
          </div>
        </div>
      </AdminWorkspace>
    </AdminLayout>
  )
}
