import type { ComponentType, ReactNode } from 'react'
import type { CareIconKey } from '@/features/cms/support/supportContent.zod'

/**
 * The standard garment-care marks, drawn as inline SVG in the brand's text
 * colour (`currentColor` — no icon font, no images). These are the REAL textile
 * care symbols (wash tub, bleach triangle, tumble-dry square-in-square, iron,
 * dry-clean circle) rather than generic pictograms, so the CMS care picker, the
 * PDP bento, the support care guide, and the passport all speak the same
 * recognisable visual language.
 *
 * Each symbol is a `CareGlyphComponent`: it accepts the same `size` /
 * `className` / `aria-hidden` props Phosphor icons do, so it drops into the
 * shared `CARE_ICON_COMPONENTS` map that every care surface renders from. The
 * glyph itself is always decorative — the instruction NAME carries the meaning
 * for assistive tech (see `CARE_SYMBOL_META` for the plain-language copy).
 */

export interface CareGlyphProps {
  size?: number | string
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

export type CareGlyphComponent = ComponentType<CareGlyphProps>

function CareSvg({
  size = 24,
  className,
  children,
  ...rest
}: CareGlyphProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  )
}

/* --------------------------------------------------------------------------- *
 * Shared primitives — the outline each family is built from.
 * --------------------------------------------------------------------------- */
const Tub = () => <path d="M3 9 L5 6 H19 L21 9 V17 A2 2 0 0 1 19 19 H5 A2 2 0 0 1 3 17 Z" />
const Triangle = () => <path d="M12 4 L21 20 H3 Z" />
const Square = () => <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
const IronBody = () => <path d="M3 17 H21 L18 9 H8 Z" />
const DryCircle = () => <circle cx="12" cy="12" r="8.5" />
/** ISO "do not" mark — a cross drawn across the whole symbol. */
const NoMark = () => <path d="M4.5 4.5 L19.5 19.5 M19.5 4.5 L4.5 19.5" />

function Dot({ cx, cy = 13 }: { cx: number; cy?: number }) {
  return <circle cx={cx} cy={cy} r="1.15" fill="currentColor" stroke="none" />
}

/* --------------------------------------------------------------------------- *
 * Wash family — the tub.
 * --------------------------------------------------------------------------- */
export const WashSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Tub />
  </CareSvg>
)

/** Machine wash at a set temperature — the number inside the tub. */
function makeWashTemp(label: string): CareGlyphComponent {
  return (p) => (
    <CareSvg {...p}>
      <Tub />
      <text
        x="12"
        y="15.6"
        textAnchor="middle"
        fontSize="7"
        fontWeight="600"
        fill="currentColor"
        stroke="none"
      >
        {label}
      </text>
    </CareSvg>
  )
}
export const Wash30Symbol = makeWashTemp('30')
export const Wash40Symbol = makeWashTemp('40')
export const Wash50Symbol = makeWashTemp('50')
export const Wash60Symbol = makeWashTemp('60')

export const WashColdSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Tub />
    <Dot cx={12} />
  </CareSvg>
)

export const WashGentleSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Tub />
    <path d="M5 21.2 H19" />
  </CareSvg>
)

export const WashHandSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Tub />
    <path d="M8 13 q2 -2 4 0 q2 2 4 0" />
  </CareSvg>
)

export const WashInsideOutSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <path d="M8 8 L16 16 M8 16 L16 8" />
  </CareSvg>
)

export const DoNotWashSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Tub />
    <NoMark />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Bleach family — the triangle.
 * --------------------------------------------------------------------------- */
export const BleachSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Triangle />
  </CareSvg>
)

export const DoNotBleachSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Triangle />
    <NoMark />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Tumble-dry family — a circle inside the square.
 * --------------------------------------------------------------------------- */
export const TumbleDrySymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <circle cx="12" cy="12" r="5" />
  </CareSvg>
)

export const TumbleDryLowSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <circle cx="12" cy="12" r="5" />
    <Dot cx={12} cy={12} />
  </CareSvg>
)

export const TumbleDryHighSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <circle cx="12" cy="12" r="5" />
    <Dot cx={10} cy={12} />
    <Dot cx={14} cy={12} />
  </CareSvg>
)

export const DoNotTumbleDrySymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <circle cx="12" cy="12" r="5" />
    <NoMark />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Natural-dry family — the square with drying hints.
 * --------------------------------------------------------------------------- */
