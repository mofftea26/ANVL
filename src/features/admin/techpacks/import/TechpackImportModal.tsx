import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import {
  DEFAULT_PASSPORT_PRODUCT_CONTENT,
  type PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'
import {
  DEFAULT_PDP_PRODUCT_CONTENT,
  type PdpProductContent,
} from '@/features/cms/pdpContent/pdpContent.zod'
import type { SizeProductEntry } from '@/features/cms/support/supportContent.zod'

import { useTechpackListQuery, useTechpackQuery } from '../useTechpacks'
import {
  affectedTargets,
  applyImportPlan,
  buildImportPlan,
  defaultSelection,
  type ImportDrafts,
  type ImportFieldProposal,
  type ImportTarget,
} from './importPlan'

/** A blank size-guide entry, for hosts that do not author one. */
const EMPTY_SIZE_ENTRY: SizeProductEntry = { note: '', columns: [], rows: [] }
import { TechpackImportPlanList } from './TechpackImportPlanList'
import { TechpackPickerGrid } from './TechpackPickerGrid'

/**
 * "Import from techpack".
 *
 * Two steps: pick a pack (searchable cards, with a summary of what it holds),
 * then choose field by field what to take from it.
 *
 * The modal never saves anything itself. It hands the merged drafts back to
 * the editor that opened it, so the import lands in the same unsaved working
 * copy as hand edits and goes out through the same Save button. That keeps one
 * publish path instead of a second, invisible one.
 */

export interface TechpackImportResult {
  drafts: ImportDrafts
  /** Which blobs actually changed — the caller saves only these. */
  targets: ReturnType<typeof affectedTargets>
}

export function TechpackImportModal({
  open,
  onClose,
  productSlug,
  passport = DEFAULT_PASSPORT_PRODUCT_CONTENT,
  size = EMPTY_SIZE_ENTRY,
  pdp = DEFAULT_PDP_PRODUCT_CONTENT,
  targets,
  onImport,
}: {
  open: boolean
  onClose: () => void
  productSlug: string
  /** Only the host that authors this blob supplies it — see `targets`. */
  passport?: PassportProductContent
  size?: SizeProductEntry
  pdp?: PdpProductContent
  /**
   * Which blobs the HOST editor can actually save. Offering a field the caller
   * will not persist is worse than not offering it: the operator ticks it,
   * sees a success toast, and the value quietly never lands.
   */
  targets?: readonly ImportTarget[]
  onImport: (result: TechpackImportResult) => void
}) {
  const [selectedTechpackId, setSelectedTechpackId] = useState<string | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const listQuery = useTechpackListQuery()
  const detailQuery = useTechpackQuery(selectedTechpackId)

  const drafts = useMemo<ImportDrafts>(
    () => ({ passport, size, pdp }),
    [passport, size, pdp],
  )

  const plan = useMemo<ImportFieldProposal[]>(() => {
    const doc = detailQuery.data?.document
    if (!doc) return []
    const full = buildImportPlan({ doc, drafts })
    return targets ? full.filter((entry) => targets.includes(entry.target)) : full
  }, [detailQuery.data, drafts, targets])

  // Re-arm the default selection whenever a different pack is chosen: the
  // "only fill blanks" default has to be recomputed against THIS pack's fields.
  useEffect(() => {
    setSelectedFields(defaultSelection(plan))
  }, [plan])

  // A fresh open should not inherit the previous session's choices.
  useEffect(() => {
    if (!open) {
      setSelectedTechpackId(null)
      setSelectedFields(new Set())
    }
  }, [open])

  const techpacks = listQuery.data ?? []

  // Packs already assigned to this product come first — almost always the
  // right one, and its `is_final` pack more so.
  const ordered = useMemo(() => {
    return [...techpacks].sort((a, b) => {
      const aMine = a.productSlug === productSlug ? 1 : 0
      const bMine = b.productSlug === productSlug ? 1 : 0
      if (aMine !== bMine) return bMine - aMine
      if (a.isFinal !== b.isFinal) return a.isFinal ? -1 : 1
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [techpacks, productSlug])

  const selectedCount = plan.filter(
    (entry) => selectedFields.has(entry.id) && !entry.blocked,
  ).length

  const toggleField = (id: string, next: boolean) => {
    setSelectedFields((prev) => {
      const out = new Set(prev)
      if (next) out.add(id)
      else out.delete(id)
      return out
    })
  }

  const handleImport = () => {
    const targets = affectedTargets(plan, selectedFields)
    if (targets.length === 0) {
      toast.error('Nothing selected to import.')
      return
    }
    onImport({ drafts: applyImportPlan(plan, selectedFields, drafts), targets })
    toast.success(
      `Imported ${selectedCount} field${selectedCount === 1 ? '' : 's'} — review, then save.`,
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import from techpack"
      // Capped and column-laid so the plan scrolls INSIDE the dialog. A full
      // pack proposes enough fields to run past the bottom of the screen, and
      // the Import button went with it — the one control the dialog exists for.
      // `overflow-y-hidden` overrides Modal's own fallback scroll on the SAME
      // axis so tailwind-merge drops it — otherwise the panel and the plan list
      // both scroll and you get two scrollbars fighting each other.
      className="flex max-h-[88dvh] max-w-3xl flex-col overflow-y-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <p className="text-sm text-[var(--color-text-muted)]">
            Pick a techpack, then choose what to bring across. Fields that already
            have content are never selected for you.
          </p>

          {listQuery.isLoading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading techpacks…</p>
          ) : (
            <TechpackPickerGrid
              techpacks={ordered}
              selectedId={selectedTechpackId}
              onSelect={setSelectedTechpackId}
              emptyMessage="No techpacks yet — upload one at Commerce → Techpacks."
            />
          )}

          {selectedTechpackId ? (
            <div className="border-t border-[var(--color-line)] pt-5">
              {detailQuery.isLoading ? (
                <p className="text-sm text-[var(--color-text-muted)]">Reading techpack…</p>
              ) : (
                <TechpackImportPlanList
                  plan={plan}
                  selectedIds={selectedFields}
                  onToggle={toggleField}
                />
              )}
            </div>
          ) : null}
        </div>

        {/* Outside the scroll area: the action bar stays put however long the
            plan gets, and the count doubles as a running total. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            {plan.length > 0
              ? `${selectedCount} of ${plan.length} field${plan.length === 1 ? '' : 's'} selected`
              : ''}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={selectedCount === 0}
              onClick={handleImport}
            >
              {selectedCount === 0
                ? 'Select fields to import'
                : `Import ${selectedCount} field${selectedCount === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
