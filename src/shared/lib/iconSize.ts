/** Canonical icon pixel sizes (Phosphor duotone reads best a touch larger
 *  than the old lucide strokes). Pick the bucket, not a raw number. */
export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
} as const

export type IconSizeToken = keyof typeof ICON_SIZE
