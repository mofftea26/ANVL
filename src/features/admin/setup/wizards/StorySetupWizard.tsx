import { SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'

interface StepProps {
  onNavigate: () => void
}

const STORY_LINK = [{ label: 'Open Story editor', to: '/admin/story' }]

/** Step 1 — create a chapter (one book per product). */
function ChapterStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="A chapter is one book on the Story shelf — one per product, grouped by drop. Give it a title, its product slug (the Shopify handle), book colors, and cover art."
      status={{ state: 'info', label: 'Chapters live in Supabase — open the editor for live state' }}
      links={STORY_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 2 — add the acts (the book's pages). */
function ActsStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Acts are the ordered story beats inside a chapter — the pages readers turn in the book overlay. Author each act's copy and imagery, and drag to reorder."
      status={{ state: 'info', label: 'Acts are edited inside their chapter' }}
      links={STORY_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 3 — add the cast (the army roster). */
function CastStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="The cast is the saga's character roster — CMS-authored warriors that appear alongside the chapter. Optional, but it gives the drop its army."
      status={{ state: 'info', label: 'Cast members attach to a chapter' }}
      links={STORY_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Step 4 — publish toggle note. */
function PublishStep({ onNavigate }: StepProps) {
  return (
    <SetupStepBody
      intro="Each chapter has a Published toggle — only published chapters (and their acts and cast) are visible on the storefront Story page. Flip it when the book is ready to shelve."
      status={{ state: 'info', label: 'Unpublished chapters stay drafts, invisible to visitors' }}
      links={STORY_LINK}
      onNavigate={onNavigate}
    />
  )
}

/** Story — chapter, acts, cast, publish. */
export function StorySetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Story setup"
      steps={[
        {
          key: 'chapter',
          title: 'Chapter',
          blurb: 'One book per product on the Story shelf.',
          render: () => <ChapterStep onNavigate={onClose} />,
        },
        {
          key: 'acts',
          title: 'Acts',
          blurb: 'The ordered pages inside the book.',
          render: () => <ActsStep onNavigate={onClose} />,
        },
        {
          key: 'cast',
          title: 'Cast',
          blurb: 'The saga’s character roster.',
          render: () => <CastStep onNavigate={onClose} />,
        },
        {
          key: 'publish',
          title: 'Publish',
          blurb: 'Only published chapters reach the storefront.',
          render: () => <PublishStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
