/**
 * The forged search input above the FAQ stack. Filtering runs in-memory over a
 * handful of items, so it re-runs on every keystroke with no debounce needed.
 *
 * Icons are inline SVG rather than an icon package — this project has no icon
 * dependency installed, and two 1px-stroke glyphs match the plates' hairline
 * language better than a rounded icon set would.
 */

function SearchGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1" />
      <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  )
}

function ClearGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M4 4 12 12M12 4 4 12" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
    </svg>
  )
}

export function FaqSearchField({
  value,
  onChange,
  resultCount,
  totalCount,
}: {
  value: string
  onChange: (next: string) => void
  resultCount: number
  totalCount: number
}) {
  const filtering = value.trim().length > 0
  const status = filtering
    ? `${resultCount} of ${totalCount} match`
    : `${totalCount} ${totalCount === 1 ? 'question' : 'questions'}`

  return (
    <div className="anvl-faq-search">
      <label htmlFor="faq-search" className="sr-only">
        Search the FAQ
      </label>
      <span aria-hidden="true" className="anvl-faq-search-icon">
        <SearchGlyph />
      </span>
      <input
        id="faq-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search sizing, shipping, care…"
        autoComplete="off"
        className="anvl-faq-search-input"
      />
      {filtering ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="anvl-faq-search-clear focus-ring"
          aria-label="Clear search"
        >
          <ClearGlyph />
        </button>
      ) : null}
      <span aria-hidden="true" className="anvl-faq-search-underline" />
      <p aria-live="polite" className="anvl-faq-search-status anvl-micro">
        {status}
      </p>
    </div>
  )
}
