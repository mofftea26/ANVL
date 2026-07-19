import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import {
  fetchLandingPagePickerOptions,
  type LandingPagePickerOption,
} from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { saveActiveLandingPageKeyAsync } from '@/features/cms/landingPageActiveKey.settings'
import { listLandingPages } from '@/features/landingPages/registry'
import { Button } from '@/shared/components/ui/Button'
import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import {
  dropSlotTotal,
  useActiveLandingKey,
  useDropSlotAssignedCount,
  useHasLandingContent,
} from '../useSetupStatus'

interface StepProps {
  onNavigate: () => void
}

/** Step 1 — pick the live landing page (the one CMS switch, inlined). */
function ActivePageStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const [pages, setPages] = useState<LandingPagePickerOption[]>(() => listLandingPages())
  const [stagedKey, setStagedKey] = useState(activeKey)
  const [saving, setSaving] = useState(false)

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

  const activeName = pages.find((p) => p.key === activeKey)?.name ?? activeKey

  async function activate() {
    setSaving(true)
    try {
      await saveActiveLandingPageKeyAsync(stagedKey)
      toast.success(`Activated “${pages.find((p) => p.key === stagedKey)?.name ?? stagedKey}”`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate drop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SetupStepBody
      intro="Choose which code-owned landing page is live at /. Everything else in this wizard dresses the page you pick here."
      status={{ state: 'info', label: `Live now: ${activeName}` }}
      control={
        <div className="space-y-3">
          <AdminFieldSelect
            label="Active landing page"
            value={stagedKey}
            onChange={setStagedKey}
            options={pages.map((page) => ({
              value: page.key,
              label: page.name,
              description: page.key === activeKey ? 'Live on storefront' : page.description,
            }))}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            loading={saving}
            disabled={stagedKey === activeKey}
            onClick={() => void activate()}
          >
            Activate
          </Button>
        </div>
      }
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — assign the drop's code-defined asset slots. */
function DropMediaStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const assigned = useDropSlotAssignedCount(activeKey)
  const total = dropSlotTotal(activeKey)

  return (
    <SetupStepBody
      intro="Every drop defines its media slots in code (hero, products, textures, GLBs). Assign library media to each slot — anything left blank falls back to the built-in designed asset."
      status={{
        state: assigned > 0 ? 'done' : 'todo',
        label:
          assigned > 0
            ? `${assigned} of ${total} slots assigned`
            : `0 of ${total} slots assigned — running on built-in fallbacks`,
      }}
      links={[{ label: 'Open Assets', to: '/admin/assets', search: { page: activeKey } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — author the per-scene landing copy. */
function LandingCopyStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const hasContent = useHasLandingContent(activeKey)

  return (
    <SetupStepBody
      intro="Override the landing page's per-scene copy — every field falls back to the designed code default when blank, so you only write what you want to change."
      status={{
        state: hasContent ? 'done' : 'todo',
        label: hasContent ? 'Copy overrides saved' : 'Running on designed defaults',
      }}
      links={[{ label: 'Open Landing Content', to: '/admin/content' }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 4 — how publishing works + where to verify. */
function ReviewPublishStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Saving in any editor publishes immediately — the working copy syncs to cms_settings and the anon-readable storefront_publication mirror. Use the topbar Preview to inspect unsaved edits inside the real storefront, then verify live."
      status={{ state: 'info', label: 'Save = publish — there is no separate publish step' }}
      links={[{ label: 'Tune theme & fonts', to: '/admin/theme' }]}
      onNavigate={onNavigate}
    />
  )
}

/** Drop setup — pick the page, dress it, write it, publish. */
export function DropSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Drop setup"
      steps={[
        {
          key: 'page',
          title: 'Active page',
          blurb: 'Pick the code-owned landing page the homepage renders.',
          render: () => <ActivePageStep onNavigate={onClose} />,
        },
        {
          key: 'media',
          title: 'Drop media',
          blurb: 'Fill the drop’s code-defined asset slots from the media library.',
          render: () => <DropMediaStep onNavigate={onClose} />,
        },
        {
          key: 'copy',
          title: 'Landing copy',
          blurb: 'Per-scene copy overrides with designed defaults.',
          render: () => <LandingCopyStep onNavigate={onClose} />,
        },
        {
          key: 'publish',
          title: 'Review',
          blurb: 'Preview unsaved edits, then verify the live storefront.',
          render: () => <ReviewPublishStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
