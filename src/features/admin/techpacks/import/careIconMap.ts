import type { CareIconKey } from '@/features/cms/support/supportContent.zod'

/**
 * Care-label wording → textile care symbol.
 *
 * This mapping gets its own module and its own test because getting it wrong
 * is not a display bug. Showing "tumble dry low" against a garment whose label
 * says DO NOT TUMBLE DRY tells a customer to ruin it, and the symbol carries
 * more authority than the sentence beside it.
 *
 * Two rules follow from that:
 * - **Prohibitions are matched before permissions.** "DO NOT TUMBLE DRY"
 *   contains "TUMBLE DRY", so order is load-bearing, not incidental.
 * - **An unrecognised line gets NO symbol.** It falls through to the legacy
 *   free-text care list, where it still reaches the customer as words. A
 *   guessed icon would look just as authoritative as a correct one.
 */

interface CareRule {
  re: RegExp
  icon: CareIconKey
}

/**
 * Ordered — first match wins. Prohibitions first, then temperature-specific
 * instructions, then general ones.
 */
const CARE_RULES: readonly CareRule[] = [
  // Prohibitions. These MUST precede their permissive counterparts.
  { re: /\bDO\s*NOT\s+(?:MACHINE\s+)?WASH\b/i, icon: 'do-not-wash' },
  { re: /\bDO\s*NOT\s+BLEACH\b/i, icon: 'do-not-bleach' },
  { re: /\bDO\s*NOT\s+TUMBLE\s*DRY\b/i, icon: 'do-not-tumble-dry' },
  { re: /\bDO\s*NOT\s+IRON\b/i, icon: 'do-not-iron' },
  { re: /\bDO\s*NOT\s+DRY\s*CLEAN\b/i, icon: 'do-not-dry-clean' },

  // Washing, most specific first.
  { re: /\bWASH\b[^.]*\bINSIDE\s*OUT\b|\bINSIDE\s*OUT\b[^.]*\bWASH\b/i, icon: 'wash-inside-out' },
  { re: /\bHAND\s*WASH\b/i, icon: 'wash-hand' },
  { re: /\b(?:COOL|COLD)\s*WASH\b|\bWASH\s*(?:COOL|COLD)\b/i, icon: 'wash-cold' },
  { re: /\b(?:GENTLE|DELICATE)\s*(?:WASH|CYCLE)\b/i, icon: 'wash-gentle' },
  { re: /\bWASH\b[^.]*\b30\s*°?\s*C?\b|\b30\s*°?\s*C\b/i, icon: 'wash-30' },
  { re: /\bWASH\b[^.]*\b40\s*°?\s*C?\b|\b40\s*°?\s*C\b/i, icon: 'wash-40' },
  { re: /\bWASH\b[^.]*\b60\s*°?\s*C?\b|\b60\s*°?\s*C\b/i, icon: 'wash-60' },
  { re: /\bWASH\s+DARK\s+COLOU?RS?\s+SEPARATELY\b/i, icon: 'wash' },
  { re: /\bMACHINE\s*WASH\b|\bWASH\b/i, icon: 'wash' },

  // Drying.
  { re: /\bTUMBLE\s*DRY\s*(?:ON\s*)?LOW\b/i, icon: 'tumble-dry-low' },
  { re: /\bTUMBLE\s*DRY\s*(?:ON\s*)?HIGH\b/i, icon: 'tumble-dry-high' },
  { re: /\bTUMBLE\s*DRY\b/i, icon: 'tumble-dry' },
  { re: /\bLINE\s*DRY\b|\bHANG\s*(?:TO\s*)?DRY\b/i, icon: 'line-dry' },
  { re: /\bDRY\s*FLAT\b|\bFLAT\s*DRY\b|\bRESHAPE\b/i, icon: 'dry-flat' },
  { re: /\bDRIP\s*DRY\b/i, icon: 'drip-dry' },

  // Ironing.
  { re: /\b(?:COOL|LOW)\s*IRON\b|\bIRON\s*(?:COOL|LOW)\b/i, icon: 'iron-low' },
  { re: /\b(?:WARM|MEDIUM)\s*IRON\b/i, icon: 'iron-medium' },
  { re: /\b(?:HOT|HIGH)\s*IRON\b/i, icon: 'iron-high' },
  { re: /\bIRON\b/i, icon: 'iron' },

  // Everything else.
  { re: /\bBLEACH\b/i, icon: 'bleach' },
  { re: /\bDRY\s*CLEAN\b/i, icon: 'dry-clean' },
  { re: /\b(?:MILD\s+)?DETERGENT\b/i, icon: 'hand-soap' },
]

/**
 * The symbol for a care line, or null when nothing matches confidently.
 *
 * Null is a real answer, not a failure: the caller keeps the line as plain
 * text rather than attaching a symbol it cannot justify.
 */
export function careIconFor(line: string): CareIconKey | null {
  const text = line.trim()
  if (!text) return null
  for (const { re, icon } of CARE_RULES) {
    if (re.test(text)) return icon
  }
  return null
}

/** Composition lines ("100% COTTON") belong to the material section, not care. */
export function isCompositionLine(line: string): boolean {
  return /^\s*\d{1,3}\s*%/.test(line)
}

/** Sentence-case a shouted care line for display: `DO NOT TUMBLE DRY` → `Do not tumble dry`. */
export function formatCareLine(line: string): string {
  const text = line.trim().replace(/\s+/g, ' ')
  if (!text) return ''
  const lower = text.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
