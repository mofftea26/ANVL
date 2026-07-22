import { Suspense, lazy, useEffect, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { Check, SlidersHorizontal } from '@/shared/icons'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import {
  readActiveLandingPageFromStorage,
  saveActiveLandingPageKeyAsync,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'
import {
  readBannerConfigFromStorage,
  saveBannerConfigAsync,
  subscribeBannerConfigChange,
} from '@/features/cms/banner/bannerConfig.settings'
import { isBannerLive } from '@/features/cms/banner/isBannerLive'
import {
  readComingSoonConfigFromStorage,
  saveComingSoonConfigAsync,
  subscribeComingSoonConfigChange,
} from '@/features/cms/comingSoon/comingSoon.settings'
import { listLandingPages } from '@/features/landingPages/registry'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Modal } from '@/shared/components/ui/Modal'
import { Switch } from '@/shared/components/ui/Switch'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import { sanitizeHref } from '@/shared/lib/url'

import {
  fetchLandingPagePickerOptions,
  type LandingPagePickerOption,
} from './fetchLandingPagePickerOptions'

/**
 * The banner's full editing surface — heavy (media library, preview strip),
 * so it only loads when the admin actually opens it.
 */
const BannerCustomizeModal = lazy(() =>
  import('@/features/admin/banner/BannerCustomizeModal').then((m) => ({
    default: m.BannerCustomizeModal,
  })),
)

interface DropStatusModalProps {
  open: boolean
  onClose: () => void
  /** Fired after a successful activation so the opener can refresh its options. */
  onActivated?: () => void
}

function useActiveKey(): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    () => readActiveLandingPageFromStorage().key,
    () => readActiveLandingPageFromStorage().key,
  )
}

/** Live banner state for the status row (mirrors the Banner editor's chip logic). */
function bannerStatusText(): string {
  const config = readBannerConfigFromStorage()
  if (!config.enabled) return 'Off'
  const now = Date.now()
  if (isBannerLive(config, now)) return 'LIVE'
  const startAt = config.schedule.startAt.trim()
  if (startAt) {
    const startMs = Date.parse(startAt)
    if (Number.isFinite(startMs) && now < startMs) return 'Scheduled'
  }
  return 'Expired'
}

/** Preview thumbnail with a forged fallback plate when the image is unset/broken. */
function DropThumb({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false)
  const safeSrc = sanitizeHref(src)

  if (!safeSrc || broken) {
    return (
      <span
        aria-hidden="true"
        className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]"
      >
        <AnvlCompactMark className="h-7 w-auto opacity-60" aria-hidden />
      </span>
    )
  }

  return (
    <img
      src={safeSrc}
      alt={`${name} preview`}
      loading="lazy"
      decoding="async"
      width={320}
      height={180}
      className="aspect-[16/9] w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] object-cover"
      onError={() => setBroken(true)}
    />
  )
}

/**
 * Drop status console, opened from the dashboard's active-drop tile: every
 * available drop (Supabase labels ∩ code registry) as a clickable card —
 * activating one is confirm-gated because save IS publish — plus the two
 * storefront mode switches (Coming Soon reveal page, announcement banner).
 */
