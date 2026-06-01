import type { LinkProps } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminStatusBadge } from '@/features/admin/components/AdminStatusBadge'
import { adminNavItems } from '@/features/admin/components/adminNav'
import {
  readSiteHomepageFromStorage,
  saveSiteHomepageModeAsync,
  type HomepageMode,
} from '@/features/cms/siteHomepage.settings'
import { useState } from 'react'

const dashboardCards = adminNavItems.filter((i) => i.href !== '/admin')

export function AdminDashboardPageRoute() {
  return (
    <ProtectedAdminRoute>
      <DashboardContent />
    </ProtectedAdminRoute>
  )
}

const HOMEPAGE_MODE_OPTIONS = [
  {
    value: 'default',
    label: 'Brand showcase (no drop acts)',
    description:
      'Cinematic 3D scroll showcase — emblem tunnel, kinetic manifesto, depth product reveals. No oath act sequence.',
  },
  {
    value: 'custom',
    label: 'Live drop campaign (The Oath)',
    description:
      'Homepage shows the active drop’s 7-act scroll story (hero → close).',
  },
] as const

function DashboardContent() {
  const [homepageMode, setHomepageModeState] = useState<HomepageMode>(
    () => readSiteHomepageFromStorage().mode,
  )
  const [homepageSaving, setHomepageSaving] = useState(false)
  const [homepageError, setHomepageError] = useState<string | null>(null)

  return (
    <AdminLayout
      title="Dashboard"
      description="Campaign drops, catalog, and site chrome."
    >
      <AdminCard
        title="Homepage"
        description="What visitors see at / — brand showcase vs your live drop."
      >
        <AdminFieldSelect
          label="Homepage"
          value={homepageMode}
          options={HOMEPAGE_MODE_OPTIONS}
          disabled={homepageSaving}
          hint={
            homepageError ??
            (homepageMode === 'default'
              ? 'Visitors get a cinematic 3D scroll showcase — no header, footer, or drop palette. Emblems fly through depth, manifesto and products reveal on scroll.'
              : 'Visitors get The Oath (or whichever drop is active). Publish the drop so changes go live.')
          }
          onChange={(mode) => {
            const m = mode as HomepageMode
            setHomepageModeState(m)
            setHomepageError(null)
            setHomepageSaving(true)
            void saveSiteHomepageModeAsync(m)
              .then(() => setHomepageSaving(false))
              .catch((err: unknown) => {
                setHomepageSaving(false)
                setHomepageError(
                  err instanceof Error ? err.message : 'Could not save homepage mode.',
                )
                setHomepageModeState(readSiteHomepageFromStorage().mode)
              })
          }}
        />
      </AdminCard>
      <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <AdminCard
            key={card.href}
            className="min-h-[15.5rem] sm:min-h-[16rem]"
            title={card.label}
            description={card.description}
          >
            <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-4 pt-0.5">
              <AdminStatusBadge tone="accent" className="px-3 py-1.5 tracking-[0.22em]">
                {card.badge}
              </AdminStatusBadge>
              <AdminForgedLink to={card.href as LinkProps['to']}>
                <span className="relative z-10">{card.cta}</span>
              </AdminForgedLink>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
