import { cn } from '@/shared/lib/cn'
import type { SizeTableRowKey } from '@/features/cms/support/supportContent.zod'

/**
 * The textual companion of the measurement diagram — the diagram is never the
 * only source: render this list next to it so every lettered arrow has a
 * written explanation. Keys line up with the structured size-table rows.
 */
export const SIZE_MEASUREMENT_POINTS: readonly {
  key: SizeTableRowKey
  letter: string
  label: string
  description: string
}[] = [
  {
    key: 'length',
    letter: 'A',
    label: 'Length',
    description: 'From the highest point of the shoulder straight down to the hem.',
  },
  {
    key: 'chest',
    letter: 'B',
    label: 'Chest width',
    description: 'Across the chest from armpit to armpit, garment laid flat.',
  },
  {
    key: 'waist',
    letter: 'C',
    label: 'Waist width',
    description: 'Across the midpoint of the body, garment laid flat.',
  },
  {
    key: 'bottom',
    letter: 'D',
    label: 'Bottom width',
    description: 'Across the hem opening, garment laid flat.',
  },
  {
    key: 'collar',
    letter: 'E',
    label: 'Collar width',
    description: 'Across the neck opening, seam to seam.',
  },
  {
    key: 'sleeve',
    letter: 'F',
    label: 'Sleeve length',
    description: 'From the shoulder seam along the outer edge down to the cuff.',
  },
  {
    key: 'cuff',
    letter: 'G',
    label: 'Cuff width',
    description: 'Across the sleeve opening, garment laid flat.',
  },
]

const DIAGRAM_ALT =
  'Flat garment diagram of a tee with lettered measurement arrows: A length from shoulder to hem, B chest width, C waist width, D bottom width at the hem, E collar width, F sleeve length, G cuff width. Widths are measured with the garment laid flat.'

/**
 * Brand-toned flat-tee measurement diagram — the same line drawing shipped as
 * `public/brand/size-diagram.svg`, inlined here so `currentColor` picks up the
 * surrounding theme. Always pair with {@link SIZE_MEASUREMENT_POINTS} (the
 * diagram is decorative support, not the only source of the information).
 */
export function SizeDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 430"
      role="img"
      aria-label={DIAGRAM_ALT}
      className={cn('h-auto w-full max-w-md text-[var(--color-text-muted)]', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <marker
          id="anvl-size-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M1 1 L9 5 L1 9" fill="none" stroke="currentColor" strokeWidth={2} />
        </marker>
      </defs>

      {/* Tee outline (laid flat) */}
      <path d="M225 105 C 240 130 280 130 295 105 L 380 100 L 460 150 L 435 205 L 370 170 L 370 380 L 150 380 L 150 170 L 85 205 L 60 150 L 140 100 Z" />
      {/* Back collar line */}
      <path d="M225 105 C 240 95 280 95 295 105" opacity={0.6} />

      {/* Dashed guides for the length arrow */}
      <path d="M382 100 L 500 100" strokeDasharray="4 5" opacity={0.45} />
      <path d="M372 380 L 500 380" strokeDasharray="4 5" opacity={0.45} />

      {/* A — Length */}
      <line x1={500} y1={104} x2={500} y2={376} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* B — Chest width */}
      <line x1={156} y1={190} x2={364} y2={190} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* C — Waist width */}
      <line x1={156} y1={275} x2={364} y2={275} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* D — Bottom width */}
      <line x1={156} y1={358} x2={364} y2={358} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* E — Collar width */}
      <line x1={230} y1={88} x2={290} y2={88} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* F — Sleeve length */}
      <line x1={398} y1={118} x2={442} y2={168} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />
      {/* G — Cuff width */}
      <line x1={53} y1={158} x2={76} y2={206} markerStart="url(#anvl-size-arrow)" markerEnd="url(#anvl-size-arrow)" />

      {/* Letter markers */}
      <g
        stroke="none"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize={16}
        fontWeight={600}
        textAnchor="middle"
      >
        <text x={516} y={245}>A</text>
        <text x={260} y={182}>B</text>
        <text x={260} y={267}>C</text>
        <text x={260} y={350}>D</text>
        <text x={260} y={76}>E</text>
        <text x={440} y={128}>F</text>
        <text x={40} y={178}>G</text>
      </g>
    </svg>
  )
}
