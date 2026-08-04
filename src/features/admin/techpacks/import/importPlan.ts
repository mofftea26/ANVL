import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'

import {
  buildProposal,
  type ImportDrafts,
  type ImportFieldProposal,
  type ImportTarget,
} from './importProposal'
import {
  legacySizeTable,
  namedCareItems,
  namedMaterials,
  pdpLegacyCareLines,
  pdpLegacyMaterialCopy,
  pdpRenderedCareText,
  pdpRenderedDetailText,
  structuredSizeTable,
} from './renderedCurrent'
import {
  resolveGarmentType,
  techpackToFitMeasurements,
  techpackToSizeEquivalence,
  techpackToSizeTable,
} from './techpackToSizeGuide'
import {
  techpackToBlueprintFeatures,
  techpackToCareItems,
  techpackToCareSteps,
  techpackToColorwayFacts,
  techpackToConstruction,
  techpackToFitType,
  techpackToMaterialNote,
  techpackToMaterials,
  techpackToOriginLabel,
} from './techpackToPassport'

/**
 * The import plan: which fields a parsed techpack can offer a product, what it
 * would write into each, and what is on the page there today.
 *
 * The judgement about a single field — the disclosure gate, the strip gate,
 * and the empty/differs/same verdict that decides what an unattended import
 * may touch — lives in `importProposal.ts`. This file is the map.
 *
 * Two declarations carry the safety story, and both are easy to forget:
 * - `sourcePaths` — the techpack fields the mapper read. Required, because the
 *   disclosure gate can only check what a proposal admits to reading.
 * - `renderedBy` — the other sources the storefront falls back to when this
 *   field's own key is unset (see `renderedCurrent.ts`). Without it, an
 *   authored legacy value looks like a blank and gets filled over in silence.
 */

export type { ImportDrafts, ImportFieldProposal, ImportTarget } from './importProposal'

/**
 * The techpack fields each mapper reads.
 *
 * Leaf-level on purpose: `technical.seams.*.text` is disclosable while
 * `technical.seams.*.supplierRef` is not, so a mapper that starts reading the
 * second must not be waved through because it declared the parent.
 */
const SOURCE = {
  fabric: ['header.fabric.composition', 'header.fabric.gsm'],
  fabricConstruction: ['header.fabric.construction'],
  productName: ['header.product'],
  seams: ['technical.seams.*.text', 'technical.seams.*.spi'],
  blueprintFeatures: [
    'blueprint.*.features.*.code',
    'blueprint.*.features.*.label',
    'blueprint.*.features.*.detail',
  ],
  careLabelLines: ['packaging.careLabel.lines'],
  careLabelOrigin: ['packaging.careLabel.origin'],
  colorwayRoles: [
    'colorways.*.roles.*.colorName',
    'colorways.*.roles.*.pantone',
    'colorways.*.roles.*.coloro',
  ],
  sizing: ['sizing.unit', 'sizing.sizes', 'sizing.rows.*.rowKey', 'sizing.rows.*.values'],
} as const

export interface BuildImportPlanInput {
  doc: TechpackDocument
  drafts: ImportDrafts
}

