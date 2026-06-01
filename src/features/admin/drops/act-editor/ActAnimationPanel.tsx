import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminMicroHeading } from '@/features/admin/components/AdminMicroHeading'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { ACT_MOTION_TYPE_OPTIONS } from '@/features/marketing/act-presets/shared/actAnimationConfig'
import type { ActAnimationIntensity } from '@/features/cms/landing/landingActs.types'

const INTENSITY_OPTIONS = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'bold', label: 'Bold' },
] as const

type ActAnimationPanelProps = {
  act: LandingAct
  onPatch: (patch: Partial<LandingAct>) => void
  onPlay?: () => void
}

export function ActAnimationPanel({ act, onPatch, onPlay }: ActAnimationPanelProps) {
  const anim = act.animation ?? {
    enabled: true,
    desktopOnly: false,
    type: 'wordReveal',
    intensity: 'standard' as ActAnimationIntensity,
  }

  return (
    <AdminPanel variant="inset">
      <div className="mb-3 flex items-center justify-between gap-2">
        <AdminMicroHeading>Animation</AdminMicroHeading>
        {onPlay ? (
          <AdminButton type="button" variant="secondary" size="sm" onClick={onPlay}>
            Play
          </AdminButton>
        ) : null}
      </div>
      <div className="space-y-3">
        <AdminCheckbox
          label="Motion enabled"
          checked={anim.enabled}
          onChange={(e) =>
            onPatch({ animation: { ...anim, enabled: e.target.checked } })
          }
        />
        <AdminCheckbox
          label="Desktop / tablet only"
          checked={anim.desktopOnly}
          onChange={(e) =>
            onPatch({ animation: { ...anim, desktopOnly: e.target.checked } })
          }
        />
        <AdminFieldSelect
          label="Motion type"
          value={anim.type}
          options={ACT_MOTION_TYPE_OPTIONS}
          onChange={(type) => onPatch({ animation: { ...anim, type } })}
        />
        <AdminFieldSelect
          label="Intensity"
          value={anim.intensity}
          options={INTENSITY_OPTIONS}
          onChange={(intensity) =>
            onPatch({
              animation: {
                ...anim,
                intensity: intensity as ActAnimationIntensity,
              },
            })
          }
        />
      </div>
    </AdminPanel>
  )
}
