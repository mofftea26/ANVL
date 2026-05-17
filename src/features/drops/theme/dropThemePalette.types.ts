/**
 * Public drop campaign palette — shared by CMS theme serialization and `Drop` documents.
 * Lives outside `features/admin/**` so storefront code can depend on it without admin imports.
 */
export type DropThemePalette = {
  id: string
  name: string
  colors: {
    background: string
    surface: string
    surfaceSoft: string
    heading: string
    text: string
    mutedText: string
    line: string
    accent: string
    accentSoft: string
    heroGlow: string
    danger?: string
    success?: string
  }
}