export const LineDrySymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <path d="M12 4.5 V19.5" />
  </CareSvg>
)

export const DryFlatSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <path d="M3.5 12 H20.5" />
  </CareSvg>
)

export const DripDrySymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <Square />
    <path d="M8 4.5 V19.5 M12 4.5 V19.5 M16 4.5 V19.5" />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Iron family — the iron, dots for heat.
 * --------------------------------------------------------------------------- */
export const IronSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <IronBody />
  </CareSvg>
)

export const IronLowSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <IronBody />
    <Dot cx={12} cy={13.5} />
  </CareSvg>
)

export const IronMediumSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <IronBody />
    <Dot cx={10} cy={13.5} />
    <Dot cx={14} cy={13.5} />
  </CareSvg>
)

export const IronHighSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <IronBody />
    <Dot cx={9} cy={13.5} />
    <Dot cx={12} cy={13.5} />
    <Dot cx={15} cy={13.5} />
  </CareSvg>
)

export const DoNotIronSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <IronBody />
    <NoMark />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Dry-clean family — the circle.
 * --------------------------------------------------------------------------- */
export const DryCleanSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <DryCircle />
  </CareSvg>
)

export const DoNotDryCleanSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <DryCircle />
    <NoMark />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * Generic marks — a plain prohibition ring and a neutral care tag, used as the
 * fall-through glyph for custom / legacy instructions.
 * --------------------------------------------------------------------------- */
export const ProhibitSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M6 6 L18 18" />
  </CareSvg>
)

export const GenericCareSymbol: CareGlyphComponent = (p) => (
  <CareSvg {...p}>
    <circle cx="12" cy="12" r="8" />
    <Dot cx={12} cy={12} />
  </CareSvg>
)

/* --------------------------------------------------------------------------- *
 * The keyed registry — every {@link CareIconKey} maps to a real symbol. Legacy
 * decorative keys resolve to the nearest true care mark so old stored care
 * items upgrade to real symbols without any data migration.
 * --------------------------------------------------------------------------- */
export const CARE_SYMBOL_COMPONENTS: Record<CareIconKey, CareGlyphComponent> = {
  // New standard care-symbol vocabulary.
  wash: WashSymbol,
  'wash-30': Wash30Symbol,
  'wash-40': Wash40Symbol,
  'wash-50': Wash50Symbol,
  'wash-60': Wash60Symbol,
  'wash-cold': WashColdSymbol,
  'wash-gentle': WashGentleSymbol,
  'wash-hand': WashHandSymbol,
  'wash-inside-out': WashInsideOutSymbol,
  'do-not-wash': DoNotWashSymbol,
  bleach: BleachSymbol,
  'do-not-bleach': DoNotBleachSymbol,
  'tumble-dry': TumbleDrySymbol,
  'tumble-dry-low': TumbleDryLowSymbol,
  'tumble-dry-high': TumbleDryHighSymbol,
  'do-not-tumble-dry': DoNotTumbleDrySymbol,
  'line-dry': LineDrySymbol,
  'dry-flat': DryFlatSymbol,
  'drip-dry': DripDrySymbol,
  iron: IronSymbol,
  'iron-low': IronLowSymbol,
  'iron-medium': IronMediumSymbol,
  'iron-high': IronHighSymbol,
  'do-not-iron': DoNotIronSymbol,
  'dry-clean': DryCleanSymbol,
  'do-not-dry-clean': DoNotDryCleanSymbol,
  // Legacy keys (kept forever) → nearest real symbol.
  'washing-machine': WashSymbol,
  'hand-soap': WashHandSymbol,
  droplet: WashSymbol,
  snowflake: WashColdSymbol,
  thermometer: IronSymbol,
  sun: LineDrySymbol,
  wind: TumbleDrySymbol,
  flame: IronHighSymbol,
  prohibit: ProhibitSymbol,
  'spray-bottle': ProhibitSymbol,
  'coat-hanger': LineDrySymbol,
  sparkle: DryCleanSymbol,
  shirt: WashInsideOutSymbol,
  generic: GenericCareSymbol,
}

/**
 * ISO-grouped legend categories — the five families the Care guide's symbol
 * legend renders under. Code-owned: membership is fixed and NOT
 * CMS-editable (only each symbol's `label`/`meaning`, via `CARE_SYMBOL_META`
 * defaults + `resolveCareLegend` overrides, are). Exactly the 26 distinct
 * symbols — the 14 legacy alias keys in {@link CARE_SYMBOL_COMPONENTS} are
 * never legend members.
 */
