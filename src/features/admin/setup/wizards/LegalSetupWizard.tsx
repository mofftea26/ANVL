import { SectionListField } from '@/features/admin/components/SectionListField'
import {
  readLegalContentFromStorage,
  saveLegalContentAsync,
} from '@/features/cms/legal/legalContent.settings'
import { LEGAL_CONTENT_DEFAULTS } from '@/features/cms/legal/legalContent.defaults'
import {
  LEGAL_PAGE_KEYS,
  type LegalContentConfig,
  type LegalPageKey,
} from '@/features/cms/legal/legalContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { SetupSaveRow, SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import { useSetupBlobStep } from '../useSetupBlobStep'

const TAB_LABELS: Record<LegalPageKey, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  cookies: 'Cookie Policy',
  accessibility: 'Accessibility Statement',
}

const LEGAL_EDITOR_LINK = [
  { label: 'Fine-tune every field in the Legal editor', to: '/admin/legal' },
]

/** One legal page, edited inline: title, intro, and a simplified sections list. */
function LegalPageStep({ pageKey, onNavigate }: { pageKey: LegalPageKey; onNavigate: () => void }) {
  const editor = useSetupBlobStep<LegalContentConfig>({
    read: readLegalContentFromStorage,
    save: saveLegalContentAsync,
    successMessage: `${TAB_LABELS[pageKey]} saved.`,
    errorFallbackMessage: `Could not save the ${TAB_LABELS[pageKey]}.`,
  })
  const page = editor.value.pages[pageKey]
  const defaults = LEGAL_CONTENT_DEFAULTS[pageKey]

  const patchPage = (patch: Partial<typeof page>) =>
    editor.patch((prev) => ({
      ...prev,
      pages: { ...prev.pages, [pageKey]: { ...prev.pages[pageKey], ...patch } },
    }))

  const customized =
    page.title.trim().length > 0 ||
    page.intro.trim().length > 0 ||
    page.sections.length > 0

  return (
    <SetupStepBody
      intro={`Author the ${TAB_LABELS[pageKey]}. Every blank field falls back to the designed default copy, shown here as the placeholder.`}
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? 'Custom copy saved' : 'Running on designed defaults',
      }}
      links={LEGAL_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Title" labelStyle="stacked">
        <Input
          density="compact"
          placeholder={defaults.title}
          value={page.title}
          onChange={(e) => patchPage({ title: e.target.value })}
        />
      </FormField>
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={3}
          placeholder={defaults.intro}
          value={page.intro}
          onChange={(e) => patchPage({ intro: e.target.value })}
        />
      </FormField>
      <FormField label="Sections" hint="Leave empty to keep the designed defaults." labelStyle="stacked">
        <SectionListField
          sections={page.sections}
          onChange={(sections) => patchPage({ sections })}
          idPrefix={`legal-${pageKey}`}
        />
      </FormField>
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label={`Save ${TAB_LABELS[pageKey]}`}
      />
    </SetupStepBody>
  )
}

/** Legal — privacy, terms, cookies, accessibility. All inline. */
export function LegalSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Legal setup"
      steps={LEGAL_PAGE_KEYS.map((key) => ({
        key,
        title: TAB_LABELS[key],
        blurb: 'Title · intro · sections.',
        render: () => <LegalPageStep pageKey={key} onNavigate={onClose} />,
      }))}
    />
  )
}
