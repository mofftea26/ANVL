import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnvlCrest, AnvlWordmark } from '@/shared/assets/brand'
import { Button } from '@/shared/components/ui/Button'
import {
  adminCheckboxControlClass,
  adminFieldControlClass,
} from '@/shared/lib/cmsFieldStyles'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import {
  uploadCmsMediaFile,
  deleteCmsMediaByPublicUrl,
  type CmsDropVisualAssetRole,
} from '@/features/admin/cmsRemote/uploadCmsMedia'
import { MediaLibraryPickerModal } from '@/features/admin/media/MediaLibraryPickerModal'

/** Stay under typical localStorage quotas when embedding picks as data URLs. */
const DEFAULT_MAX_BYTES = 2_500_000
const DEFAULT_VIDEO_MAX_BYTES = 8_000_000

export type MediaPickerKind = 'image' | 'video' | 'any'

type MediaPickerFieldProps = {
  label: string
  hint?: string
  value: string
  onChange: (next: string) => void
  /**
   * What kinds of media are valid here. Drives the file `accept` attribute,
   * preview rendering, and validation.
   */
  kind?: MediaPickerKind
  /**
   * Editor-only preference: when true, the field hides its crest fallback
   * preview to reflect that the editor *wants* the slot to render empty
   * downstream. This flag is **UI-only**; nothing about the persisted value
   * changes. The storefront still falls back to the crest unless the renderer
   * has been wired to honour a separate "explicitly empty" signal. See the
   * follow-up note in `docs/features/drops-cms.md` ("Persisted leaveEmpty").
   */
  leaveEmpty?: boolean
  /** Toggle handler — when undefined the toggle is hidden. */
  onLeaveEmptyChange?: (next: boolean) => void
  /**
   * Brand fallback shown in the preview when the field is empty (or the remote
   * asset fails to load) and `leaveEmpty` is false. Defaults to the bundled ANVL crest.
   */
  fallback?: 'crest' | 'wordmark' | 'none'
  /**
   * Optional chained preview URL when the main value is empty (still gated by
   * {@link isLikelySafeMediaSrc}). Wordmarks commonly reuse the campaign logo
   * image before falling back to the crest.
   */
  fallbackPreviewSrc?: string
  /** Optional explicit max bytes; defaults are 2.5 MB image / 8 MB video. */
  maxBytes?: number
  /** Validation message rendered below the dropzone. */
  error?: string
  /** Hide the URL/path text input (file pickers only). */
  hideUrlInput?: boolean
  className?: string
  /** Aria label for the file picker button. */
  pickerLabel?: string
  /** When set + Supabase configured, uploads to `cms-media` instead of embedding data URLs. */
  supabaseUpload?: {
    dropSlug: string
    role: CmsDropVisualAssetRole
  }
  /** Opens the Supabase media library picker when env is configured. */
  enableLibraryBrowse?: boolean
  /** When replacing via upload or library pick, delete the previous Supabase object. */
  replaceRemoteAsset?: boolean
}

function isImageHref(value: string): boolean {
  if (!value.trim()) return false
  if (value.startsWith('data:image/')) return true
  return /\.(?:png|jpe?g|webp|gif|avif|svg|bmp)(?:\?.*)?$/i.test(value)
}

function isVideoHref(value: string): boolean {
  if (!value.trim()) return false
  if (value.startsWith('data:video/')) return true
  return /\.(?:mp4|webm|mov|m4v|ogv)(?:\?.*)?$/i.test(value)
}

function acceptFor(kind: MediaPickerKind): string {
  switch (kind) {
    case 'image':
      return 'image/*,.svg'
    case 'video':
      return 'video/*'
    case 'any':
    default:
      return 'image/*,video/*,.svg'
  }
}