export interface CareSymbolCategory {
  id: string
  label: string
  keys: readonly CareIconKey[]
}

export const CARE_SYMBOL_CATEGORIES: readonly CareSymbolCategory[] = [
  {
    id: 'washing',
    label: 'Washing',
    keys: [
      'wash',
      'wash-30',
      'wash-40',
      'wash-50',
      'wash-60',
      'wash-cold',
      'wash-gentle',
      'wash-hand',
      'wash-inside-out',
      'do-not-wash',
    ],
  },
  {
    id: 'bleaching',
    label: 'Bleaching',
    keys: ['bleach', 'do-not-bleach'],
  },
  {
    id: 'drying',
    label: 'Drying',
    keys: [
      'tumble-dry',
      'tumble-dry-low',
      'tumble-dry-high',
      'do-not-tumble-dry',
      'line-dry',
      'dry-flat',
      'drip-dry',
    ],
  },
  {
    id: 'ironing',
    label: 'Ironing',
    keys: ['iron', 'iron-low', 'iron-medium', 'iron-high', 'do-not-iron'],
  },
  {
    id: 'professional-care',
    label: 'Professional care',
    keys: ['dry-clean', 'do-not-dry-clean'],
  },
] as const

/**
 * Plain-language meaning for the standard symbols — surfaced as the caption
 * under the picker preview and the "what it means" line in the passport care
 * ritual. Legacy/decorative keys have no entry (their instruction text stands
 * on its own).
 */
export const CARE_SYMBOL_META: Partial<Record<CareIconKey, { label: string; meaning: string }>> = {
  wash: { label: 'Machine wash', meaning: 'Machine wash on a normal cycle.' },
  'wash-30': { label: 'Wash at 30°C', meaning: 'Machine wash at 30°C or below.' },
  'wash-40': { label: 'Wash at 40°C', meaning: 'Machine wash at 40°C or below.' },
  'wash-50': { label: 'Wash at 50°C', meaning: 'Machine wash at 50°C or below.' },
  'wash-60': { label: 'Wash at 60°C', meaning: 'Machine wash at 60°C or below.' },
  'wash-cold': { label: 'Cold wash', meaning: 'Machine wash cold — heat kills compression and print.' },
  'wash-gentle': { label: 'Gentle cycle', meaning: 'Use the delicate cycle — reduced agitation and spin.' },
  'wash-hand': { label: 'Hand wash', meaning: 'Hand wash only — no machine.' },
  'wash-inside-out': { label: 'Wash inside out', meaning: 'Turn inside out to protect the print and face yarn.' },
  'do-not-wash': { label: 'Do not wash', meaning: 'Do not wash — clean by another method.' },
  bleach: { label: 'Bleach allowed', meaning: 'Bleach may be used when needed.' },
  'do-not-bleach': { label: 'Do not bleach', meaning: 'No bleach of any kind — it destroys elastane.' },
  'tumble-dry': { label: 'Tumble dry', meaning: 'Tumble drying is allowed.' },
  'tumble-dry-low': { label: 'Tumble dry low', meaning: 'Tumble dry on low heat only.' },
  'tumble-dry-high': { label: 'Tumble dry high', meaning: 'Tumble dry on high heat is fine.' },
  'do-not-tumble-dry': { label: 'Do not tumble dry', meaning: 'No dryer — tumble heat relaxes the knit.' },
  'line-dry': { label: 'Line dry', meaning: 'Hang to dry, out of direct sun.' },
  'dry-flat': { label: 'Dry flat', meaning: 'Dry flat so the piece keeps its shape.' },
  'drip-dry': { label: 'Drip dry', meaning: 'Hang dripping wet and let it drip dry.' },
  iron: { label: 'Iron', meaning: 'Ironing is allowed.' },
  'iron-low': { label: 'Iron low', meaning: 'Iron on the lowest setting, inside out.' },
  'iron-medium': { label: 'Iron medium', meaning: 'Iron on a medium setting.' },
  'iron-high': { label: 'Iron high', meaning: 'Iron on a high setting.' },
  'do-not-iron': { label: 'Do not iron', meaning: 'Never iron — direct heat melts performance fibre.' },
  'dry-clean': { label: 'Dry clean', meaning: 'Professional dry cleaning is allowed.' },
  'do-not-dry-clean': { label: 'Do not dry clean', meaning: 'No dry cleaning — the solvents attack the fibre.' },
}
