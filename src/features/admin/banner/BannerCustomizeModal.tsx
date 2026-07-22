import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react'
import { toast } from 'sonner'

import { Bell, Plus, X } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { useRegisterAdminDirty } from '@/features/admin/hooks/useRegisterAdminDirty'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { mediaAssetPublicUrl } from '@/features/admin/media/mediaAssets.service'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { BannerStrip } from '@/features/cms/banner/BannerStrip'
import {
  readBannerConfigFromStorage,
  saveBannerConfigAsync,
  subscribeBannerConfigChange,
} from '@/features/cms/banner/bannerConfig.settings'
import type {
  BannerAnimation,
  BannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'
import { isBannerLive } from '@/features/cms/banner/isBannerLive'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { isLikelySafeMediaSrc, sanitizeHref } from '@/shared/lib/url'

/** Status-chip refresh cadence so "scheduled" flips to "live" without edits. */
const STATUS_CLOCK_MS = 30_000

/** Picker fallbacks — shown in the color input while the override is unset. */
const COLOR_PICKER_FALLBACK = {
  background: '#1D1F21',
  background2: '#34373A',
  text: '#E7E4DF',
} as const

/** Idle animation presets in plain English — the strip's five behaviors. */
const ANIMATION_OPTIONS: readonly {
  value: BannerAnimation
  label: string
  description: string
}[] = [
  { value: 'none', label: 'None', description: 'A static strip — no motion.' },
  {
    value: 'marquee',
    label: 'Marquee',
    description: 'The message scrolls across as a seamless ticker. Pauses on hover.',
  },
  {
    value: 'shimmer',
    label: 'Shimmer',
    description: 'A light sheen sweeps across every few seconds.',
  },
  {
    value: 'pulse',
    label: 'Pulse',
    description: 'A soft, slow brightness breathing.',
  },
  {
    value: 'gradient-shift',
    label: 'Gradient shift',
    description: 'The gradient slowly pans. Needs a second background color.',
  },
]

type BannerStatus = 'live' | 'scheduled' | 'expired' | 'off'

function resolveBannerStatus(config: BannerConfig, now: number): BannerStatus {
  if (!config.enabled) return 'off'
  if (isBannerLive(config, now)) return 'live'
  const startAt = config.schedule.startAt.trim()
  if (startAt) {
    const startMs = Date.parse(startAt)
    if (Number.isFinite(startMs) && now < startMs) return 'scheduled'
  }
  return 'expired'
}

const STATUS_LABELS: Record<BannerStatus, string> = {
  live: 'LIVE',
  scheduled: 'Scheduled',
  expired: 'Expired',
  off: 'Off',
}

function StatusChip({ status }: { status: BannerStatus }) {
  const tone =
    status === 'live'
      ? 'border-[color-mix(in_oklab,var(--color-success)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] text-[var(--color-success)]'
      : status === 'scheduled'
        ? 'border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] text-[var(--color-warning)]'
        : 'border-[var(--color-line)] bg-[var(--color-bg)]/40 text-[var(--color-text-muted)]'
  return (
    <span
      data-testid="banner-status-chip"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${tone}`}
    >
      <Bell size={ICON_SIZE.sm} aria-hidden="true" />
      Currently: {STATUS_LABELS[status]}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
      {children}
    </h3>
  )
}

export interface BannerCustomizeModalProps {
  open: boolean
  onClose: () => void
  /**
   * Overrides merged into the working copy on open — the dashboard switch-ON
   * path passes `{ enabled: true }` so the enable only persists when the
   * admin actually SAVES here (no double-save, no half-configured banner).
   */
  initialOverrides?: Partial<Pick<BannerConfig, 'enabled'>>
}

/**
 * The banner's ONE editing surface — a modal opened from the dashboard's
 * drop-status console (the standalone `/admin/banner` page is gone). Carries
 * everything the old editor had (toggle, message, link, image, colors,
 * schedule) plus gradient + idle-animation controls, topped by a live mini
 * preview rendering the REAL `BannerStrip` from the unsaved working copy.
 *
 * Explicit Save = publish (`saveBannerConfigAsync` write-through). Dirty
 * state registers with the shared admin guard and closing dirty asks first.
 */
export function BannerCustomizeModal(props: BannerCustomizeModalProps) {
  // Mount fresh per open so the working copy re-seeds from storage each time.
  if (!props.open) return null
  return <BannerCustomizeModalContent {...props} />
}

function BannerCustomizeModalContent({
  onClose,
  initialOverrides,
}: BannerCustomizeModalProps) {
  const stored = useSyncExternalStore(
    subscribeBannerConfigChange,
    readBannerConfigFromStorage,
    readBannerConfigFromStorage,
  )
  const [config, setConfig] = useState<BannerConfig>(() => ({
    ...readBannerConfigFromStorage(),
    ...initialOverrides,
  }))
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // Explicit label↔control wiring — FormField renders `<label htmlFor>`.
  const fieldId = useId()
  const messageId = `${fieldId}-message`
  const hrefId = `${fieldId}-href`
  const linkLabelId = `${fieldId}-link-label`
  const angleId = `${fieldId}-angle`
  const startAtId = `${fieldId}-start-at`
  const endAtId = `${fieldId}-end-at`

  const isDirty = JSON.stringify(config) !== JSON.stringify(stored)
  useRegisterAdminDirty('banner-modal', isDirty)
  usePushPreviewDraft('banner', config)

  const mediaQuery = useMediaAssetsQuery()

  // Live status chip — re-evaluated on a clock so a scheduled banner flips to
  // LIVE (or expires) while the modal sits open.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), STATUS_CLOCK_MS)
    return () => clearInterval(id)
  }, [])
  const status = resolveBannerStatus(config, now)

  const set = useCallback(
    <K extends keyof BannerConfig>(key: K, value: BannerConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [],
  )
  const setColor = useCallback(
    (key: 'background' | 'background2' | 'text', value: string) =>
      setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } })),
    [],
  )
  const setSchedule = useCallback(
    (key: keyof BannerConfig['schedule'], value: string) =>
      setConfig((prev) => ({
        ...prev,
        schedule: { ...prev.schedule, [key]: value },
      })),
    [],
  )

  const save = async () => {
    setSaving(true)
    try {
      await saveBannerConfigAsync(config)
      toast.success('Banner saved.')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the banner.')
    } finally {
      setSaving(false)
    }
  }

  const requestClose = () => {
    if (saving) return
    if (isDirty) setConfirmDiscard(true)
    else onClose()
  }

  // --- Mini live preview ------------------------------------------------
  const message = config.message.trim()
  const asset = (mediaQuery.data ?? []).find(
    (a) => a.id === config.imageMediaId.trim(),
  )
  const rawImageUrl = asset ? mediaAssetPublicUrl(asset) : null
  const previewImageUrl =
    rawImageUrl && isLikelySafeMediaSrc(rawImageUrl) ? rawImageUrl : null
  const hasPreviewContent = message.length > 0 || Boolean(previewImageUrl)

  const hasGradient = config.colors.background2.trim().length > 0

  const colorField = (
    key: 'background' | 'background2' | 'text',
    label: string,
    hint: string,
  ) => (
    <FormField label={label} hint={hint} labelStyle="stacked">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color`}
          className="focus-ring h-11 w-14 cursor-pointer rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-1"
          value={config.colors[key].trim() || COLOR_PICKER_FALLBACK[key]}
          onChange={(e) => setColor(key, e.target.value)}
        />
        <span className="text-xs text-[var(--color-text-muted)]">
          {config.colors[key].trim() || 'Theme default'}
        </span>
        {config.colors[key].trim() && key !== 'background2' ? (
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 items-center rounded-lg px-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            onClick={() => setColor(key, '')}
          >
            Use theme default
          </button>
        ) : null}
      </div>
    </FormField>
  )

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        title="Announcement banner"
        className="max-w-2xl"
      >
        <div
          className="max-h-[70vh] space-y-6 overflow-y-auto pr-1"
          data-testid="banner-customize-modal"
        >
          {/* Live mini preview — the REAL storefront strip, unsaved edits included. */}
          <div className="space-y-1.5">
            <div className="overflow-hidden rounded-lg border border-[var(--color-line)]">
              {hasPreviewContent ? (
                <BannerStrip
                  compact
                  message={message}
                  href={sanitizeHref(config.href)}
                  linkLabel={config.linkLabel.trim()}
                  imageUrl={previewImageUrl}
                  colors={config.colors}
                  animation={config.animation}
                />
              ) : (
                <div className="flex min-h-8 items-center justify-center bg-[var(--color-bg)]/40 px-3 py-1 text-xs text-[var(--color-text-muted)]">
                  Add a message to preview the banner.
                </div>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Live preview of the strip exactly as the storefront renders it —
              including the idle animation.
            </p>
          </div>

          <section className="space-y-3">
            <SectionTitle>Status</SectionTitle>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Checkbox
                label="Enable the banner"
                description="Master switch. With a schedule set, the banner also has to be inside the window."
                checked={config.enabled}
                onChange={(e) => set('enabled', e.target.checked)}
              />
              <StatusChip status={status} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Message &amp; link</SectionTitle>
            <FormField
              label="Message"
              htmlFor={messageId}
              hint="The banner text. Empty hides the banner."
              labelStyle="stacked"
            >
              <Input
                id={messageId}
                density="compact"
                value={config.message}
                onChange={(e) => set('message', e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Link URL"
                htmlFor={hrefId}
                hint="Optional. https:// or a site path like /shop."
                labelStyle="stacked"
              >
                <Input
                  id={hrefId}
                  density="compact"
                  value={config.href}
                  onChange={(e) => set('href', e.target.value)}
                />
              </FormField>
              <FormField
                label="Link label"
                htmlFor={linkLabelId}
                hint="Optional CTA after the message — blank makes the message itself the link."
                labelStyle="stacked"
              >
                <Input
                  id={linkLabelId}
                  density="compact"
                  value={config.linkLabel}
                  onChange={(e) => set('linkLabel', e.target.value)}
                />
              </FormField>
            </div>
            <MediaLibrarySlotField
              label="Leading image"
              hint="Optional small icon before the message (rendered ~20px tall)."
              mediaId={config.imageMediaId}
              onMediaIdChange={(id) => set('imageMediaId', id)}
              kind="image"
              assets={mediaQuery.data ?? []}
            />
          </section>

          <section className="space-y-4">
            <SectionTitle>Colors</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {colorField('background', 'Background', 'Blank = theme accent.')}
              {colorField('text', 'Text', 'Blank = theme text-on-accent.')}
            </div>
            {hasGradient ? (
              <div className="grid items-end gap-4 sm:grid-cols-2">
                {colorField(
                  'background2',
                  'Second background',
                  'Blends from the background color.',
                )}
                <div className="flex flex-wrap items-end gap-3">
                  <FormField
                    label="Gradient angle"
                    htmlFor={angleId}
                    hint="0–360 degrees. 90 = left to right."
                    labelStyle="stacked"
                  >
                    <Input
                      id={angleId}
                      density="compact"
                      type="number"
                      min={0}
                      max={360}
                      value={config.colors.gradientAngle}
                      onChange={(e) => {
                        const parsed = Number(e.target.value)
                        setConfig((prev) => ({
                          ...prev,
                          colors: {
                            ...prev.colors,
                            gradientAngle: Number.isFinite(parsed)
                              ? Math.min(360, Math.max(0, parsed))
                              : 90,
                          },
                        }))
                      }}
                    />
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    density="compact"
                    onClick={() => setColor('background2', '')}
                  >
                    <X size={ICON_SIZE.sm} aria-hidden="true" />
                    Use solid color
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                density="compact"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    colors: {
                      ...prev.colors,
                      // A gradient needs both stops — seed a real background
                      // too when it was still on the theme fallback.
                      background:
                        prev.colors.background.trim() ||
                        COLOR_PICKER_FALLBACK.background,
                      background2: COLOR_PICKER_FALLBACK.background2,
                    },
                  }))
                }
              >
                <Plus size={ICON_SIZE.sm} aria-hidden="true" />
                Add gradient
              </Button>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Motion</SectionTitle>
            <AdminFieldSelect
              label="Idle animation"
              hint="Subtle motion while the banner is live. Automatically off for visitors who prefer reduced motion."
              value={config.animation}
              options={ANIMATION_OPTIONS}
              onChange={(value) => set('animation', value as BannerAnimation)}
            />
          </section>

          <section className="space-y-4">
            <SectionTitle>Schedule</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Starts at"
                htmlFor={startAtId}
                hint="Optional. Blank = live as soon as enabled."
                labelStyle="stacked"
              >
                <Input
                  id={startAtId}
                  density="compact"
                  type="datetime-local"
                  value={config.schedule.startAt}
                  onChange={(e) => setSchedule('startAt', e.target.value)}
                />
              </FormField>
              <FormField
                label="Ends at"
                htmlFor={endAtId}
                hint="Optional. Blank = never expires."
                labelStyle="stacked"
              >
                <Input
                  id={endAtId}
                  density="compact"
                  type="datetime-local"
                  value={config.schedule.endAt}
                  onChange={(e) => setSchedule('endAt', e.target.value)}
                />
              </FormField>
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--color-line)] pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            density="compact"
            disabled={saving}
            onClick={requestClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={saving}
            disabled={saving || !isDirty}
            onClick={() => void save()}
          >
            Save banner
          </Button>
        </div>
      </Modal>

      <AdminConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard banner changes?"
        cancelLabel="Stay"
        confirmLabel="Leave"
        confirmVariant="destructive"
        onConfirm={() => {
          setConfirmDiscard(false)
          onClose()
        }}
      >
        Your unsaved banner edits will be lost.
      </AdminConfirmDialog>
    </>
  )
}
