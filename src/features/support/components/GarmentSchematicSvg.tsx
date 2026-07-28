import { useId } from 'react'
import { cn } from '@/shared/lib/cn'
import type { SizeTableRowKey } from '@/features/cms/support/supportContent.zod'
import type { ResolvedMeasurePoint } from '@/features/cms/support/resolveSupportContent'
import { anchorBadgePoint } from './garments'
import type { GarmentAnchor, GarmentSchematic } from './garments'

/**
 * The technical drawing itself — a cutting-room spec sheet, not a clipart tee.
 *
 * Layer order is the stroke hierarchy: a faded blueprint grid sits behind a
 * brushed-plate silhouette; construction seams are lighter than the outline;
 * dimension lines are lighter still and carry oblique tick caps in the
 * drafting convention. Letter badges are filled discs so they stay legible
 * over any fill in any theme.
 *
 * Every colour is a `--color-*` token. Every `<defs>` id is namespaced with
 * `useId()` — the PDP renders a second instance of this drawing next to the
 * guide, and shared def ids silently cross-wire between the two.
 */

const GRID_STEP = 28
const BADGE_RADIUS = 13
const BADGE_RADIUS_ACTIVE = 15

export interface GarmentSchematicSvgProps {
  schematic: GarmentSchematic
  /** Resolved points, in list order. Points with no anchor draw nothing. */
  points: readonly ResolvedMeasurePoint[]
  /** The measurement currently lit up, or null. */
  activeKey?: SizeTableRowKey | null
  /**
   * Enables pointer hotspots over each dimension line. Called with the key on
   * enter and `null` on leave. Omit for a static drawing.
   */
  onHoverKey?: (key: SizeTableRowKey | null) => void
  /**
   * When set, the drawing is exposed to assistive tech as an image with this
   * label. Omit and it is `aria-hidden` — the correct choice whenever a
   * written measurement list sits beside it.
   */
  ariaLabel?: string
  className?: string
}

export function GarmentSchematicSvg({
  schematic,
  points,
  activeKey = null,
  onHoverKey,
  ariaLabel,
  className,
}: GarmentSchematicSvgProps) {
  const uid = useId().replace(/:/g, '')
  const gridId = `anvl-grid-${uid}`
  const fadeId = `anvl-fade-${uid}`
  const maskId = `anvl-mask-${uid}`
  const plateId = `anvl-plate-${uid}`
  const tickId = `anvl-tick-${uid}`
  const tickActiveId = `anvl-tick-on-${uid}`

  const { x, y, width, height } = schematic.viewBox
  const drawn = points.flatMap((point) => {
    const anchor = schematic.anchors[point.key]
    return anchor ? [{ point, anchor }] : []
  })

  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn('h-auto w-full', className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    >
      <defs>
        <pattern id={gridId} width={GRID_STEP} height={GRID_STEP} patternUnits="userSpaceOnUse">
          <path
            d={`M${GRID_STEP} 0 H0 V${GRID_STEP}`}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        </pattern>
        {/* Mask stops are luminance values, not theme colours. */}
        <radialGradient id={fadeId} cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="white" stopOpacity={0.85} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </radialGradient>
        <mask id={maskId}>
          <rect x={x} y={y} width={width} height={height} fill={`url(#${fadeId})`} />
        </mask>
        <linearGradient id={plateId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-surface-elevated)" />
          <stop offset="100%" stopColor="var(--color-surface)" />
        </linearGradient>
        <TickMarker id={tickId} stroke="var(--color-text-muted)" />
        <TickMarker id={tickActiveId} stroke="var(--color-highlight-bright)" />
      </defs>

      {/* Blueprint ghost grid, faded out toward the drawing bounds. */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${gridId})`}
        mask={`url(#${maskId})`}
      />

      {/* Brushed-plate silhouette. */}
      <path d={schematic.outline} fill={`url(#${plateId})`} fillOpacity={0.92} stroke="none" />

      {/* Construction seams — lighter than the outline. */}
      <g stroke="var(--color-text-muted)" strokeWidth={1.2} opacity={0.55}>
        {schematic.detail.map((d) => (
          <path key={d} d={d} data-draw="detail" />
        ))}
      </g>

      {/* Garment outline — the heaviest stroke on the page. */}
      <path
        d={schematic.outline}
        stroke="var(--color-text)"
        strokeWidth={2.4}
        data-draw="outline"
      />

      {drawn.map(({ point, anchor }) => (
        <DimensionGroup
          key={point.key}
          anchor={anchor}
          letter={point.letter}
          measureKey={point.key}
          active={activeKey === point.key}
          tickId={activeKey === point.key ? tickActiveId : tickId}
          onHoverKey={onHoverKey}
        />
      ))}
    </svg>
  )
}

function TickMarker({ id, stroke }: { id: string; stroke: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="9"
      markerHeight="9"
      orient="auto"
    >
      <path d="M2.5 8 L7.5 2" fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </marker>
  )
}

function DimensionGroup({
  anchor,
  letter,
  measureKey,
  active,
  tickId,
  onHoverKey,
}: {
  anchor: GarmentAnchor
  letter: string
  measureKey: SizeTableRowKey
  active: boolean
  tickId: string
  onHoverKey?: (key: SizeTableRowKey | null) => void
}) {
  const badge = anchorBadgePoint(anchor)
  const lineColor = active ? 'var(--color-highlight-bright)' : 'var(--color-text-muted)'
  const radius = active ? BADGE_RADIUS_ACTIVE : BADGE_RADIUS

  return (
    <g
      data-measure-key={measureKey}
      data-active={active ? 'true' : undefined}
      {...(onHoverKey
        ? {
            onPointerEnter: () => onHoverKey(measureKey),
            onPointerLeave: () => onHoverKey(null),
            style: { cursor: 'pointer' },
          }
        : null)}
    >
      {/* Witness leaders — the lightest weight in the drawing. */}
      <g stroke={lineColor} strokeWidth={1} opacity={active ? 0.75 : 0.4}>
        {(anchor.witness ?? []).map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} data-draw="witness" />
        ))}
      </g>

      {/* The dimension line, tick-capped at both ends. */}
      <line
        x1={anchor.from.x}
        y1={anchor.from.y}
        x2={anchor.to.x}
        y2={anchor.to.y}
        stroke={lineColor}
        strokeWidth={active ? 2.6 : 1.5}
        markerStart={`url(#${tickId})`}
        markerEnd={`url(#${tickId})`}
        data-draw="dimension"
      />

      {/* Letter badge — a filled disc, stamped over the line. */}
      <g data-badge={measureKey}>
        <circle
          cx={badge.x}
          cy={badge.y}
          r={radius}
          fill={active ? 'var(--color-highlight-bright)' : 'var(--color-surface-elevated)'}
          stroke={active ? 'var(--color-highlight-bright)' : 'var(--color-line)'}
          strokeWidth={1.5}
        />
        <text
          x={badge.x}
          y={badge.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fill={active ? 'var(--color-on-highlight-bright)' : 'var(--color-text)'}
          stroke="none"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}
        >
          {letter}
        </text>
      </g>

      {/* Fat invisible hit target so the thin line is still hoverable. */}
      {onHoverKey ? (
        <line
          x1={anchor.from.x}
          y1={anchor.from.y}
          x2={anchor.to.x}
          y2={anchor.to.y}
          stroke="transparent"
          strokeWidth={26}
          pointerEvents="stroke"
        />
      ) : null}
    </g>
  )
}
