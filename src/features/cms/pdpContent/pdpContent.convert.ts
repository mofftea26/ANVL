import type { CareItem } from '@/features/cms/support/supportContent.zod'
import type { PdpDetail, PdpMaterial, PdpProductContent } from './pdpContent.zod'

/**
 * One-way legacy → structured converters used by the admin "Convert to
 * structured" actions in the products editor. Same contract as
 * `supportContent.convert.ts`: conservative and NON-DESTRUCTIVE — they only
 * produce the new fields; callers keep the legacy strings untouched on the
 * stored entry so old blobs keep rendering everywhere.
 */

/** Map legacy free-text PDP care lines to generic structured items. */
export function convertLegacyPdpCare(entry: PdpProductContent): CareItem[] {
  return entry.care
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: `pdp-care-converted-${index}`,
      icon: 'generic' as const,
      name: line,
      value: '',
      note: '',
    }))
}

/**
 * Map the legacy single material headline/note to one structured entry.
 * A `NNN gsm`-style number in the note becomes the structured gsm value.
 */
export function convertLegacyPdpMaterials(entry: PdpProductContent): PdpMaterial[] {
  const name = entry.materialTitle.trim()
  const note = entry.materialNote.trim()
  if (!name && !note) return []
  const gsmMatch = note.match(/(\d{2,4})\s*gsm/i)
  const gsm = gsmMatch ? Number(gsmMatch[1]) : null
  return [
    {
      id: 'pdp-material-converted-0',
      name: name || note,
      percentage: null,
      gsm: gsm !== null && Number.isFinite(gsm) && gsm > 0 ? gsm : null,
      image: '',
    },
  ]
}

/** Map legacy free-text design-detail lines to structured detail cards. */
export function convertLegacyPdpDetails(entry: PdpProductContent): PdpDetail[] {
  return entry.designDetails
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: `pdp-detail-converted-${index}`,
      title: line,
      description: '',
      image: '',
    }))
}