export function DropStatusModal({ open, onClose, onActivated }: DropStatusModalProps) {
  const activeKey = useActiveKey()
  const [pages, setPages] = useState<LandingPagePickerOption[]>(() => listLandingPages())
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [activating, setActivating] = useState(false)
  const [comingSoonSaving, setComingSoonSaving] = useState(false)
  const [bannerSaving, setBannerSaving] = useState(false)
  // Banner customize modal — flipping the switch ON opens it with
  // `enabled: true` pre-set (the enable persists only when the admin SAVES
  // there); the Customize button opens it as-is.
  const [bannerCustomize, setBannerCustomize] = useState<
    { open: true; enableOnOpen: boolean } | { open: false }
  >({ open: false })

  const comingSoonEnabled = useSyncExternalStore(
    subscribeComingSoonConfigChange,
    () => readComingSoonConfigFromStorage().enabled,
    () => false,
  )
  const bannerEnabled = useSyncExternalStore(
    subscribeBannerConfigChange,
    () => readBannerConfigFromStorage().enabled,
    () => false,
  )

  useEffect(() => {
    if (!open) return
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
  }, [open])

  const pendingPage = pages.find((page) => page.key === pendingKey)

  const activate = async (key: string) => {
    setActivating(true)
    try {
      await saveActiveLandingPageKeyAsync(key)
      toast.success(
        `“${pages.find((page) => page.key === key)?.name ?? key}” is now the live drop.`,
      )
      setPendingKey(null)
      onActivated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not activate the drop.')
    } finally {
      setActivating(false)
    }
  }

  const toggleComingSoon = async (next: boolean) => {
    setComingSoonSaving(true)
    try {
      await saveComingSoonConfigAsync({
        ...readComingSoonConfigFromStorage(),
        enabled: next,
      })
      toast.success(next ? 'Coming Soon is now LIVE.' : 'Coming Soon turned off.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save Coming Soon.')
    } finally {
      setComingSoonSaving(false)
    }
  }

  // Turning ON routes through the customize modal (nothing persists until the
  // admin saves there). Turning OFF stays a quick direct toggle.
  const toggleBanner = async (next: boolean) => {
    if (next) {
      setBannerCustomize({ open: true, enableOnOpen: true })
      return
    }
    setBannerSaving(true)
    try {
      await saveBannerConfigAsync({
        ...readBannerConfigFromStorage(),
        enabled: false,
      })
      toast.success('Banner disabled.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the banner.')
    } finally {
      setBannerSaving(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Drop status"
        className="max-w-2xl"
      >
        <div className="space-y-6" data-testid="drop-status-modal">
          <section aria-label="Available drops" className="space-y-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              The homepage at <span className="font-mono">/</span> renders the active
              code-owned drop. Activation publishes immediately.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {pages.map((page) => {
                const isActive = page.key === activeKey
                return (
                  <li key={page.key}>
                    <button
                      type="button"
                      disabled={activating}
                      aria-pressed={isActive}
                      onClick={() => {
                        if (!isActive) setPendingKey(page.key)
                      }}
                      className={cn(
                        'focus-ring relative block w-full rounded-xl border p-3 text-left transition-colors',
                        isActive
                          ? 'border-[color-mix(in_srgb,var(--color-success)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]'
                          : 'border-[var(--color-line)] bg-[var(--color-surface)]/70 hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] hover:bg-[var(--color-surface-elevated)]',
                      )}
                    >
                      <DropThumb src={page.previewImage} name={page.name} />
                      <span className="mt-2.5 flex items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--color-heading)]">
                            {page.name}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-[var(--color-text-muted)]">
                            {page.key}
                          </span>
                        </span>
                        {isActive ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-success)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-success)]">
                            <Check size={ICON_SIZE.xs} aria-hidden />
                            Active
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section
            aria-label="Storefront modes"
            className="space-y-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-4"
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
              Storefront modes
            </h3>
            <div className="flex items-start justify-between gap-4">
              <Switch
                label="Coming Soon"
                description={
                  comingSoonEnabled
                    ? 'LIVE — visitors see the reveal page instead of the storefront.'
                    : 'Off — the storefront is public.'
                }
                checked={comingSoonEnabled}
                disabled={comingSoonSaving}
                onChange={(next) => void toggleComingSoon(next)}
                className="flex-1"
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <Switch
                label="Announcement banner"
                description={`Currently: ${bannerStatusText()}. Turning it on opens the customize panel — message, colors, animation, and schedule.`}
                checked={bannerEnabled}
                disabled={bannerSaving}
                onChange={(next) => void toggleBanner(next)}
                className="flex-1"
              />
              <button
                type="button"
                data-testid="banner-customize-button"
                className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] hover:text-[var(--color-text)]"
                onClick={() =>
                  setBannerCustomize({ open: true, enableOnOpen: false })
                }
              >
                <SlidersHorizontal size={ICON_SIZE.sm} aria-hidden="true" />
                Customize
              </button>
            </div>
          </section>
        </div>
      </Modal>

      {bannerCustomize.open ? (
        <Suspense fallback={null}>
          <BannerCustomizeModal
            open
            onClose={() => setBannerCustomize({ open: false })}
            initialOverrides={
              bannerCustomize.enableOnOpen ? { enabled: true } : undefined
            }
          />
        </Suspense>
      ) : null}

      <AdminConfirmDialog
        open={pendingKey !== null}
        onClose={() => (activating ? undefined : setPendingKey(null))}
        title={`Activate “${pendingPage?.name ?? pendingKey ?? ''}”?`}
        confirmLabel="Activate"
        confirmLoading={activating}
        onConfirm={() => pendingKey && void activate(pendingKey)}
      >
        The live storefront home switches to this drop immediately — save is
        publish. Visitors see it on their next page load.
      </AdminConfirmDialog>
    </>
  )
}
