import { SectionListField } from '@/features/admin/components/SectionListField'
import { FaqListField } from '@/features/admin/support/FaqListField'
import { PerProductCareField } from '@/features/admin/support/PerProductCareField'
import { PerProductSizeField } from '@/features/admin/support/PerProductSizeField'
import {
  readSupportContentFromStorage,
  saveSupportContentAsync,
} from '@/features/cms/support/supportContent.settings'
import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import type { SupportContentConfig } from '@/features/cms/support/supportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { SetupSaveRow, SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import { useSetupBlobStep } from '../useSetupBlobStep'

const SUPPORT_EDITOR_LINK = [
  { label: 'Fine-tune every field in the Support editor', to: '/admin/support' },
]

function useSupportStep(messages: { success: string; error: string }) {
  return useSetupBlobStep<SupportContentConfig>({
    read: readSupportContentFromStorage,
    save: saveSupportContentAsync,
    successMessage: messages.success,
    errorFallbackMessage: messages.error,
  })
}

const D = SUPPORT_CONTENT_DEFAULTS

interface StepProps {
  onNavigate: () => void
}

function FaqStep({ onNavigate }: StepProps) {
  const editor = useSupportStep({ success: 'FAQ saved.', error: 'Could not save the FAQ.' })
  const customized =
    editor.value.faq.intro.trim().length > 0 || editor.value.faq.items.length > 0
  return (
    <SetupStepBody
      intro="Author the FAQ list — the questions customers ask most. Leave it empty to keep the designed defaults."
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? 'Custom FAQ saved' : 'Running on designed defaults',
      }}
      links={SUPPORT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={D.faq.intro}
          value={editor.value.faq.intro}
          onChange={(e) =>
            editor.patch((prev) => ({ ...prev, faq: { ...prev.faq, intro: e.target.value } }))
          }
        />
      </FormField>
      <FaqListField
        items={editor.value.faq.items}
        onChange={(items) => editor.patch((prev) => ({ ...prev, faq: { ...prev.faq, items } }))}
      />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save FAQ"
      />
    </SetupStepBody>
  )
}

function ContactStep({ onNavigate }: StepProps) {
  const editor = useSupportStep({ success: 'Contact saved.', error: 'Could not save contact.' })
  const c = editor.value.contact
  const customized = Object.values(c).some((v) => v.trim().length > 0)
  const setContact = (patch: Partial<typeof c>) =>
    editor.patch((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }))
  return (
    <SetupStepBody
      intro="The contact channels customers use to reach you. Blank fields fall back to the designed defaults."
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? 'Custom contact saved' : 'Running on designed defaults',
      }}
      links={SUPPORT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Email" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={D.contact.email}
            value={c.email}
            onChange={(e) => setContact({ email: e.target.value })}
          />
        </FormField>
        <FormField label="Instagram" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={D.contact.instagram}
            value={c.instagram}
            onChange={(e) => setContact({ instagram: e.target.value })}
          />
        </FormField>
        <FormField label="Phone" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={D.contact.phone || 'e.g. +961 …'}
            value={c.phone}
            onChange={(e) => setContact({ phone: e.target.value })}
          />
        </FormField>
        <FormField label="Address" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={D.contact.address}
            value={c.address}
            onChange={(e) => setContact({ address: e.target.value })}
          />
        </FormField>
      </div>
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save contact"
      />
    </SetupStepBody>
  )
}

/** Shared inline step for the shipping/returns section-list pages. */
function SectionListStep({
  field,
  label,
  onNavigate,
}: {
  field: 'shipping' | 'returns'
  label: string
  onNavigate: () => void
}) {
  const editor = useSupportStep({
    success: `${label} saved.`,
    error: `Could not save ${label.toLowerCase()}.`,
  })
  const slice = editor.value[field]
  const customized = slice.intro.trim().length > 0 || slice.sections.length > 0
  return (
    <SetupStepBody
      intro={`Author the ${label} page — an intro plus a list of sections. Leave it empty to keep the designed defaults.`}
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? `Custom ${label.toLowerCase()} saved` : 'Running on designed defaults',
      }}
      links={SUPPORT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={D[field].intro}
          value={slice.intro}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              [field]: { ...prev[field], intro: e.target.value },
            }))
          }
        />
      </FormField>
      <SectionListField
        sections={slice.sections}
        onChange={(sections) =>
          editor.patch((prev) => ({ ...prev, [field]: { ...prev[field], sections } }))
        }
        idPrefix={field}
      />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label={`Save ${label.toLowerCase()}`}
      />
    </SetupStepBody>
  )
}

