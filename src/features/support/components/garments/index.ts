export type {
  GarmentAnchor,
  GarmentSchematic,
  SchematicPoint,
  SchematicViewBox,
} from './types'
export {
  GARMENT_OUTLINE_VIEW_BOXES,
  GARMENT_SCHEMATICS,
  anchorBadgePoint,
  getGarmentOutlineViewBox,
  getGarmentSchematic,
  isGarmentTypeKey,
} from './registry'
export { computeOutlineViewBox } from './outlineBounds'
