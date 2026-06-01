import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { AdminButton } from './AdminButton'
import { AdminFormField } from './AdminFormField'
import { AdminInput } from './AdminInput'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'

type AdminMediaFieldProps = {
  label: string
  value: string
  alt?: string
  onChange: (url: string) => void
  onAltChange?: (alt: string) => void
  hint?: string
}

export function AdminMediaField({
  label,
  value,
  alt,
  onChange,
  onAltChange,
  hint,
}: AdminMediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <AdminFormField label={label} hint={hint}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <AdminInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/brand/… or media URL"
            className="min-w-0 flex-1"
          />
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            <ImageIcon className="size-3.5" />
            Library
          </AdminButton>
        </div>
        {value ? (
          <img
            src={value}
            alt={alt ?? ''}
            className="h-16 w-auto max-w-full rounded border border-[var(--admin-line)] object-contain"
          />
        ) : null}
        {onAltChange ? (
          <AdminInput
            value={alt ?? ''}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="Alt text"
          />
        ) : null}
      </div>
      <MediaLibraryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange(url)
          setPickerOpen(false)
        }}
      />
    </AdminFormField>
  )
}
