/**
 * Care symbols — the standard garment-care marks drawn as inline SVG in brand
 * tokens (no icon font, no images). CMS picks preset keys; the passport
 * renders the mark + its plain-language meaning.
 */

export interface CareSymbolDef {
  key: string
  label: string
  /** What the mark actually means, in plain language. */
  meaning: string
  Icon: () => React.ReactNode
}

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' as const }

/** Wash tub outline — the base of every washing mark. */
function Tub({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <path d="M3 9 L5 6 H19 L21 9 V17 A2 2 0 0 1 19 19 H5 A2 2 0 0 1 3 17 Z" {...S} />
      {children}
    </>
  )
}

function Triangle({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <path d="M12 4 L21 20 H3 Z" {...S} />
      {children}
    </>
  )
}

function Square({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1" {...S} />
      {children}
    </>
  )
}

function Cross() {
  return <path d="M4 4 L20 20 M20 4 L4 20" {...S} />
}

export const CARE_SYMBOLS: CareSymbolDef[] = [
  {
    key: 'wash-cold',
    label: 'Cold wash',
    meaning: 'Machine wash cold — heat is what kills compression and print.',
    Icon: () => (
      <Tub>
        <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none" />
      </Tub>
    ),
  },
  {
    key: 'wash-30',
    label: 'Wash at 30°',
    meaning: 'Machine wash at 30°C or below.',
    Icon: () => (
      <Tub>
        <text x="12" y="16" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">
          30
        </text>
      </Tub>
    ),
  },
  {
    key: 'wash-hand',
    label: 'Hand wash',
    meaning: 'Hand wash only — no machine.',
    Icon: () => (
      <Tub>
        <path d="M8 13 q2 -2 4 0 q2 2 4 0" {...S} />
      </Tub>
    ),
  },
  {
    key: 'wash-gentle',
    label: 'Gentle cycle',
    meaning: 'Use the delicate/gentle cycle — reduced agitation and spin.',
    Icon: () => (
      <Tub>
        <path d="M5 21 H19" {...S} />
      </Tub>
    ),
  },
  {
    key: 'inside-out',
    label: 'Wash inside out',
    meaning: 'Turn the piece inside out to protect the print and face yarn.',
    Icon: () => (
      <Square>
        <path d="M8 8 L16 16 M8 16 L16 8" {...S} />
      </Square>
    ),
  },
  {
    key: 'no-bleach',
    label: 'Do not bleach',
    meaning: 'No bleach of any kind — it destroys elastane.',
    Icon: () => (
      <Triangle>
        <Cross />
      </Triangle>
    ),
  },
  {
    key: 'no-tumble',
    label: 'Do not tumble dry',
    meaning: 'No dryer — tumble heat permanently relaxes the knit.',
    Icon: () => (
      <Square>
        <circle cx="12" cy="12" r="5" {...S} />
        <Cross />
      </Square>
    ),
  },
  {
    key: 'tumble-low',
    label: 'Tumble dry low',
    meaning: 'Tumble dry on low heat only.',
    Icon: () => (
      <Square>
        <circle cx="12" cy="12" r="5" {...S} />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </Square>
    ),
  },
  {
    key: 'line-dry',
    label: 'Line dry',
    meaning: 'Hang to dry, out of direct sun.',
    Icon: () => (
      <Square>
        <path d="M3.5 7.5 H20.5" {...S} />
      </Square>
    ),
  },
  {
    key: 'flat-dry',
    label: 'Dry flat',
    meaning: 'Dry flat so the piece keeps its shape.',
    Icon: () => (
      <Square>
        <path d="M3.5 12 H20.5" {...S} />
      </Square>
    ),
  },
  {
    key: 'no-iron',
    label: 'Do not iron',
    meaning: 'Never iron — direct heat melts performance fibre.',
    Icon: () => (
      <>
        <path d="M3 17 H21 L18 9 H8 Z" {...S} />
        <Cross />
      </>
    ),
  },
  {
    key: 'iron-low',
    label: 'Iron low',
    meaning: 'Iron on the lowest setting, inside out.',
    Icon: () => (
      <>
        <path d="M3 17 H21 L18 9 H8 Z" {...S} />
        <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    key: 'no-dry-clean',
    label: 'Do not dry clean',
    meaning: 'No dry cleaning — the solvents attack the fibre.',
    Icon: () => (
      <>
        <circle cx="12" cy="12" r="8.5" {...S} />
        <Cross />
      </>
    ),
  },
]

export function getCareSymbol(key: string): CareSymbolDef | null {
  const k = key.trim().toLowerCase()
  return CARE_SYMBOLS.find((s) => s.key === k) ?? null
}
