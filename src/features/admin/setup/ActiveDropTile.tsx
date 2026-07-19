import { useEffect, useState } from 'react'

import {
  fetchLandingPagePickerOptions,
  type LandingPagePickerOption,
} from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { listLandingPages } from '@/features/landingPages/registry'

import { useActiveLandingKey } from './useSetupStatus'

/**
 * Compact status-strip tile: which code-owned landing page is live at `/`.
 * Reuses the landing picker's fetch (Supabase labels ∩ code registry) without
 * its tall card chrome — changing the drop happens in the Drop setup wizard.
 */
export function ActiveDropTile() {
  const activeKey = useActiveLandingKey()
  const [pages, setPages] = useState<LandingPagePickerOption[]>(() => listLandingPages())

  useEffect(() => {
    let mounted = true
    void fetchLandingPagePickerOptions()
      .then((options) => {
        if (mounted) setPages(options)
      })
      .catch(() => {
        /* registry fallback already staged */
      })
    return () => {
      mounted = false
    }
  }, [])

  const active = pages.find((page) => page.key === activeKey)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.4)]">
      <span aria-hidden="true" className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
      </span>
      <div className="min-w-0">
        <p className="anvl-display text-[10px] tracking-[0.28em] text-[var(--color-text-muted)]">
          Active drop
        </p>
        <p className="truncate text-sm font-medium text-[var(--color-heading)]">
          {active?.name ?? activeKey}
          <span className="ml-2 hidden font-mono text-[11px] font-normal text-[var(--color-text-muted)] sm:inline">
            {activeKey}
          </span>
        </p>
      </div>
    </div>
  )
}
