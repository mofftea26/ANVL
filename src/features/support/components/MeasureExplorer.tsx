import { useId, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { GarmentTypeKey } from '@/features/cms/support/supportContent.zod'
import type { ResolvedSizeMeasure } from '@/features/cms/support/resolveSupportContent'
import { GarmentTypeTabs, garmentPanelId, garmentTabId } from './GarmentTypeTabs'
import { MeasurementFigure } from './MeasurementFigure'

/**
 * "Where we measure", switchable by garment type: the silhouette strip over the
 * schematic and its written companion.
 *
 * Only the selected panel is mounted, and it is keyed on the garment type, so
 * every switch is a fresh mount. That is deliberate: the schematic's draw-in is
 * a ScrollTrigger, and a panel kept in the tree at `display: none` would be
 * measured at zero height. Remounting also replays the drawing on each switch,
 * which is the intended effect.
 *
 * With a single garment type there is nothing to switch between, so the strip is
 * omitted and the figure stands alone.
 */
export function MeasureExplorer({
  measures,
  labelledBy,
  className,
}: {
  /** One entry per garment type to offer, in display order. Never empty. */
  measures: readonly ResolvedSizeMeasure[]
  /** Id of the section heading, so the strip inherits its name. */
  labelledBy?: string
  className?: string
}) {
  const idPrefix = useId()
  const [activeKey, setActiveKey] = useState<GarmentTypeKey>(
    () => measures[0]?.garmentTypeKey ?? 'tee',
  )

  const active = measures.find((m) => m.garmentTypeKey === activeKey) ?? measures[0]
  if (!active) return null

  const showTabs = measures.length > 1

  return (
    <div className={cn('space-y-8', className)}>
      {showTabs ? (
        <GarmentTypeTabs
          items={measures.map((measure) => ({
            key: measure.garmentTypeKey,
            label: measure.garmentTypeLabel,
            pointCount: measure.points.length,
          }))}
          activeKey={active.garmentTypeKey}
          onSelect={setActiveKey}
          idPrefix={idPrefix}
          labelledBy={labelledBy}
        />
      ) : null}

      <div
        key={active.garmentTypeKey}
        {...(showTabs
          ? {
              id: garmentPanelId(idPrefix),
              role: 'tabpanel' as const,
              'aria-labelledby': garmentTabId(idPrefix, active.garmentTypeKey),
            }
          : {})}
      >
        <MeasurementFigure
          garmentTypeKey={active.garmentTypeKey}
          garmentTypeLabel={active.garmentTypeLabel}
          points={active.points}
          footnote={active.footnote}
        />
      </div>
    </div>
  )
}
