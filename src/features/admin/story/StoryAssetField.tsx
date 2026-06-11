import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminButton } from '@/features/admin/components/AdminButton'
import {
  EMPTY_STORY_ASSET,
  type StoryAsset,
  type StoryAssetKind,
} from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'
import { uploadStoryMedia } from '@/features/admin/story/storyMedia.service'

interface StoryAssetFieldProps {
  label: string
  asset: StoryAsset
  /** Path scope for uploads (e.g. chapter slug). */
  scope: string
  onChange: (next: StoryAsset) => void
}

const KIND_OPTIONS: { value: StoryAssetKind; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'image', label: 'Image (upload)' },
  { value: 'video', label: 'Video (upload)' },
  { value: 'embed', label: 'External video (URL)' },
]

/**
 * Edits a single {@link StoryAsset}: pick a kind, then either upload an
 * image/video to the `story-media` bucket or paste an external embed URL.
 * Alt text is always editable for accessibility.
 */
export function StoryAssetField({ label, asset, scope, onChange }: StoryAssetFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const resolved = resolveStoryAsset(asset)

  function setKind(kind: StoryAssetKind) {
    if (kind === 'none') {
      onChange({ ...EMPTY_STORY_ASSET, alt: asset.alt })
      return
    }
    onChange({ ...asset, kind, ...(kind === 'embed' ? { storagePath: null } : { url: null }) })
  }

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const result = await uploadStoryMedia(file, scope || 'story', asset.alt)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      onChange(result.asset)
      toast.success('Media uploaded.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const acceptMime = asset.kind === 'video' ? 'video/*' : 'image/*'
  const currentLabel = asset.storagePath
    ? asset.storagePath.split('/').pop()
    : asset.url || null

  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] p-4">
      <legend className="px-1 text-xs uppercase tracking-[0.18em] text-[var(--color-ember-bright)]">
        {label}
      </legend>

      <AdminFieldSelect
        label="Asset type"
        value={asset.kind}
        onChange={(v) => setKind(v as StoryAssetKind)}
        options={KIND_OPTIONS}
      />

      {(asset.kind === 'image' || asset.kind === 'video') && (
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={acceptMime}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading…' : currentLabel ? 'Replace file' : 'Upload file'}
          </AdminButton>
          {currentLabel ? (
            <p className="truncate text-xs text-[var(--color-text-muted)]">{currentLabel}</p>
          ) : null}
        </div>
      )}

      {asset.kind === 'embed' && (
        <AdminFormField label="Embed URL" hint="Mux / YouTube / Vimeo player URL (https).">
          <AdminInput
            type="url"
            value={asset.url ?? ''}
            placeholder="https://player.vimeo.com/video/…"
            onChange={(e) => onChange({ ...asset, url: e.target.value })}
          />
        </AdminFormField>
      )}

      {asset.kind !== 'none' && (
        <AdminFormField label="Alt text" hint="Describe the media for screen readers.">
          <AdminInput
            value={asset.alt}
            onChange={(e) => onChange({ ...asset, alt: e.target.value })}
          />
        </AdminFormField>
      )}

      {resolved.type !== 'none' ? (
        <p className="text-[11px] text-[var(--color-graphite)]">Preview ready · {resolved.type}</p>
      ) : asset.kind !== 'none' ? (
        <p className="text-[11px] text-[var(--color-graphite)]">No valid source yet.</p>
      ) : null}
    </fieldset>
  )
}
