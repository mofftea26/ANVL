import { Suspense, lazy, useCallback, useEffect, useState } from 'react'

import { ChevronRight } from '@/shared/icons'
import {
  fetchLandingPagePickerOptions,
  type LandingPagePickerOption,
} from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { listLandingPages } from '@/features/landingPages/registry'
import { ICON_SIZE } from '@/shared/lib/iconSize'

import { useActiveLandingKey } from './useSetupStatus'

/** Lazy — the drop console (grid + switches) costs nothing until opened. */
const DropStatusModal = lazy(() =>
  import('@/features/admin/landing-picker/DropStatusModal').then((m) => ({
    default: m.DropStatusModal,
  })),
)

/**
 * Status-strip tile: which code-owned landing page is live at `/`. Clicking it
 * opens the {@link DropStatusModal} — all drops with thumbnails, confirm-gated
 * activation, and the Coming Soon / banner switches. Reuses the landing
 * picker's fetch (Supabase labels ∩ code registry).
 */
export function ActiveDropTile() {
  const activeKey = useActiveLandingKey()
  const [pages, setPages] = useState<LandingPagePickerOption[]>(() => listLandingPages())
  const [modalOpen, setModalOpen] = useState(false)

  const refreshOptions = useCallback(() => {
    void fetchLandingPagePickerOptions()
      .then(setPages)
      .catch(() => {
        /* registry fallback already staged */
      })
  }, [])

  useEffect(() => {
    refreshOptions()
  }, [refreshOptions])

  const active = pages.find((page) => page.key === activeKey)

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title="Open drop status"
        aria-haspopup="dialog"
        className="focus-ring group flex min-h-11 items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.4)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] hover:bg-[var(--color-surface-elevated)]"
      >
        <span aria-hidden="true" className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
        </span>
        <span className="min-w-0">
          <span className="anvl-display block text-[10px] tracking-[0.28em] text-[var(--color-text-muted)]">
            Active drop
          </span>
          <span className="block truncate text-sm font-medium text-[var(--color-heading)]">
            {active?.name ?? activeKey}
            <span className="ml-2 hidden font-mono text-[11px] font-normal text-[var(--color-text-muted)] sm:inline">
              {activeKey}
            </span>
          </span>
        </span>
        <ChevronRight
          size={ICON_SIZE.sm}
          aria-hidden="true"
          className="shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)]"
        />
      </button>

      {modalOpen ? (
        <Suspense fallback={null}>
          <DropStatusModal
            open
            onClose={() => setModalOpen(false)}
            onActivated={refreshOptions}
          />
        </Suspense>
      ) : null}
    </>
  )
}
