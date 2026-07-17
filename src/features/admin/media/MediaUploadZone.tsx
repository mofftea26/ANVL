import {
  type ChangeEvent,
  type DragEvent,
  useId,
  useRef,
  useState,
} from 'react'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Loader2, Upload } from '@/shared/icons'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { MediaUploadNamingModal } from './MediaUploadNamingModal'
import { useMediaAssetsMutations } from './useMediaAssetsQuery'

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm,model/gltf-binary,model/gltf+json,.glb,.gltf'

/** Mirrors the `cms-media` Supabase Storage bucket's `file_size_limit` (50 MB). */
const MAX_UPLOAD_BYTES = 50_000_000

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'mp4', 'webm', 'glb', 'gltf']

/**
 * Fail fast client-side before spending a round trip on a file Supabase
 * Storage will reject anyway (wrong extension or over the bucket's size
 * limit) — the bucket's `allowed_mime_types` remains the authoritative check.
 */
export function validateUploadFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" isn't a supported file type (image, video, or GLB/GLTF).`
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1_000_000).toFixed(1)
    return `"${file.name}" is ${mb} MB — the limit is 50 MB.`
  }
  return null
}

type MediaUploadZoneProps = {
  disabled?: boolean
}

export function MediaUploadZone({ disabled }: MediaUploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const fileId = useId()
  const [isOver, setIsOver] = useState(false)
  // Files staged for the enforced-naming modal — nothing uploads unnamed.
  const [pending, setPending] = useState<File[] | null>(null)
  const { uploadMutation } = useMediaAssetsMutations()

  const stageFiles = (files: FileList | File[]) => {
    const valid: File[] = []
    for (const file of Array.from(files)) {
      const validationError = validateUploadFile(file)
      if (validationError) {
        toast.error(validationError)
        continue
      }
      valid.push(file)
    }
    if (valid.length) setPending(valid)
  }

  const uploadRenamed = async (files: File[]) => {
    for (const file of files) {
      const result = await uploadMutation.mutateAsync(file)
      if (result.ok) {
        toast.success(`Uploaded ${file.name}`)
      } else {
        toast.error(result.error)
      }
    }
    setPending(null)
  }

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) stageFiles(files)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(false)
    if (disabled || uploadMutation.isPending) return
    if (e.dataTransfer.files.length) stageFiles(e.dataTransfer.files)
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? (
            <Loader2 size={ICON_SIZE.sm} className="animate-spin" aria-hidden="true" />
          ) : (
            <Upload size={ICON_SIZE.sm} aria-hidden="true" />
          )}
          {busy ? 'Uploading…' : 'Upload files'}
        </Button>
        <span className="text-xs text-[var(--color-text-muted)]">
          Drag images, videos, or 3D models (GLB/GLTF) here — max 50 MB per file.
          Each upload is named by function: <code className="font-mono">[page]-[slot].ext</code>.
        </span>
      </div>

      {pending ? (
        <MediaUploadNamingModal
          files={pending}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={(renamed) => void uploadRenamed(renamed)}
        />
      ) : null}
    </div>
  )
}