function CareStep({ onNavigate }: StepProps) {
  const editor = useSupportStep({ success: 'Care guide saved.', error: 'Could not save care guide.' })
  const customized =
    editor.value.careGuide.intro.trim().length > 0 ||
    editor.value.careGuide.sections.length > 0 ||
    Object.keys(editor.value.careGuide.perProduct).length > 0
  return (
    <SetupStepBody
      intro="Author the care guide intro and, if you like, a per-product care note for one piece. Blank fields fall back to the designed defaults."
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? 'Custom care guide saved' : 'Running on designed defaults',
      }}
      links={SUPPORT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={D.careGuide.intro}
          value={editor.value.careGuide.intro}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              careGuide: { ...prev.careGuide, intro: e.target.value },
            }))
          }
        />
      </FormField>
      <PerProductCareField
        perProduct={editor.value.careGuide.perProduct}
        onChange={(perProduct) =>
          editor.patch((prev) => ({ ...prev, careGuide: { ...prev.careGuide, perProduct } }))
        }
      />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save care guide"
      />
    </SetupStepBody>
  )
}

function SizeStep({ onNavigate }: StepProps) {
  const editor = useSupportStep({ success: 'Size guide saved.', error: 'Could not save size guide.' })
  const customized =
    editor.value.sizeGuide.intro.trim().length > 0 ||
    editor.value.sizeGuide.note.trim().length > 0 ||
    Object.keys(editor.value.sizeGuide.perProduct).length > 0
  return (
    <SetupStepBody
      intro="Author the size guide's global guidance and, if you like, a per-product size table for one piece. Blank fields fall back to the designed defaults."
      status={{
        state: customized ? 'done' : 'todo',
        label: customized ? 'Custom size guide saved' : 'Running on designed defaults',
      }}
      links={SUPPORT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Intro" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={2}
          placeholder={D.sizeGuide.intro}
          value={editor.value.sizeGuide.intro}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              sizeGuide: { ...prev.sizeGuide, intro: e.target.value },
            }))
          }
        />
      </FormField>
      <FormField label="Note" hint="Global how-to-measure guidance." labelStyle="stacked">
        <Textarea
          density="compact"
          rows={3}
          placeholder={D.sizeGuide.note}
          value={editor.value.sizeGuide.note}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              sizeGuide: { ...prev.sizeGuide, note: e.target.value },
            }))
          }
        />
      </FormField>
      <PerProductSizeField
        perProduct={editor.value.sizeGuide.perProduct}
        onChange={(perProduct) =>
          editor.patch((prev) => ({ ...prev, sizeGuide: { ...prev.sizeGuide, perProduct } }))
        }
      />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save size guide"
      />
    </SetupStepBody>
  )
}

/** Support — FAQ, contact, shipping, returns, care, size. All inline. */
export function SupportSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Support setup"
      steps={[
        { key: 'faq', title: 'FAQ', blurb: 'Common questions.', render: () => <FaqStep onNavigate={onClose} /> },
        { key: 'contact', title: 'Contact', blurb: 'How to reach you.', render: () => <ContactStep onNavigate={onClose} /> },
        {
          key: 'shipping',
          title: 'Shipping',
          blurb: 'Delivery info.',
          render: () => <SectionListStep field="shipping" label="Shipping" onNavigate={onClose} />,
        },
        {
          key: 'returns',
          title: 'Returns',
          blurb: 'Returns policy.',
          render: () => <SectionListStep field="returns" label="Returns" onNavigate={onClose} />,
        },
        { key: 'care', title: 'Care guide', blurb: 'Care + per-product.', render: () => <CareStep onNavigate={onClose} /> },
        { key: 'size', title: 'Size guide', blurb: 'Sizing + per-product.', render: () => <SizeStep onNavigate={onClose} /> },
      ]}
    />
  )
}
