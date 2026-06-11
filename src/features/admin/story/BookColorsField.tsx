import { DEFAULT_BOOK_COLORS, type BookColors } from '@/features/story/schemas/story.schema'

interface BookColorsFieldProps {
  colors: BookColors
  onChange: (next: BookColors) => void
}

const SWATCHES: { key: keyof BookColors; label: string; hint: string }[] = [
  { key: 'cover', label: 'Cover cloth', hint: 'The bound cover colour.' },
  { key: 'foil', label: 'Foil stamp', hint: 'Title + crest metal.' },
  { key: 'pageEdge', label: 'Page edges', hint: 'Gilded block edges.' },
  { key: 'heading', label: 'Page heading', hint: 'Open-book heading ink.' },
  { key: 'text', label: 'Page text', hint: 'Open-book body ink.' },
]

/** Edits the 3D book's cloth / foil / page-edge colours with a live swatch. */
export function BookColorsField({ colors, onChange }: BookColorsFieldProps) {
  function set(key: keyof BookColors, value: string) {
    onChange({ ...colors, [key]: value })
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] p-4">
      <legend className="flex items-center gap-3 px-1 text-xs uppercase tracking-[0.18em] text-[var(--color-ember-bright)]">
        Book colours
        <button
          type="button"
          onClick={() => onChange(DEFAULT_BOOK_COLORS)}
          className="rounded border border-[var(--color-line)] px-2 py-0.5 text-[10px] normal-case tracking-normal text-[var(--color-text-muted)] hover:border-[var(--color-ember)]"
        >
          Reset
        </button>
      </legend>

      <div className="grid gap-4 sm:grid-cols-3">
        {SWATCHES.map(({ key, label, hint }) => (
          <div key={key} className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--color-text)]">{label}</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => set(key, e.target.value)}
                aria-label={`${label} colour`}
                className="h-9 w-9 cursor-pointer rounded border border-[var(--color-line)] bg-transparent"
              />
              <input
                type="text"
                value={colors[key]}
                onChange={(e) => set(key, e.target.value)}
                aria-label={`${label} hex`}
                className="w-full rounded border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] focus-ring"
              />
            </div>
            <p className="text-[10px] text-[var(--color-graphite)]">{hint}</p>
          </div>
        ))}
      </div>
    </fieldset>
  )
}
