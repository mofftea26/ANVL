import { getPassportCountry, projectEquirect } from '../lib/passportCountries'

/**
 * "Origin" world map — a stylized low-poly world (equirectangular, code-owned,
 * no map library) with two CMS-assigned pins: where the piece was DESIGNED
 * (outline pin) and where it was MADE (filled, pulsing pin), joined by a
 * champagne arc. viewBox is 360×180 so lng/lat map 1:1 (x=lng+180, y=90−lat).
 */

const W = 360
const H = 180

/** Stylized continent silhouettes as (lng,lat) polygons — abstract on purpose. */
const LANDMASSES: Array<Array<[number, number]>> = [
  // North America
  [[-165, 66], [-150, 70], [-130, 70], [-115, 73], [-95, 72], [-82, 70], [-75, 62], [-60, 50], [-65, 44], [-75, 38], [-80, 30], [-82, 25], [-90, 20], [-95, 17], [-105, 20], [-110, 24], [-117, 33], [-125, 40], [-125, 48], [-140, 60], [-152, 60]],
  // Greenland
  [[-45, 82], [-25, 81], [-20, 75], [-30, 68], [-45, 61], [-55, 64], [-55, 75]],
  // South America
  [[-80, 9], [-70, 12], [-60, 8], [-50, 0], [-42, -5], [-35, -8], [-38, -15], [-48, -25], [-53, -34], [-58, -40], [-65, -42], [-70, -50], [-68, -55], [-72, -50], [-75, -40], [-70, -20], [-77, -10], [-80, 0]],
  // Europe (incl. Scandinavia sweep)
  [[-10, 44], [-8, 52], [-4, 58], [5, 59], [10, 64], [20, 70], [30, 70], [30, 60], [40, 66], [48, 48], [40, 45], [30, 45], [28, 41], [22, 38], [15, 38], [12, 44], [3, 43], [-2, 43]],
  // United Kingdom
  [[-4, 51], [-2, 54], [-4, 58], [-7, 55], [-6, 52]],
  // Africa
  [[-17, 15], [-17, 21], [-10, 30], [-5, 35], [10, 37], [20, 32], [32, 31], [35, 27], [43, 11], [51, 12], [48, 5], [40, -5], [35, -20], [30, -30], [20, -35], [15, -30], [12, -18], [8, -5], [8, 4], [-5, 5], [-12, 8]],
  // Asia (incl. Arabia + India + East Asia)
  [[40, 66], [60, 68], [75, 72], [95, 75], [110, 73], [130, 70], [150, 68], [170, 66], [178, 63], [170, 60], [158, 58], [152, 52], [140, 48], [134, 40], [126, 36], [120, 28], [110, 18], [106, 9], [100, 8], [97, 14], [92, 21], [86, 21], [80, 12], [77, 8], [72, 20], [66, 25], [58, 24], [51, 12], [43, 11], [35, 27], [32, 31], [28, 41], [35, 45], [48, 48], [60, 55]],
  // Japan
  [[130, 31], [135, 35], [140, 38], [142, 43], [139, 43], [135, 37], [130, 33]],
  // Indonesia / New Guinea sweep
  [[95, -1], [105, -6], [114, -8], [120, -9], [126, -8], [132, -3], [141, -4], [147, -7], [142, -10], [132, -7], [124, -10], [112, -9], [100, -4]],
  // Australia
  [[114, -22], [122, -14], [132, -12], [142, -11], [146, -15], [153, -25], [151, -33], [146, -39], [138, -36], [130, -32], [122, -34], [115, -30]],
]

function polyPoints(poly: Array<[number, number]>): string {
  return poly
    .map(([lng, lat]) => {
      const { x, y } = projectEquirect(lat, lng, W, H)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function WorldOriginMap({
  madeIn,
  designedIn,
  label,
}: {
  /** Country preset keys (see passportCountries.ts). */
  madeIn: string
  designedIn: string
  label: string
}) {
  const made = getPassportCountry(madeIn) ?? getPassportCountry('lebanon')!
  const designed = getPassportCountry(designedIn) ?? made
  const samePlace = made.key === designed.key

  const madePt = projectEquirect(made.lat, made.lng, W, H)
  const designedPt = projectEquirect(designed.lat, designed.lng, W, H)
  // Champagne arc between the two pins, lifted toward the top of the map.
  const midX = (madePt.x + designedPt.x) / 2
  const dist = Math.hypot(madePt.x - designedPt.x, madePt.y - designedPt.y)
  const midY = Math.min(madePt.y, designedPt.y) - Math.max(10, dist * 0.28)

  // The svg's viewBox letterboxes (preserveAspectRatio "meet"), so capping its
  // height makes the map fit its panel instead of forcing a scroll.
  return (
    <figure className="mx-auto w-full max-w-2xl">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          samePlace
            ? `World map — designed and made in ${made.label}`
            : `World map — designed in ${designed.label}, made in ${made.label}`
        }
        className="h-auto max-h-[34vh] w-full"
      >
        {LANDMASSES.map((poly, i) => (
          <polygon
            key={i}
            points={polyPoints(poly)}
            fill="color-mix(in oklab, var(--color-surface-elevated) 78%, var(--color-highlight))"
            stroke="var(--color-line)"
            strokeWidth="0.6"
            strokeLinejoin="round"
            opacity="0.85"
          />
        ))}

        {!samePlace ? (
          <path
            d={`M ${designedPt.x} ${designedPt.y} Q ${midX} ${midY} ${madePt.x} ${madePt.y}`}
            fill="none"
            stroke="var(--color-highlight)"
            strokeWidth="1"
            strokeDasharray="3 2.5"
            opacity="0.9"
          />
        ) : null}

        {/* Designed-in — outline pin. */}
        {!samePlace ? (
          <g>
            <circle
              cx={designedPt.x}
              cy={designedPt.y}
              r="3.4"
              fill="var(--color-bg)"
              stroke="var(--color-highlight-bright)"
              strokeWidth="1.4"
            />
            <circle cx={designedPt.x} cy={designedPt.y} r="1" fill="var(--color-highlight-bright)" />
          </g>
        ) : null}

        {/* Made-in — filled, pulsing pin. */}
        <g>
          <circle cx={madePt.x} cy={madePt.y} r="3.6" fill="var(--color-highlight-bright)" />
          <circle
            cx={madePt.x}
            cy={madePt.y}
            r="3.6"
            fill="none"
            stroke="var(--color-highlight)"
            strokeWidth="1.2"
            className="animate-ping motion-reduce:hidden"
            style={{ transformOrigin: `${madePt.x}px ${madePt.y}px` }}
          />
        </g>
      </svg>

      <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
        <span className="anvl-micro text-[var(--color-text-muted)]">{label}</span>
        {samePlace ? (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text)]">
            <PinDot filled /> Designed &amp; made in{' '}
            <span className="font-semibold text-[var(--color-heading)]">{made.label}</span>
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text)]">
              <PinDot /> Designed in{' '}
              <span className="font-semibold text-[var(--color-heading)]">{designed.label}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text)]">
              <PinDot filled /> Made in{' '}
              <span className="font-semibold text-[var(--color-heading)]">{made.label}</span>
            </span>
          </>
        )}
      </figcaption>
    </figure>
  )
}

function PinDot({ filled = false }: { filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        filled
          ? 'inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-highlight-bright)]'
          : 'inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--color-highlight-bright)]'
      }
    />
  )
}
