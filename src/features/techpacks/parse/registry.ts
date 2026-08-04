import { parseBasicSpecs } from './pages/basicSpecs'
import { parseColorwaySchedule } from './pages/colorwaySchedule'
import { parsePackaging } from './pages/packaging'
import {
  parseBrandingElements,
  parseColorSwatches,
  parsePatternPrints,
  parseSeamlessKnits,
  parseTrims,
} from './pages/reference'
import { parseSizingGuide } from './pages/sizingGuide'
import { parseTechnicalSheet } from './pages/technicalSheet'
import type { PageParser } from './parserContext'
import type { TechpackPageKind } from '../schema/techpack.zod'

/**
 * Page kind → parser.
 *
 * Registering rather than switching keeps each page independent: a kind with
 * no entry is simply skipped, and `buildDocument` isolates faults per page so
 * one parser throwing cannot take the document down with it. Adding support
 * for a new page kind is one entry here plus one file.
 */
export const PAGE_PARSERS: Partial<Record<TechpackPageKind, PageParser>> = {
  'colorway-schedule': parseColorwaySchedule,
  'sizing-guide': parseSizingGuide,
  'technical-sheet': parseTechnicalSheet,
  'basic-specs': parseBasicSpecs,
  'branding-elements': parseBrandingElements,
  'trims-and-notions': parseTrims,
  'pattern-prints': parsePatternPrints,
  'seamless-knits': parseSeamlessKnits,
  'color-swatches': parseColorSwatches,
  'packaging-and-labels': parsePackaging,
}
