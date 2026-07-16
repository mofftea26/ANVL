import { useRef, useState } from 'react'
import { Crosshair, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { cn } from '@/shared/lib/cn'

export interface HotspotDraft {
  x: number
  y: number
  title: string
  body: string
}

/**
 * Click-to-place hotspot editor: click the render to drop a marker, then
 * write its copy. Positions are stored as PERCENT of the image box, so a
 * marker holds its spot at every display size on the storefront.
 */
export function HotspotPlacer({
  imageUrl,
  hotspots,
  onChange,
}: {
  imageUrl: string | null
  hotspots: HotspotDraft[]
  onChange: (next: HotspotDraft[]) => void
}) {
  const imageRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = imageRef.current?.getBoundingClientRect()
    if (!box || box.width < 4) return
    const x = ((e.clientX - box.left) / box.width) * 100
    const y = ((e.clientY - box.top) / box.height) * 100
    const next = [
      ...hotspots,
      {
        x: Math.min(100, Math.max(0, Number(x.toFixed(2)))),
        y: Math.min(100, Math.max(0, Number(y.toFixed(2)))),
        title: '',
        body: '',
      },
    ]
    onChange(next)
    setSelected(next.length - 1)
  }

  const patch = (index: number, changes: Partial<HotspotDraft>) =>
    onChange(hotspots.map((h, i) => (i === index ? { ...h, ...changes } : h)))

  const remove = (index: number) => {
    onChange(hotspots.filter((_, i) => i !== index))
    setSelected(null)
  }

  if (!imageUrl) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-line)] p-6 text-center text-xs text-[var(--color-text-muted)]">
        Assign a hero render in the <strong>The piece</strong> step first — hotspots are
        placed on it.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Click the render to drop a marker, then write its detail. Markers are stored as a
        position on the image, so they stay put on every screen.
      </p>

      <div
        ref={imageRef}
        onClick={place}
        className="relative mx-auto w-full max-w-xs cursor-crosshair overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]"
      >
        <img src={imageUrl} alt="" className="h-auto w-full select-none object-contain" />
        {hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Hotspot ${i + 1}${h.title ? `: ${h.title}` : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setSelected(selected === i ? null : i)
            }}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            className={cn(
              'focus-ring absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-[9px] font-bold transition-transform',
              selected === i
                ? 'scale-125 border-[var(--color-highlight-bright)] bg-[var(--color-highlight)] text-[color:var(--color-on-highlight)]'
                : 'border-[var(--color-highlight-bright)] bg-[var(--color-bg)]/80 text-[var(--color-highlight-bright)]',
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {hotspots.length === 0 ? (
        <p className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Crosshair size={13} aria-hidden="true" />
          No markers yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {hotspots.map((h, i) => (
            <li
              key={i}
              className={cn(
                'rounded-xl border p-3',
                selected === i
                  ? 'border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))]'
                  : 'border-[var(--color-line)]',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="anvl-micro text-[var(--color-highlight-bright)]">
                  Marker {i + 1} · {h.x.toFixed(0)}% / {h.y.toFixed(0)}%
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  density="compact"
                  aria-label={`Remove marker ${i + 1}`}
                  onClick={() => remove(i)}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </Button>
              </div>
              <div className="space-y-2">
                <FormField label="Detail title" labelStyle="stacked">
                  <Input
                    density="compact"
                    value={h.title}
                    onFocus={() => setSelected(i)}
                    onChange={(e) => patch(i, { title: e.target.value })}
                  />
                </FormField>
                <FormField label="Detail story" labelStyle="stacked">
                  <Textarea
                    rows={2}
                    value={h.body}
                    onFocus={() => setSelected(i)}
                    onChange={(e) => patch(i, { body: e.target.value })}
                  />
                </FormField>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
