import { AdminFieldLabel } from '@/features/admin/components/AdminFieldLabel'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import type { CinematicConfig } from '@/features/marketing/cinematic-hero/cinematicHero.types'

type CinematicHeroGlobalSettingsProps = {
  config: CinematicConfig
  onChange: (patch: Partial<CinematicConfig>) => void
}

export function CinematicHeroGlobalSettings({
  config,
  onChange,
}: CinematicHeroGlobalSettingsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <AdminFieldLabel labelStyle="stacked" className="block">
        Scroll length
        <AdminSelect
          value={config.scrollLength}
          onValueChange={(v) =>
            onChange({ scrollLength: v as CinematicConfig['scrollLength'] })
          }
        >
          <AdminSelectTrigger className="mt-1">
            <AdminSelectValue />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value="compact">Compact</AdminSelectItem>
            <AdminSelectItem value="standard">Standard</AdminSelectItem>
            <AdminSelectItem value="extended">Extended</AdminSelectItem>
          </AdminSelectContent>
        </AdminSelect>
      </AdminFieldLabel>
      <AdminFieldLabel labelStyle="stacked" className="block">
        Navigation mode
        <AdminSelect
          value={config.navMode}
          onValueChange={(v) => onChange({ navMode: v as CinematicConfig['navMode'] })}
        >
          <AdminSelectTrigger className="mt-1">
            <AdminSelectValue />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value="auto">Auto</AdminSelectItem>
            <AdminSelectItem value="transparentTopbar">Transparent topbar</AdminSelectItem>
            <AdminSelectItem value="sideRail">Side rail</AdminSelectItem>
            <AdminSelectItem value="cornerDock">Corner dock</AdminSelectItem>
            <AdminSelectItem value="commandOverlay">Command overlay</AdminSelectItem>
          </AdminSelectContent>
        </AdminSelect>
      </AdminFieldLabel>
      <AdminFieldLabel labelStyle="stacked" className="block md:col-span-2">
        Background mode
        <AdminSelect
          value={config.backgroundMode}
          onValueChange={(v) =>
            onChange({ backgroundMode: v as CinematicConfig['backgroundMode'] })
          }
        >
          <AdminSelectTrigger className="mt-1">
            <AdminSelectValue />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value="video">Video</AdminSelectItem>
            <AdminSelectItem value="image">Image</AdminSelectItem>
            <AdminSelectItem value="gradient">Gradient</AdminSelectItem>
            <AdminSelectItem value="forgeScene">Forge scene</AdminSelectItem>
          </AdminSelectContent>
        </AdminSelect>
      </AdminFieldLabel>
    </div>
  )
}
