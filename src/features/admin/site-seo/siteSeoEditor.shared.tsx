import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { SEO_STRUCTURED_DATA_TYPES } from '@/features/cms/types/cms.types'
import type { SeoFieldPatch } from '@/features/cms/types/cms.types'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'

const STRUCTURED_DATA_NONE = '__none__'

export function CharCountLabel({
  label,
  count,
  max,
}: {
  label: string
  count: number
  max: number
}) {
  return (
    <span className="flex w-full items-baseline justify-between gap-2">
      <span>{label}</span>
      <span
        className="text-[10px] font-normal tabular-nums text-[var(--color-text-muted)]"
        aria-live="polite"
      >
        {count}/{max}
      </span>
    </span>
  )
}

export type SeoFieldsValue = SeoFieldPatch & {
  defaultShareImage?: string
}

export function SeoFieldsGroup({
  value,
  onChange,
  includeDefaultShareImage = false,
  includeStructuredData = false,
}: {
  value: SeoFieldsValue
  onChange: (patch: Partial<SeoFieldsValue>) => void
  includeDefaultShareImage?: boolean
  includeStructuredData?: boolean
}) {
  const metaTitle = value.metaTitle ?? ''
  const metaDescription = value.metaDescription ?? ''

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdminFormField
        className="md:col-span-2"
        label={
          <CharCountLabel label="Meta title" count={metaTitle.length} max={60} />
        }
      >
        <AdminInput
          value={metaTitle}
          onChange={(e) => onChange({ metaTitle: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField
        className="md:col-span-2"
        label={
          <CharCountLabel
            label="Meta description"
            count={metaDescription.length}
            max={160}
          />
        }
      >
        <AdminTextarea
          rows={3}
          value={metaDescription}
          onChange={(e) => onChange({ metaDescription: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label="Canonical URL">
        <AdminInput
          value={value.canonicalUrl ?? ''}
          onChange={(e) => onChange({ canonicalUrl: e.target.value })}
        />
      </AdminFormField>
      <AdminCheckbox
        label="No index"
        checked={Boolean(value.noIndex)}
        onChange={(e) => onChange({ noIndex: e.target.checked })}
      />
      <AdminFormField label="Open Graph title">
        <AdminInput
          value={value.ogTitle ?? ''}
          onChange={(e) => onChange({ ogTitle: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label="Open Graph description">
        <AdminTextarea
          rows={2}
          value={value.ogDescription ?? ''}
          onChange={(e) => onChange({ ogDescription: e.target.value })}
        />
      </AdminFormField>
      <div className="md:col-span-2">
        <MediaPickerField
          label="Open Graph image"
          kind="image"
          value={value.ogImage ?? ''}
          onChange={(next) => onChange({ ogImage: next })}
          fallback="crest"
        />
      </div>
      <AdminFormField label="Twitter title">
        <AdminInput
          value={value.twitterTitle ?? ''}
          onChange={(e) => onChange({ twitterTitle: e.target.value })}
        />
      </AdminFormField>
      <AdminFormField label="Twitter description">
        <AdminTextarea
          rows={2}
          value={value.twitterDescription ?? ''}
          onChange={(e) => onChange({ twitterDescription: e.target.value })}
        />
      </AdminFormField>
      <div className="md:col-span-2">
        <MediaPickerField
          label="Twitter image"
          kind="image"
          value={value.twitterImage ?? ''}
          onChange={(next) => onChange({ twitterImage: next })}
          fallback="crest"
        />
      </div>
      {includeDefaultShareImage ? (
        <div className="md:col-span-2">
          <MediaPickerField
            label="Default share image"
            kind="image"
            value={value.defaultShareImage ?? ''}
            onChange={(next) => onChange({ defaultShareImage: next })}
            fallback="crest"
          />
        </div>
      ) : null}
      {includeStructuredData ? (
        <AdminFormField label="Structured data type">
          <AdminSelect
            value={value.structuredDataType ?? STRUCTURED_DATA_NONE}
            onValueChange={(next) =>
              onChange({
                structuredDataType:
                  next === STRUCTURED_DATA_NONE
                    ? undefined
                    : (next as SeoFieldsValue['structuredDataType']),
              })
            }
          >
            <AdminSelectTrigger aria-label="Structured data type">
              <AdminSelectValue placeholder="None" />
            </AdminSelectTrigger>
            <AdminSelectContent>
              <AdminSelectItem value={STRUCTURED_DATA_NONE}>None</AdminSelectItem>
              {SEO_STRUCTURED_DATA_TYPES.map((t) => (
                <AdminSelectItem key={t} value={t}>
                  {t}
                </AdminSelectItem>
              ))}
            </AdminSelectContent>
          </AdminSelect>
        </AdminFormField>
      ) : null}
    </div>
  )
}
