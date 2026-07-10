import {
  Check,
  ExternalLink,
  Hourglass,
  ImagePlus,
  Info,
  Save,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  readComingSoonConfigFromStorage,
  saveComingSoonConfigAsync,
  subscribeComingSoonConfigChange,
} from '@/features/cms/comingSoon/comingSoon.settings'
import type { ComingSoonConfig } from '@/features/cms/comingSoon/comingSoon.zod'
import { Textarea } from '@/shared/components/ui'
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { ComingSoonSubscribersPanel } from './ComingSoonSubscribersPanel'

const TIMEZONE_OPTIONS = [
  'Asia/Beirut',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
]

/** Config keys that pick media through the library modal. */
type MediaSlotKey =
  | 'backgroundMediaId'
  | 'ambientMediaId'
  | 'logoMediaId'
  | 'ogImageMediaId'

const MEDIA_SLOT_TITLES: Record<MediaSlotKey, string> = {
  backgroundMediaId: 'Choose backdrop image',
  ambientMediaId: 'Choose ambient overlay',
  logoMediaId: 'Choose custom logo',
  ogImageMediaId: 'Choose social share image',
}

function useStoredComingSoonConfig(): ComingSoonConfig {
  return useSyncExternalStore(
    subscribeComingSoonConfigChange,
    () => readComingSoonConfigFromStorage(),
    () => readComingSoonConfigFromStorage(),
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

/**
 * Coming Soon editor — the site-mode master toggle plus every field of the
 * pre-launch reveal page (copy, countdown, CTAs, email capture, contact,
 * assets, SEO). Writes a local working copy and pushes to Supabase
 * (`cms_settings.coming_soon` + `storefront_publication.coming_soon`) on
 * save. Blank text fields fall back to the designed defaults at render.
 */
export function ComingSoonEditor() {
  const setPageActions = useAdminPageActions()
  const stored = useStoredComingSoonConfig()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'coming-soon',
    stored,
    saveAsync: saveComingSoonConfigAsync,
    successMessage: 'Coming Soon settings saved.',
    errorFallbackMessage: 'Could not save Coming Soon settings.',
  })
  const [pickSlot, setPickSlot] = useState<MediaSlotKey | null>(null)

  const mediaQuery = useMediaAssetsQuery()
  const mediaById = useMemo(() => {
    const map = new Map<string, string>()
    for (const asset of mediaQuery.data ?? []) map.set(asset.id, asset.filename)
    return map
  }, [mediaQuery.data])
  const mediaLabel = (id: string, empty: string) =>
    id.trim() ? (mediaById.get(id) ?? 'Assigned') : empty

  const set = useCallback(
    <K extends keyof ComingSoonConfig>(key: K, value: ComingSoonConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value })),
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
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save Coming Soon'}
      </Button>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const mediaButton = (key: MediaSlotKey, emptyLabel: string) => (
    <button
      type="button"
      className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
      onClick={() => setPickSlot(key)}
    >
      <ImagePlus size={ICON_SIZE.sm} aria-hidden="true" />
      {mediaLabel(config[key], emptyLabel)}
    </button>
  )

  const rail = (
    <AdminRailPanel
      title="How Coming Soon works"
      icon={<Info size={15} />}
      description="When enabled, every public page shows the reveal — the admin stays reachable."
    >
      <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
        <li>Turning the mode off instantly restores the full site — nothing is lost.</li>
        <li>Blank text fields fall back to the designed default copy.</li>
        <li>Colors follow the active theme; assets default to the bundled Drop 01 set.</li>
        <li>Early-access emails land in the private `coming_soon_subscribers` table.</li>
      </ul>
      <a
        href="/?anvl-preview=live"
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-[var(--color-accent)]"
      >
        <ExternalLink size={ICON_SIZE.sm} aria-hidden="true" />
        Preview the real site while the mode is on
      </a>
    </AdminRailPanel>
  )

  return (
    <AdminWorkspace asideLabel="Coming Soon help" aside={rail}>
      <div className="space-y-6" data-testid="coming-soon-editor">
        <Section title="Site mode">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Checkbox
              label="Coming Soon mode"
              description="Replace the entire public site with the reveal page. Admin is never blocked."
              checked={config.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
            />
            {config.enabled ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-warning)]">
                <Hourglass size={ICON_SIZE.sm} aria-hidden="true" />
                Live after save
              </span>
            ) : null}
          </div>
        </Section>

        <ComingSoonSubscribersPanel />

        <Section title="Copy">
          <div className="space-y-4">
            <FormField label="Eyebrow" labelStyle="stacked">
              <Input density="compact" value={config.eyebrowText} onChange={(e) => set('eyebrowText', e.target.value)} />
            </FormField>
            <FormField label="Headline" labelStyle="stacked">
              <Input density="compact" value={config.headline} onChange={(e) => set('headline', e.target.value)} />
            </FormField>
            <FormField label="Subheadline" labelStyle="stacked">
              <Input density="compact" value={config.subheadline} onChange={(e) => set('subheadline', e.target.value)} />
            </FormField>
            <FormField label="Body" hint="Hidden automatically on very short screens." labelStyle="stacked">
              <Textarea rows={4} value={config.bodyText} onChange={(e) => set('bodyText', e.target.value)} />
            </FormField>
            <FormField label="Tagline" hint="Stamped in the footline." labelStyle="stacked">
              <Input density="compact" value={config.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Countdown">
          <div className="space-y-4">
            <Checkbox
              label="Show the countdown"
              description="The layout stays complete when this is off."
              checked={config.countdownEnabled}
              onChange={(e) => set('countdownEnabled', e.target.checked)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Launch date & time" hint="Local wall-clock in the chosen timezone." labelStyle="stacked">
                <Input
                  density="compact"
                  type="datetime-local"
                  value={config.countdownDate}
                  onChange={(e) => set('countdownDate', e.target.value)}
                />
              </FormField>
              <AdminFieldSelect
                label="Timezone"
                value={config.countdownTimezone}
                onChange={(v) => set('countdownTimezone', v)}
                options={[
                  ...(TIMEZONE_OPTIONS.includes(config.countdownTimezone)
                    ? []
                    : [{ value: config.countdownTimezone, label: config.countdownTimezone }]),
                  ...TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz })),
                ]}
              />
            </div>
            <FormField label="Countdown label" labelStyle="stacked">
              <Input density="compact" value={config.countdownLabel} onChange={(e) => set('countdownLabel', e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Email capture">
          <div className="space-y-4">
            <Checkbox
              label="Show the early-access form"
              checked={config.showEmailCapture}
              onChange={(e) => set('showEmailCapture', e.target.checked)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField label="Title" labelStyle="stacked">
                <Input density="compact" value={config.emailCaptureTitle} onChange={(e) => set('emailCaptureTitle', e.target.value)} />
              </FormField>
              <FormField label="Placeholder" labelStyle="stacked">
                <Input density="compact" value={config.emailCapturePlaceholder} onChange={(e) => set('emailCapturePlaceholder', e.target.value)} />
              </FormField>
              <FormField label="Button text" labelStyle="stacked">
                <Input density="compact" value={config.emailCaptureButtonText} onChange={(e) => set('emailCaptureButtonText', e.target.value)} />
              </FormField>
            </div>
          </div>
        </Section>

        <Section title="Social links & contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Instagram handle" hint="Shown as an icon button. Blank hides it." labelStyle="stacked">
              <Input density="compact" value={config.instagramHandle} onChange={(e) => set('instagramHandle', e.target.value)} />
            </FormField>
            <FormField label="Support email" hint="The mail icon links here." labelStyle="stacked">
              <Input density="compact" type="email" value={config.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
            </FormField>
            <FormField label="TikTok URL" hint="Full https:// link. Blank hides the icon." labelStyle="stacked">
              <Input density="compact" value={config.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} />
            </FormField>
            <FormField label="YouTube URL" hint="Full https:// link. Blank hides the icon." labelStyle="stacked">
              <Input density="compact" value={config.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)} />
            </FormField>
            <FormField label="Facebook URL" hint="Full https:// link. Blank hides the icon." labelStyle="stacked">
              <Input density="compact" value={config.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} />
            </FormField>
          </div>
        </Section>

        <Section title="Assets & look">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Backdrop image" hint="16:9, ~2560×1440, WebP < 400 KB." labelStyle="stacked">
              {mediaButton('backgroundMediaId', 'Bundled Drop 01 backdrop')}
            </FormField>
            <FormField label="Ambient overlay" hint="Low-contrast haze, blended at low opacity." labelStyle="stacked">
              {mediaButton('ambientMediaId', 'Bundled ambient haze')}
            </FormField>
            <AdminFieldSelect
              label="Logo"
              value={config.logoVariant}
              onChange={(v) => set('logoVariant', v as ComingSoonConfig['logoVariant'])}
              options={[
                { value: 'crest', label: 'ANVL crest' },
                { value: 'wordmark', label: 'ANVL wordmark' },
                { value: 'custom', label: 'Custom image' },
              ]}
            />
            {config.logoVariant === 'custom' ? (
              <FormField label="Custom logo image" labelStyle="stacked">
                {mediaButton('logoMediaId', 'No logo picked')}
              </FormField>
            ) : null}
            <AdminFieldSelect
              label="Accent treatment"
              value={config.themeVariant}
              onChange={(v) => set('themeVariant', v as ComingSoonConfig['themeVariant'])}
              options={[
                {
                  value: 'champagne',
                  label: 'Champagne gold',
                  description: 'The Drop 01 reveal accent (page-scoped)',
                },
                {
                  value: 'oath',
                  label: 'Theme accent',
                  description: 'Follows the published palette accent',
                },
              ]}
            />
          </div>
        </Section>

        <Section title="SEO & sharing">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="SEO title" labelStyle="stacked">
                <Input density="compact" value={config.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
              </FormField>
              <FormField label="OG title" hint="Blank = SEO title." labelStyle="stacked">
                <Input density="compact" value={config.ogTitle} onChange={(e) => set('ogTitle', e.target.value)} />
              </FormField>
            </div>
            <FormField label="SEO description" labelStyle="stacked">
              <Textarea rows={2} value={config.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} />
            </FormField>
            <FormField label="OG description" hint="Blank = SEO description." labelStyle="stacked">
              <Textarea rows={2} value={config.ogDescription} onChange={(e) => set('ogDescription', e.target.value)} />
            </FormField>
            <FormField label="Social share image" hint="1200×630. Blank = bundled reveal card." labelStyle="stacked">
              {mediaButton('ogImageMediaId', 'Bundled reveal card')}
            </FormField>
          </div>
        </Section>
      </div>

      {pickSlot ? (
        <MediaLibraryPickerModal
          open
          onClose={() => setPickSlot(null)}
          kind="image"
          allowClear
          title={MEDIA_SLOT_TITLES[pickSlot]}
          selectedMediaId={config[pickSlot].trim() || null}
          onSelect={(picked) => {
            set(pickSlot, picked?.id ?? '')
            setPickSlot(null)
          }}
        />
      ) : null}
    </AdminWorkspace>
  )
}
