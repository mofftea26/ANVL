import {
  Bell,
  Check,
  Info,
  Save,
} from '@/shared/icons'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  readBannerConfigFromStorage,
  saveBannerConfigAsync,
  subscribeBannerConfigChange,
} from '@/features/cms/banner/bannerConfig.settings'
import type { BannerConfig } from '@/features/cms/banner/bannerConfig.zod'
import { isBannerLive } from '@/features/cms/banner/isBannerLive'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'

/** Status-chip refresh cadence so "scheduled" flips to "live" without edits. */
const STATUS_CLOCK_MS = 30_000

/** Picker fallbacks — shown in the color input while the override is unset. */
const COLOR_PICKER_FALLBACK = { background: '#1D1F21', text: '#E7E4DF' } as const

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

function useStoredBannerConfig(): BannerConfig {
  return useSyncExternalStore(
    subscribeBannerConfigChange,
    () => readBannerConfigFromStorage(),
    () => readBannerConfigFromStorage(),
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">
        {title}
      </h2>
      {children}
    </section>
  )
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

/**
 * Announcement banner editor — the master toggle plus message, optional
 * link/CTA, small leading image, color overrides, and an optional schedule
 * window. Writes a local working copy and pushes to Supabase
 * (`cms_settings.banner_config` + `storefront_publication.banner_config`)
 * on save. The live-preview iframe tracks unsaved edits via the draft bridge.
 */
export function BannerEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredBannerConfig()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'banner',
    stored,
    saveAsync: saveBannerConfigAsync,
    successMessage: 'Banner saved.',
    errorFallbackMessage: 'Could not save the banner.',
  })
  usePushPreviewDraft('banner', config)

  const mediaQuery = useMediaAssetsQuery()

  // Live status chip — re-evaluated on a clock so a scheduled banner flips to
  // LIVE (or expires) while the editor sits open.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), STATUS_CLOCK_MS)
    return () => clearInterval(id)
  }, [])
  const status = resolveBannerStatus(config, now)

  const set = useCallback(
    <K extends keyof BannerConfig>(key: K, value: BannerConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
    [setConfig],
  )
  const setColor = useCallback(
    (key: keyof BannerConfig['colors'], value: string) =>
      setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } })),
    [setConfig],
  )
  const setSchedule = useCallback(
    (key: keyof BannerConfig['schedule'], value: string) =>
      setConfig((prev) => ({
        ...prev,
        schedule: { ...prev.schedule, [key]: value },
      })),
    [setConfig],
  )

  const toolbar = useMemo(
    () => (
      <Button
        type="button"
        disabled={saving}
        variant="primary"
        size="md"
        density="compact"
        loading={saving}
        onClick={save}
      >
        {showSuccess ? <Check size={ICON_SIZE.sm} /> : <Save size={ICON_SIZE.sm} />}
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save Banner'}
      </Button>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const colorField = (
    key: keyof BannerConfig['colors'],
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
        {config.colors[key].trim() ? (
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

  const rail = (
    <AdminRailPanel
      title="How the banner works"
      icon={<Info size={17} />}
      description="A slim strip above the storefront topbar — announcements, promos, shipping notes."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>The master toggle alone controls it — the schedule is optional.</li>
        <li>With a schedule, it shows from the start time and hides at the end time.</li>
        <li>Blank colors follow the theme accent; overrides are exact hex values.</li>
        <li>Set a link label to render a separate CTA; without one the message itself links.</li>
      </ul>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Banner help" aside={rail}>
      <div className="space-y-6" data-testid="banner-editor">
        <Section title="Status">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Checkbox
              label="Enable the banner"
              description="Master switch. With a schedule set, the banner also has to be inside the window."
              checked={config.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
            />
            <StatusChip status={status} />
          </div>
        </Section>

        <Section title="Message & link">
          <div className="space-y-4">
            <FormField label="Message" hint="The banner text. Empty hides the banner." labelStyle="stacked">
              <Input
                density="compact"
                value={config.message}
                onChange={(e) => set('message', e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Link URL"
                hint="Optional. https:// or a site path like /shop."
                labelStyle="stacked"
              >
                <Input
                  density="compact"
                  value={config.href}
                  onChange={(e) => set('href', e.target.value)}
                />
              </FormField>
              <FormField
                label="Link label"
                hint="Optional CTA after the message — blank makes the message itself the link."
                labelStyle="stacked"
              >
                <Input
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
          </div>
        </Section>

        <Section title="Colors">
          <div className="grid gap-4 sm:grid-cols-2">
            {colorField('background', 'Background', 'Blank = theme accent.')}
            {colorField('text', 'Text', 'Blank = theme text-on-accent.')}
          </div>
        </Section>

        <Section title="Schedule">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Starts at"
              hint="Optional. Blank = live as soon as enabled."
              labelStyle="stacked"
            >
              <Input
                density="compact"
                type="datetime-local"
                value={config.schedule.startAt}
                onChange={(e) => setSchedule('startAt', e.target.value)}
              />
            </FormField>
            <FormField
              label="Ends at"
              hint="Optional. Blank = never expires."
              labelStyle="stacked"
            >
              <Input
                density="compact"
                type="datetime-local"
                value={config.schedule.endAt}
                onChange={(e) => setSchedule('endAt', e.target.value)}
              />
            </FormField>
          </div>
        </Section>
      </div>
    </AdminWorkspace>
  )
}
