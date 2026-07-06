import type { MediaPickerKind } from '@/features/admin/media/mediaPickerKind.types'
import {
  MediaLibraryPickerModal,
  type MediaLibraryPick,
} from './MediaLibraryPickerModal'

export type { MediaLibraryPick }

type MediaLibraryIdPickerModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (asset: MediaLibraryPick) => void
  kind?: MediaPickerKind
  title?: string
}

/** @deprecated Prefer `MediaLibraryPickerModal` — kept for existing imports. */
export function MediaLibraryIdPickerModal({
  open,
  onClose,
  onSelect,
  kind = 'image',
  title,
}: MediaLibraryIdPickerModalProps) {
  return (
    <MediaLibraryPickerModal
      open={open}
      onClose={onClose}
      kind={kind}
      title={title}
      allowClear
      onSelect={(pick) => {
        if (pick) onSelect(pick)
      }}
    />
  )
}
