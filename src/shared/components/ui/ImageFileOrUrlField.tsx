import { useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { cn } from '@/shared/lib/cn'

/** Stay under typical localStorage quotas when embedding picks as data URLs */
const MAX_IMAGE_BYTES = 2_500_000

type ImageFileOrUrlFieldProps = {
  label: string
  /** Explains data URL vs path behaviour */
  hint?: string
  value: string
  onChange: (next: string) => void
  className?: string
}

export function ImageFileOrUrlField({
  label,
  hint,
  value,
  onChange,
  className,
}: ImageFileOrUrlFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (list: FileList | null) => {
    const file = list?.[0]
    if (!file) return
    const ok =
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.svg')
    if (!ok) {
      toast.error('Choose an image file (PNG, JPG, SVG, WebP, …).')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(
        'File is too large to embed (~2.5MB max). Use “Paste URL / path” with a file under public/ or a hosted URL.',
      )
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') {
        onChange(r)
        toast.success('Image embedded for this browser.')
      }
    }
    reader.onerror = () => toast.error('Could not read that file.')
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-sm font-semibold text-[var(--color-text)]">
        {label}
      </span>
      {hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}

      <div className="flex flex-wrap items-start gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4">
        <div
          className={cn(
            'flex h-[4.5rem] min-w-[7rem] max-w-[11rem] items-center justify-center overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]',
          )}
        >
          {value.trim() ? (
            <img
              src={value}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              No image
            </span>
          )}
        </div>

        <div className="flex min-w-[min(100%,220px)] flex-1 flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            className="sr-only"
            onChange={(e) => {
              pickFile(e.target.files)
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Choose file
            </Button>
            {value.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
              >
                Clear
              </Button>
            ) : null}
          </div>

          <details className="rounded-lg border border-[var(--color-line)]/60 bg-[var(--color-bg)]/50 px-3 py-2">
            <summary className="cursor-pointer select-none text-xs font-medium text-[var(--color-text-muted)]">
              Or paste URL / public path
            </summary>
            <Input
              className="mt-3"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="/brand/stacked.svg"
            />
          </details>
        </div>
      </div>
    </div>
  )
}
