import { useState } from 'react'

import {
  Anvil,
  BookOpen,
  Flame,
  Package,
  QrCode,
  Trophy,
} from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'
import type { AdminNavIcon } from '@/features/admin/components/adminNav'

import { AboutSetupWizard } from './wizards/AboutSetupWizard'
import { DropSetupWizard } from './wizards/DropSetupWizard'
import { GamificationSetupWizard } from './wizards/GamificationSetupWizard'
import { PassportsSetupWizard } from './wizards/PassportsSetupWizard'
import { ProductsSetupWizard } from './wizards/ProductsSetupWizard'
import { StorySetupWizard } from './wizards/StorySetupWizard'

type WizardKey = 'drop' | 'products' | 'story' | 'about' | 'passports' | 'gamification'

interface WizardEntry {
  key: WizardKey
  label: string
  blurb: string
  icon: AdminNavIcon
}

const WIZARDS: WizardEntry[] = [
  { key: 'drop', label: 'Drop setup', blurb: 'Page · media · copy', icon: Flame },
  { key: 'products', label: 'Products', blurb: 'PDP · passports · QR', icon: Package },
  { key: 'story', label: 'Story', blurb: 'Chapters · acts · cast', icon: BookOpen },
  { key: 'about', label: 'About page', blurb: 'Hero · orbs · altar', icon: Anvil },
  { key: 'passports', label: 'Passports', blurb: 'Content · QR · print', icon: QrCode },
  { key: 'gamification', label: 'Gamification', blurb: 'Ranks · XP · badges', icon: Trophy },
]

/**
 * The dashboard's guided-setup row: one button per flow, each opening a
 * multi-step {@link SetupWizard} modal that shows live completion state and
 * deep-links into the real editors. Supersedes the old drop-setup checklist.
 */
export function SetupWizardHub() {
  const [openKey, setOpenKey] = useState<WizardKey | null>(null)
  const close = () => setOpenKey(null)

  return (
    <section aria-label="Setup wizards" className="shrink-0">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="anvl-display text-[11px] tracking-[0.3em] text-[var(--color-text-muted)]">
          Setup wizards
        </h2>
        <span
          aria-hidden
          className="h-px flex-1 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_55%,transparent),transparent)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {WIZARDS.map(({ key, label, blurb, icon: IconComponent }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpenKey(key)}
            className={cn(
              'focus-ring group flex items-center gap-2.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-left',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.4)]',
              'transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] hover:bg-[var(--color-surface-elevated)]',
            )}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] bg-[var(--color-bg)] text-[var(--color-highlight)]"
            >
              <IconComponent size={ICON_SIZE.md} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[var(--color-text)]">
                {label}
              </span>
              <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
                {blurb}
              </span>
            </span>
          </button>
        ))}
      </div>

      <DropSetupWizard open={openKey === 'drop'} onClose={close} />
      <ProductsSetupWizard open={openKey === 'products'} onClose={close} />
      <StorySetupWizard open={openKey === 'story'} onClose={close} />
      <AboutSetupWizard open={openKey === 'about'} onClose={close} />
      <PassportsSetupWizard open={openKey === 'passports'} onClose={close} />
      <GamificationSetupWizard open={openKey === 'gamification'} onClose={close} />
    </section>
  )
}