export function buildImportPlan(input: BuildImportPlanInput): ImportFieldProposal[] {
  const { doc, drafts } = input
  const { passport, pdp } = drafts

  const blueprintPage = doc.blueprint[0]?.page ?? 0
  const sizingPage = doc.pages.find((p) => p.kind === 'sizing-guide')?.page ?? 0
  const packagingPage = doc.pages.find((p) => p.kind === 'packaging-and-labels')?.page ?? 0
  const technicalPage = doc.pages.find((p) => p.kind === 'technical-sheet')?.page ?? 0

  const materials = techpackToMaterials(doc)
  const careSteps = techpackToCareSteps(doc)
  const { items: careItems } = techpackToCareItems(doc)
  const blueprintFeatures = techpackToBlueprintFeatures(doc)

  const out: Array<ImportFieldProposal | null> = [
    /* ----------------------------- passport ----------------------------- */
    buildProposal({
      id: 'passport.material.materials',
      target: 'passport',
      path: 'material.materials',
      label: 'Composition cards',
      sourcePaths: SOURCE.fabric,
      next: materials,
      current: namedMaterials(passport.material.materials),
      // The passport falls back to the PDP's cards, and the PDP itself falls
      // back to its legacy headline — so both can be live here.
      renderedBy: [namedMaterials(pdp.materials), pdpLegacyMaterialCopy(pdp)],
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, material: { ...d.passport.material, materials } },
      }),
    }),
    buildProposal({
      id: 'passport.material.note',
      target: 'passport',
      path: 'material.note',
      label: 'Material note',
      sourcePaths: SOURCE.fabricConstruction,
      next: techpackToMaterialNote(doc),
      current: passport.material.note,
      renderedBy: [pdp.materialNote],
      apply: (d) => ({
        ...d,
        passport: {
          ...d.passport,
          material: { ...d.passport.material, note: techpackToMaterialNote(doc) },
        },
      }),
    }),
    buildProposal({
      id: 'passport.specs.construction',
      target: 'passport',
      path: 'specs.construction',
      label: 'Construction',
      sourcePaths: SOURCE.seams,
      sourcePage: technicalPage,
      next: techpackToConstruction(doc),
      current: passport.specs.construction,
      apply: (d) => ({
        ...d,
        passport: {
          ...d.passport,
          specs: { ...d.passport.specs, construction: techpackToConstruction(doc) },
        },
      }),
    }),
    buildProposal({
      id: 'passport.specs.fitType',
      target: 'passport',
      path: 'specs.fitType',
      label: 'Fit type',
      sourcePaths: SOURCE.productName,
      next: techpackToFitType(doc),
      current: passport.specs.fitType,
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, specs: { ...d.passport.specs, fitType: techpackToFitType(doc) } },
      }),
    }),
    buildProposal({
      id: 'passport.blueprint.features',
      target: 'passport',
      path: 'blueprint.features',
      label: 'Blueprint callouts',
      sourcePaths: SOURCE.blueprintFeatures,
      sourcePage: blueprintPage,
      next: blueprintFeatures,
      current: passport.blueprint.features,
      apply: (d) => ({
        ...d,
        passport: {
          ...d.passport,
          blueprint: { ...d.passport.blueprint, features: blueprintFeatures },
        },
      }),
    }),
    buildProposal({
      id: 'passport.care.steps',
      target: 'passport',
      path: 'care.steps',
      label: 'Care steps',
      sourcePaths: SOURCE.careLabelLines,
      sourcePage: packagingPage,
      next: careSteps,
      current: passport.care.steps,
      // The passport prints the PDP's care copy when it has none of its own.
      renderedBy: [pdpRenderedCareText(pdp)],
      blocked:
        doc.packaging && !doc.packaging.careLabel.textAvailable
          ? 'The care label on this pack is artwork only — its wording has to be read from the image or typed in.'
          : null,
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, care: { ...d.passport.care, steps: careSteps } },
      }),
    }),
    buildProposal({
      id: 'passport.care.careItems',
      target: 'passport',
      path: 'care.careItems',
      label: 'Care symbols',
      sourcePaths: SOURCE.careLabelLines,
      sourcePage: packagingPage,
      next: careItems,
      current: namedCareItems(passport.care.careItems),
      renderedBy: [namedCareItems(pdp.careItems), pdpLegacyCareLines(pdp)],
      blocked:
        doc.packaging && !doc.packaging.careLabel.textAvailable
          ? 'The care label on this pack is artwork only — its wording has to be read from the image or typed in.'
          : null,
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, care: { ...d.passport.care, careItems } },
      }),
    }),
    buildProposal({
      id: 'passport.details.facts',
      target: 'passport',
      path: 'details.facts',
      label: 'Colourway facts',
      sourcePaths: SOURCE.colorwayRoles,
      next: techpackToColorwayFacts(doc),
      current: passport.details.facts,
      renderedBy: [pdpRenderedDetailText(pdp)],
      apply: (d) => ({
        ...d,
        passport: {
          ...d.passport,
          details: { ...d.passport.details, facts: techpackToColorwayFacts(doc) },
        },
      }),
    }),
    buildProposal({
      id: 'passport.origin.label',
      target: 'passport',
      path: 'origin.label',
      label: 'Origin label',
      sourcePaths: SOURCE.careLabelOrigin,
      sourcePage: packagingPage,
      next: techpackToOriginLabel(doc),
      // No `renderedBy`: the resolver's only fallback here is the hardcoded
      // "Forged in Lebanon". Filling over a CODE default is the feature — the
      // rule protects copy a human wrote, not our own placeholder.
      current: passport.origin.label,
      apply: (d) => ({
        ...d,
        passport: {
          ...d.passport,
          origin: { ...d.passport.origin, label: techpackToOriginLabel(doc) },
        },
      }),
    }),
    ...buildSizingProposals(doc, drafts, sizingPage),

    /* -------------------------------- pdp ------------------------------- */
    buildProposal({
      id: 'pdp.materials',
      target: 'pdp',
      path: 'materials',
      label: 'Composition cards',
      sourcePaths: SOURCE.fabric,
      next: materials,
      current: namedMaterials(pdp.materials),
      // `resolvePdpContent` renders the legacy headline as a card when no
      // structured card is authored, so that headline is live copy.
      renderedBy: [pdpLegacyMaterialCopy(pdp)],
      apply: (d) => ({ ...d, pdp: { ...d.pdp, materials } }),
    }),
    buildProposal({
      id: 'pdp.careItems',
      target: 'pdp',
      path: 'careItems',
      label: 'Care symbols',
      sourcePaths: SOURCE.careLabelLines,
      sourcePage: packagingPage,
      next: careItems,
      current: namedCareItems(pdp.careItems),
      renderedBy: [pdpLegacyCareLines(pdp)],
      apply: (d) => ({ ...d, pdp: { ...d.pdp, careItems } }),
    }),
  ]

  return out.filter((entry): entry is ImportFieldProposal => entry !== null)
}