function validateFile(
  file: File,
  kind: MediaPickerKind,
  maxBytes: number,
): string | null {
  const isImg =
    file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg')
  const isVid = file.type.startsWith('video/')
  if (kind === 'image' && !isImg) {
    return 'Choose an image file (PNG, JPG, WebP, SVG, …).'
  }
  if (kind === 'video' && !isVid) {
    return 'Choose a video file (MP4, WebM, …).'
  }
  if (kind === 'any' && !isImg && !isVid) {
    return 'Choose an image or video file.'
  }
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1_000_000).toFixed(1)
    return `File too large to embed (~${mb} MB max). Paste a hosted URL or save the asset under /public.`
  }
  return null
}

/**
 * Unified media picker for the ANVL CMS:
 *  - drag-and-drop dropzone (desktop) with file picker fallback
 *  - URL / public path fallback for hosted assets
 *  - validates type + size, embeds via data URL when small enough
 *  - shows the bundled ANVL crest as a default preview for "logo-like" fields,
 *    with a "Leave empty (no fallback)" toggle when truly empty rendering is needed.
 */
export function MediaPickerField({
  label,
  hint,
  value,
  onChange,
  kind = 'image',
  leaveEmpty = false,
  onLeaveEmptyChange,
  fallback = 'crest',
  fallbackPreviewSrc,
  maxBytes,
  error,
  hideUrlInput,
  className,
  pickerLabel,
  supabaseUpload,
  enableLibraryBrowse,
  replaceRemoteAsset = true,
}: MediaPickerFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isOver, setIsOver] = useState(false)
  const [supportsDragDrop, setSupportsDragDrop] = useState(true)
  const [isEmbeddingFile, setIsEmbeddingFile] = useState(false)
  const [mainImageFailed, setMainImageFailed] = useState(false)
  const [chainImageFailed, setChainImageFailed] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const showLibraryBrowse =
    (enableLibraryBrowse ?? Boolean(supabaseUpload)) &&
    Boolean(getSupabasePublicEnv())
  const limit = useMemo(
    () => maxBytes ?? (kind === 'video' ? DEFAULT_VIDEO_MAX_BYTES : DEFAULT_MAX_BYTES),
    [kind, maxBytes],
  )
  const leaveEmptyId = useId()
  const fileId = useId()
  const urlId = useId()

  const trimmed = value.trim()
  // SEC-20 — refuse to render <img>/<video> for values that don't match
  // the media URL allowlist (javascript:, data:text/html, vbscript:, …).
  // We still keep the typed value in the input so the user sees the bad
  // paste and can correct it, but we don't let it reach the preview.
  const isUnsafeSrc = trimmed.length > 0 && !isLikelySafeMediaSrc(trimmed)
  const showVideo =
    kind === 'video' || (kind === 'any' && isVideoHref(trimmed))
  const showImage =
    kind === 'image' || (kind === 'any' && isImageHref(trimmed))

  const chainPreview = fallbackPreviewSrc?.trim()
  const safeChain =
    chainPreview && isLikelySafeMediaSrc(chainPreview) ? chainPreview : ''
  const chainIsRenderableImage =
    Boolean(safeChain) &&
    kind !== 'video' &&
    isImageHref(safeChain)

  // The brief carved out "drag and drop for desktops". Hide the affordance on
  // touch-first devices where it's not a realistic gesture.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const apply = () => setSupportsDragDrop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const applyNextValue = (next: string) => {
    const prev = value.trim()
    const nextTrim = next.trim()
    if (
      replaceRemoteAsset &&
      prev &&
      prev !== nextTrim &&
      prev.includes('/storage/v1/object/public/')
    ) {
      void deleteCmsMediaByPublicUrl(prev)
    }
    onChange(next)
  }

  const handleFile = (file: File) => {
    const err = validateFile(file, kind, limit)
    if (err) {
      toast.error(err)
      return
    }

    if (supabaseUpload && getSupabasePublicEnv()) {
      setIsEmbeddingFile(true)
      void (async () => {
        const uploaded = await uploadCmsMediaFile({
          file,
          dropSlug: supabaseUpload.dropSlug,
          role: supabaseUpload.role,
        })
        setIsEmbeddingFile(false)
        if (uploaded.ok) {
          applyNextValue(uploaded.publicUrl)
          toast.success('Uploaded to Supabase.')
          return
        }
        toast.error(uploaded.error)
      })()
      return
    }

    const reader = new FileReader()
    setIsEmbeddingFile(true)
    reader.onload = () => {
      setIsEmbeddingFile(false)
      if (typeof reader.result === 'string') {
        applyNextValue(reader.result)
        toast.success('Embedded for this browser.')
      }
    }
    reader.onerror = () => {
      setIsEmbeddingFile(false)
      toast.error('Could not read that file.')
    }
    reader.readAsDataURL(file)
  }

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(false)
    if (leaveEmpty || !supportsDragDrop) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  useEffect(() => {
    setMainImageFailed(false)
    setChainImageFailed(false)
  }, [trimmed, safeChain, leaveEmpty])

  const renderBrandPreviewFallback = () => {
    if (fallback === 'none') {
      return (
        <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          No media
        </span>
      )
    }
    if (fallback === 'wordmark') {
      return (
        <div
          data-fallback="wordmark"
          className="flex h-full w-full max-h-full max-w-full items-center justify-center p-1"
        >
          <AnvlWordmark className="h-9 w-auto max-w-full text-[var(--color-text-muted)] opacity-70" />
        </div>
      )
    }
    return (
      <div
        data-fallback="crest"
        className="flex h-full w-full max-h-full max-w-full items-center justify-center p-1"
      >
        <AnvlCrest
          aria-label="Default ANVL crest"
          className="h-12 w-auto max-w-full text-[var(--color-text-muted)] opacity-60"
        />
      </div>
    )
  }

  const previewBody = (() => {
    if (isEmbeddingFile) {
      return (
        <div
          className="flex flex-col items-center justify-center gap-2 px-2 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            size={24}
            aria-hidden="true"
            className="animate-spin text-[var(--color-text-muted)]"
          />
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {supabaseUpload && getSupabasePublicEnv() ? 'Uploading…' : 'Embedding…'}
          </span>
        </div>
      )
    }
    if (leaveEmpty) {
      return (
        <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Empty — not rendered
        </span>
      )
    }
    if (isUnsafeSrc) {
      return (
        <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-danger)]">
          Unsafe URL blocked
        </span>
      )
    }
    if (!trimmed) {
      if (chainIsRenderableImage && !chainImageFailed) {
        return (
          <img
            key={safeChain}
            src={safeChain}
            alt=""
            className="max-h-full max-w-full object-contain opacity-90"
            onError={() => setChainImageFailed(true)}
          />
        )
      }
      return renderBrandPreviewFallback()
    }
    if (showVideo && isVideoHref(trimmed)) {
      return (
        <video
          key={trimmed}
          src={trimmed}
          className="max-h-full max-w-full object-contain"
          controls
          muted
          playsInline
        />
      )
    }
    if (showImage || isImageHref(trimmed)) {
      if (mainImageFailed) {
        if (fallback === 'none') {
          return (
            <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              Preview unavailable
            </span>
          )
        }
        return renderBrandPreviewFallback()
      }
      return (
        <img
          key={trimmed}
          src={trimmed}
          alt="Preview"
          className="max-h-full max-w-full object-contain"
          onError={() => setMainImageFailed(true)}
        />
      )
    }
    return (
      <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        Linked asset
      </span>
    )
  })()

  const dropzoneDisabled = leaveEmpty

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="block text-sm font-semibold text-[var(--color-text)]">
          {label}
        </span>
        {onLeaveEmptyChange ? (
          <label
            htmlFor={leaveEmptyId}
            className="flex max-w-[min(100%,20rem)] cursor-pointer items-start gap-2 rounded-lg border border-transparent py-1 text-[11px] text-[var(--color-text-muted)]"
            // UI-only flag: hides the crest preview to indicate intent.
            // Persistence will land in a follow-up once `DropVisuals` gains a
            // sibling map for explicit-empty fields.
            title="Hides the brand fallback preview in this editor. The storefront still applies its own fallback until per-field 'empty' state is persisted (planned follow-up)."
          >
            <input
              id={leaveEmptyId}
              type="checkbox"
              checked={leaveEmpty}
              onChange={(e) => onLeaveEmptyChange(e.target.checked)}
              className={adminCheckboxControlClass}
            />
            <span className="min-w-0 leading-snug">
              <span className="font-medium text-[var(--color-text)]">Hide fallback preview</span>
            </span>
          </label>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap items-stretch gap-4 rounded-xl border border-dashed bg-[var(--color-bg)]/40 p-3 transition-colors',
          isOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
            : 'border-[var(--color-line)]',
          dropzoneDisabled && 'opacity-60',
        )}
        onDragOver={(e) => {
          if (dropzoneDisabled) return
          e.preventDefault()
          if (!isOver) setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
      >
        <div className="flex h-[5rem] min-w-[8rem] max-w-[12rem] flex-1 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
          {previewBody}
        </div>

        <div className="flex min-w-[min(100%,220px)] flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept={acceptFor(kind)}
            className="sr-only"
            onChange={onFileInput}
            disabled={dropzoneDisabled}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={dropzoneDisabled}
              onClick={() => fileRef.current?.click()}
              aria-label={pickerLabel ?? `Choose file for ${label}`}
            >
              <Upload size={14} className="mr-1.5" aria-hidden="true" />
              Choose file
            </Button>
            {showLibraryBrowse ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={dropzoneDisabled}
                onClick={() => setLibraryOpen(true)}
              >
                Browse library
              </Button>
            ) : null}
            {supportsDragDrop ? (
              <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                or drag &amp; drop
              </span>
            ) : null}
            {trimmed && !dropzoneDisabled ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyNextValue('')}
                aria-label={`Clear ${label}`}
              >
                <X size={14} className="mr-1" aria-hidden="true" />
                Clear
              </Button>
            ) : null}
          </div>

          {!hideUrlInput ? (
            <details className="rounded-lg border border-[var(--color-line)]/60 bg-[var(--color-bg)]/50 px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-medium text-[var(--color-text-muted)]">
                Or paste URL / public path
              </summary>
              <input
                id={urlId}
                type="url"
                value={value}
                disabled={dropzoneDisabled}
                onChange={(e) => applyNextValue(e.target.value)}
                placeholder={
                  kind === 'video'
                    ? 'https://… or /media/video.mp4'
                    : '/brand/stacked.svg'
                }
                className={cn('mt-2', adminFieldControlClass)}
                spellCheck={false}
              />
              <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                Max embed size {Math.round(limit / 1_000_000)} MB. Larger files
                should live under <code className="rounded bg-[var(--color-surface)] px-1">/public</code>
                {' '}or a CDN.
              </p>
            </details>
          ) : null}
        </div>
      </div>

      {isUnsafeSrc ? (
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          That URL scheme isn&rsquo;t allowed for media. Use a public path
          (<code className="rounded bg-[var(--color-surface)] px-1">/brand/...</code>),
          an https URL, or a <code className="rounded bg-[var(--color-surface)] px-1">data:image/*</code>
          / <code className="rounded bg-[var(--color-surface)] px-1">data:video/*</code> URI.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
      ) : null}

      {showLibraryBrowse && libraryOpen ? (
        <MediaLibraryPickerModal
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => applyNextValue(url)}
          kind={kind}
        />
      ) : null}
    </div>
  )
}

/**
 * Resolve a CMS image string to the value the storefront should render. Empty
 * strings fall back to the ANVL crest path by default so logo-like surfaces are
 * never blank unless the editor explicitly opted out.
 */
export function resolveLogoFallback(
  value: string | undefined,
  defaultPath: string,
): string {
  return value && value.trim() ? value : defaultPath
}
