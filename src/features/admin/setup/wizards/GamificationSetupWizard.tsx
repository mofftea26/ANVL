import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'

interface StepProps {
  onNavigate: () => void
}

const GAMIFICATION_LINK = [{ label: 'Open Gamification', to: '/admin/gamification' }]

/** Step 1 — the four fixed ranks. */
function RanksStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="The Armory has four fixed ranks, each with three levels. Edit their copy and emblem overrides, and tune the per-level thresholds (AND-combined metrics a collector must meet)."
      status={{ state: 'info', label: 'Rules live in Supabase — seeded to match code defaults' }}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — challenges. */
function ChallengesStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Challenges are declarative goals — a metric (registrations, wears, feats, full drops, honor pins) plus a target. Create, drag-reorder, toggle active, delete."
      status={{ state: 'info', label: 'Edited on the Challenges tab' }}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — Forge XP. */
function ForgeXpStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Forge XP has four earn constants plus a level-curve factor — the editor previews the resulting curve as you tune it. Small changes here reshape every collector's progression."
      status={{ state: 'info', label: 'Edited on the Forge XP tab' }}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 4 — badges. */
function BadgesStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Badges are milestone markers — the same metric + target shape as challenges, but permanent once earned. Define the milestones worth celebrating."
      status={{ state: 'info', label: 'Edited on the Badges tab' }}
      links={GAMIFICATION_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Gamification — ranks, challenges, Forge XP, badges. */
export function GamificationSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Gamification setup"
      steps={[
        {
          key: 'ranks',
          title: 'Ranks',
          blurb: 'Four fixed ranks, three levels each.',
          render: () => <RanksStep onNavigate={onClose} />,
        },
        {
          key: 'challenges',
          title: 'Challenges',
          blurb: 'Metric + target goals, drag-ordered.',
          render: () => <ChallengesStep onNavigate={onClose} />,
        },
        {
          key: 'xp',
          title: 'Forge XP',
          blurb: 'Earn constants and the level curve.',
          render: () => <ForgeXpStep onNavigate={onClose} />,
        },
        {
          key: 'badges',
          title: 'Badges',
          blurb: 'Permanent milestone markers.',
          render: () => <BadgesStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
