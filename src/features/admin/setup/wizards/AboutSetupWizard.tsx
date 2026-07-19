import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import {
  aboutSlotTotal,
  useAboutOrbCount,
  useAboutSectionSaved,
  useAboutSlotAssignedCount,
} from '../useSetupStatus'

interface StepProps {
  onNavigate: () => void
}

const ABOUT_EDITOR_LINK = [{ label: 'Open About editor', to: '/admin/about' }]

/** Step 1 — the mobile-page hero copy. */
function HeroStep({ onNavigate }: StepProps) {
  const saved = useAboutSectionSaved('hero')
  return (
    <SetupStepBody
      intro="The hero heads the mobile About page (the desktop Forge Altar carries no headline). Eyebrow, headline, subhead, CTAs, scroll cue — every blank field falls back to the designed default."
      status={{
        state: saved ? 'done' : 'todo',
        label: saved ? 'Custom hero copy saved' : 'Running on designed defaults',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — the orbs (the page's content model). */
function OrbsStep({ onNavigate }: StepProps) {
  const orbCount = useAboutOrbCount()
  return (
    <SetupStepBody
      intro="Orbs are the About page's sections: each orbits the desktop Forge Altar (hammer-struck open into a modal) and stacks as a section on mobile. Add, edit, remove, and reorder freely — label, color, copy, points, stats, CTAs, image."
      status={{
        state: orbCount > 0 ? 'done' : 'todo',
        label:
          orbCount > 0
            ? `${orbCount} custom orb${orbCount === 1 ? '' : 's'} saved`
            : 'Running on the seven designed orbs',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — page assets (anvil/hammer GLBs + imagery). */
function AssetsStep({ onNavigate }: StepProps) {
  const assigned = useAboutSlotAssignedCount()
  const total = aboutSlotTotal()
  return (
    <SetupStepBody
      intro="The altar's anvil and hammer GLBs plus the page imagery are assigned on the Assets page under Page — About. Orb section images are picked per orb in the About editor instead."
      status={{
        state: assigned > 0 ? 'done' : 'todo',
        label:
          assigned > 0
            ? `${assigned} of ${total} About slots assigned`
            : `0 of ${total} About slots assigned — running on built-in fallbacks`,
      }}
      links={[{ label: 'Open About assets', to: '/admin/assets', search: { page: 'about' } }]}
      onNavigate={onNavigate}
    />
  )
}

/** Step 4 — the marquee band. */
function MarqueeStep({ onNavigate }: StepProps) {
  const saved = useAboutSectionSaved('marquee')
  return (
    <SetupStepBody
      intro="The marquee is the counter-scrolling type band on the mobile About page — one line of oversized text. Leave it blank to keep the designed default."
      status={{
        state: saved ? 'done' : 'todo',
        label: saved ? 'Custom marquee saved' : 'Running on designed default',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** About page — hero, orbs, assets, marquee. */
export function AboutSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="About page setup"
      steps={[
        {
          key: 'hero',
          title: 'Hero',
          blurb: 'Mobile-page headline block.',
          render: () => <HeroStep onNavigate={onClose} />,
        },
        {
          key: 'orbs',
          title: 'Orbs',
          blurb: 'The page’s sections — altar orbs on desktop.',
          render: () => <OrbsStep onNavigate={onClose} />,
        },
        {
          key: 'assets',
          title: 'Assets',
          blurb: 'Anvil/hammer GLBs and page imagery.',
          render: () => <AssetsStep onNavigate={onClose} />,
        },
        {
          key: 'marquee',
          title: 'Marquee',
          blurb: 'The counter-scrolling type band.',
          render: () => <MarqueeStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
