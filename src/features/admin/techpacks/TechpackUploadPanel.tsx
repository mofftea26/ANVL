import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileUp, Upload } from '@/shared/icons'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { TechpackIngestProgress, TechpackIngestResult } from './techpackIngest'
import { useIngestTechpackMutation } from './useTechpacks'

interface TechpackUploadPanelProps {
  productOptions: ReadonlyArray<{ value: string; label: string }>
  productsLoading: boolean
  /** Called with the finished ingest once the parse lands. */
  onIngested: (result: TechpackIngestResult) => void
}

const PHASE_ORDER: Record<TechpackIngestProgress['phase'], number> = {
  uploading: 0,
  creating: 1,
  opening: 2,
  parsing: 3,
  saving: 4,
  done: 5,
}

/** Coarse 0–1 completion so the bar moves during upload as well as parsing. */
export function completion(progress: TechpackIngestProgress): number {
  if (progress.phase === 'done') return 1
  if (progress.phase === 'parsing' && progress.pageCount > 0) {
    return 0.2 + (progress.page / progress.pageCount) * 0.7
  }
  // A phase carrying its own ratio (pdf.js reports bytes while it indexes the
  // document) advances within its slice rather than sitting on the boundary.
  const slice = PHASE_ORDER[progress.phase] * 0.05
  return progress.ratio === null ? slice : slice + progress.ratio * 0.05
}

/** `1:04` / `12s` — short enough to sit in a micro line. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  if (total < 60) return `${total}s`
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Upload + parse in one step. Parsing runs in THIS tab (pdf.js in the browser
 * — a 256 MB edge function would be permanently one larger pack away from
 * failing), so the operator watches it page by page rather than staring at an
 * opaque spinner for a minute.
 */
export function TechpackUploadPanel({
  productOptions,
  productsLoading,
  onIngested,
}: TechpackUploadPanelProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [productSlug, setProductSlug] = useState('')
  const [progress, setProgress] = useState<TechpackIngestProgress | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const ingest = useIngestTechpackMutation()

  // A ticking clock is what separates "working" from "hung" during the upload,
  // which is the longest phase and the one with no progress signal at all.
  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const run = (file: File) => {
    setProgress(null)
    setElapsed(0)
    setStartedAt(Date.now())
    ingest.mutate(
      { file, productSlug: productSlug || undefined, onProgress: setProgress },
      {
        onSuccess: (result) => {
          const issues = result.document.issues.length
          toast.success(
            `Parsed ${result.document.meta.pageCount} pages · ${result.imagesStored} images` +
              (issues > 0 ? ` · ${issues} to review` : ''),
          )
          // Separate toast, and a warning rather than an error: the pack is
          // fully usable, but re-parsing it later will need the file again.
          if (result.sourceSkipped) toast.warning(result.sourceSkipped, { duration: 10_000 })
          onIngested(result)
        },
        onError: (error: Error) => toast.error(error.message),
        onSettled: () => {
          setProgress(null)
          setStartedAt(null)
        },
      },
    )
  }

  const pick = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('Techpacks must be PDF files.')
      return
    }
    run(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const busy = ingest.isPending
  const percent = progress ? Math.round(completion(progress) * 100) : 0
  // No computable ratio: upload, record creation, document build, flat render.
  const indeterminate = Boolean(progress && progress.ratio === null && progress.phase !== 'parsing')

  return (
    <AdminCard
      title="Ingest a techpack"
      description="Drop the supplier PDF here. It uploads to the private techpack bucket first, then parses page by page in this tab — keep the tab open until it finishes."
    >
      <div className="space-y-4">
        <AdminFieldSelect
          label="Product (optional)"
          value={productSlug}
          onChange={setProductSlug}
          options={[{ value: '', label: 'Assign later' }, ...productOptions]}
          placeholder={productsLoading ? 'Loading products…' : 'Assign later'}
          hint="You can assign or change the product any time after the parse."
          disabled={busy}
        />

        <div
          onDragOver={(event) => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (!busy) pick(event.dataTransfer.files)
          }}
          className={cn(
            'rounded-xl border border-dashed p-6 text-center transition-colors',
            dragging
              ? 'border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_10%,transparent)]'
              : 'border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)]',
          )}
        >
          <FileUp
            size={26}
            aria-hidden="true"
            className="mx-auto mb-2 text-[var(--color-text-muted)]"
          />
          <p className="text-sm text-[var(--color-text)]">
            Drag a techpack PDF here, or choose a file.
          </p>
          <p className="anvl-micro mt-1 text-[var(--color-text-muted)]">
            Supplier names and disclaimers are stripped on the way in. If storage refuses
            the file as too large, the pack still parses — only the PDF is not kept.
          </p>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Techpack PDF"
            className="sr-only"
            disabled={busy}
            onChange={(event) => pick(event.target.files)}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            className="mt-4"
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={15} aria-hidden="true" />
            Choose PDF
          </Button>
        </div>

        {progress ? (
          <div role="status" aria-live="polite" className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-[var(--color-text)]">{progress.message}</p>
              <p className="anvl-micro shrink-0 tabular-nums text-[var(--color-text-muted)]">
                {/* Elapsed is the answer to "is this stuck?" — the question the
                    upload phase provokes, since it cannot report a percentage. */}
                {formatElapsed(elapsed)} · {progress.imagesStored} images
              </p>
            </div>

            {progress.detail ? (
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                {progress.detail}
              </p>
            ) : null}

            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-line)]">
              {indeterminate ? (
                // A percentage we cannot compute is a lie about how far along
                // the work is. A sweep says "still going" and says it honestly.
                <div
                  className="anvl-progress-sweep h-full w-1/3 rounded-full bg-[var(--color-highlight)] motion-reduce:w-full motion-reduce:opacity-60"
                  aria-hidden="true"
                />
              ) : (
                /* scaleX, not width — transforms only. */
                <div
                  className="h-full origin-left rounded-full bg-[var(--color-highlight)] motion-safe:transition-transform motion-safe:duration-300 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${percent / 100})` }}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminCard>
  )
}
