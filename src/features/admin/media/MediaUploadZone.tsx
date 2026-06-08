import {
  type ChangeEvent,
  type DragEvent,
  useId,
  useRef,
  useState,
} from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { cn } from '@/shared/lib/cn'
import { useMediaAssetsMutations } from './useMediaAssetsQuery'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm'

type MediaUploadZoneProps = {
  disabled?: boolean
}

export function MediaUploadZone({ disabled }: MediaUploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const fileId = useId()
  const [isOver, setIsOver] = useState(false)
  const { uploadMutation } = useMediaAssetsMutations()

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (!list.length) return
    for (const file of list) {
      const result = await uploadMutation.mutateAsync(file)
      if (result.ok) {
        toast.success(`Uploaded ${file.name}`)
      } else {
        toast.error(result.error)
      }
    }
  }

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) void uploadFiles(files)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(false)
    if (disabled || uploadMutation.isPending) return
    if (e.dataTransfer.files.length) void uploadFiles(e.dataTransfer.files)
  }

  const busy = uploadMutation.isPending

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed p-4 transition-colors',
        isOver
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
          : 'border-[var(--color-line)]',
        (disabled || busy) && 'opacity-60',
      )}
      onDragOver={(e) => {
        if (disabled || busy) return
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={onDrop}
    >
      <input
        ref={fileRef}
        id={fileId}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || busy}
        onChange={onFileInput}
      />
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
          icon={
            busy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload size={14} aria-hidden="true" />
            )
          }
        >
          {busy ? 'Uploading…' : 'Upload files'}
        </AdminButton>
        <span className="text-xs text-[var(--color-text-muted)]">
          Drag images or videos here — max 50 MB per file.
        </span>
      </div>
    </div>
  )
}