/** Sizing-derived proposals, split out to keep the builder readable. */
function buildSizingProposals(
  doc: TechpackDocument,
  drafts: ImportDrafts,
  sizingPage: number,
): Array<ImportFieldProposal | null> {
  if (!doc.sizing) return []

  const sizing = doc.sizing
  const { table, warnings } = techpackToSizeTable(sizing)
  const { lines } = techpackToFitMeasurements(sizing)
  const equivalence = techpackToSizeEquivalence(sizing)
  const garmentType = resolveGarmentType(doc.header)

  // A conversion warning means at least one value was rejected as implausible,
  // which most often means the source unit was not what we thought. Publishing
  // a partially-converted size chart is worse than publishing none.
  const conversionBlocked =
    warnings.length > 0
      ? `Some measurements did not convert cleanly: ${warnings[0]} Check the pack's units before importing.`
      : null

  return [
    buildProposal({
      id: 'sizeGuide.table',
      target: 'sizeGuide',
      path: 'table',
      label: 'Size table (converted to cm)',
      sourcePaths: SOURCE.sizing,
      sourcePage: sizingPage,
      next: table,
      current: structuredSizeTable(drafts.size),
      // A product authored before the structured grid existed has `table`
      // unset and a full legacy chart rendering — the single most damaging
      // field to fill in silently, since a wrong size chart looks fine.
      renderedBy: [legacySizeTable(drafts.size)],
      blocked: conversionBlocked,
      apply: (d) => ({ ...d, size: { ...d.size, table } }),
    }),
    buildProposal({
      id: 'sizeGuide.garmentType',
      target: 'sizeGuide',
      path: 'garmentType',
      label: 'Garment type',
      sourcePaths: SOURCE.productName,
      next: garmentType,
      // Unset falls back to `'tee'` in `resolveMeasurePoints` — a code
      // default, not authored copy, so filling it is the feature working.
      current: drafts.size.garmentType ?? '',
      apply: (d) => ({ ...d, size: { ...d.size, garmentType } }),
    }),
    buildProposal({
      id: 'passport.fit.measurements',
      target: 'passport',
      path: 'fit.measurements',
      label: 'Measurements',
      sourcePaths: SOURCE.sizing,
      sourcePage: sizingPage,
      next: lines,
      current: drafts.passport.fit.measurements,
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, fit: { ...d.passport.fit, measurements: lines } },
      }),
    }),
    buildProposal({
      id: 'passport.fit.sizeEquivalence',
      target: 'passport',
      path: 'fit.sizeEquivalence',
      label: 'Size equivalence',
      sourcePaths: SOURCE.sizing,
      sourcePage: sizingPage,
      next: equivalence,
      current: drafts.passport.fit.sizeEquivalence,
      apply: (d) => ({
        ...d,
        passport: { ...d.passport, fit: { ...d.passport.fit, sizeEquivalence: equivalence } },
      }),
    }),
  ]
}

/**
 * Apply the selected proposals.
 *
 * Pure and synchronous, so the whole mapping is unit-testable without a
 * database, a network call or a React tree. Blocked proposals are refused even
 * if their id was passed in — the block is a policy, not a UI hint.
 */
export function applyImportPlan(
  plan: readonly ImportFieldProposal[],
  selectedIds: ReadonlySet<string>,
  drafts: ImportDrafts,
): ImportDrafts {
  return plan.reduce<ImportDrafts>((acc, entry) => {
    if (!selectedIds.has(entry.id)) return acc
    if (entry.blocked) return acc
    return entry.apply(acc)
  }, drafts)
}

/** Which targets a selection actually touches — drives the save sequence. */
export function affectedTargets(
  plan: readonly ImportFieldProposal[],
  selectedIds: ReadonlySet<string>,
): ImportTarget[] {
  const targets = new Set<ImportTarget>()
  for (const entry of plan) {
    if (!selectedIds.has(entry.id) || entry.blocked) continue
    targets.add(entry.target)
  }
  return [...targets]
}

/** The default selection: everything that fills a blank and is not blocked. */
export function defaultSelection(plan: readonly ImportFieldProposal[]): Set<string> {
  return new Set(plan.filter((entry) => entry.defaultSelected).map((entry) => entry.id))
}
