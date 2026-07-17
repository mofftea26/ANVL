import { useMemo, useState } from 'react'
import { FileUp } from '@/shared/icons'
import {
  DROP_ASSET_SLOTS,
  GENERAL_ASSET_SLOTS,
} from '@/features/landingPages/assetSlots'
import {
  getStorefrontPageSlots,
  STOREFRONT_PAGE_REGISTRY,
} from '@/features/cms/assets/storefrontPageSlots'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'

/**
 * Enforced functional naming for every upload: `[context]-[slot].ext`.
 * Contexts and slots come from the real asset-slot registries, so a file's
 * name tells you exactly where it belongs; free-purpose contexts (product
 * editorial, story, library) still force the same kebab format.
 */

interface ContextDef {
  key: string
  label: string
  /** Slot options when the context has a registry; free text otherwise. */
  slots: Array<{ value: string; label: string }> | null
}

const CONTEXTS: ContextDef[] = [
  {
    key: 'general',
    label: 'General (site-wide)',
    slots: GENERAL_ASSET_SLOTS.map((s) => ({ value: s.key, label: s.label })),
  },
  ...STOREFRONT_PAGE_REGISTRY.map((p) => ({
    key: p.key,
    label: p.name,
    slots: getStorefrontPageSlots(p.key).map((s) => ({ value: s.key, label: s.label })),
  })),
  ...Object.keys(DROP_ASSET_SLOTS).map((dropKey) => ({
    key: dropKey,
    label: `Drop — ${dropKey}`,
    slots: (DROP_ASSET_SLOTS[dropKey] ?? []).map((s) => ({ value: s.key, label: s.label })),
  })),
  { key: 'product', label: 'Product editorial (PDP / passport)', slots: null },
  { key: 'story', label: 'Story saga', slots: null },
  { key: 'library', label: 'Library (other)', slots: null },
]

function kebab(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

interface PendingName {
  context: string
  slot: string
  purpose: string
}

export function buildUploadName(file: File, entry: PendingName): string | null {
  const ctx = CONTEXTS.find((c) => c.key === entry.context)
  if (!ctx) return null
  const part = ctx.slots ? entry.slot : kebab(entry.purpose)
  if (!part) return null
  return `${kebab(ctx.key)}-${kebab(part)}.${extOf(file.name)}`
}

export function MediaUploadNamingModal({
  files,
  onCancel,
  onConfirm,
  busy,
}: {
  files: File[]
  onCancel: () => void
  onConfirm: (renamed: File[]) => void
  busy: boolean
}) {
  const [entries, setEntries] = useState<PendingName[]>(() =>
    files.map(() => ({ context: '', slot: '', purpose: '' })),
  )

  const names = useMemo(
    () => files.map((file, i) => (entries[i] ? buildUploadName(file, entries[i]) : null)),
    [files, entries],
  )

  // Dedupe within the batch: second `shop-heroimage.png` becomes `...-2.png`.
  const finalNames = useMemo(() => {
    const seen = new Map<string, number>()
    return names.map((name) => {
      if (!name) return null
      const count = (seen.get(name) ?? 0) + 1
      seen.set(name, count)
      if (count === 1) return name
      const dot = name.lastIndexOf('.')
      return `${name.slice(0, dot)}-${count}${name.slice(dot)}`
    })
  }, [names])

  const allNamed = finalNames.every(Boolean)

  const patch = (i: number, next: Partial<PendingName>) =>
    setEntries((prev) => prev.map((e, j) => (j === i ? { ...e, ...next } : e)))

  const confirm = () => {
    const renamed = files.map((file, i) => new File([file], finalNames[i]!, { type: file.type }))
    onConfirm(renamed)
  }

  return (
    <Modal open onClose={onCancel} title="Name your uploads" className="max-w-2xl">
      <div className="space-y-4">
        <p className="text-xs text-[var(--color-text-muted)]">
          Every asset is named by its function — <code className="font-mono">
          [page]-[slot].ext</code> — so the library always tells you where a file
          belongs. Pick the destination for each upload.
        </p>

        <ul className="max-h-[50vh] space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {files.map((file, i) => {
            const entry = entries[i]!
            const ctx = CONTEXTS.find((c) => c.key === entry.context)
            return (
              <li
                key={`${file.name}-${i}`}
                className="rounded-xl border border-[var(--color-line)] p-4"
              >
                <p className="mb-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <FileUp size={15} aria-hidden="true" />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdminFieldSelect
                    label="Where is it used?"
                    value={entry.context}
                    onChange={(context) => patch(i, { context, slot: '', purpose: '' })}
                    options={CONTEXTS.map((c) => ({ value: c.key, label: c.label }))}
                    placeholder="Pick a page/context…"
                  />
                  {ctx?.slots ? (
                    <AdminFieldSelect
                      label="Slot"
                      value={entry.slot}
                      onChange={(slot) => patch(i, { slot })}
                      options={ctx.slots}
                      placeholder="Pick the slot…"
                    />
                  ) : ctx ? (
                    <FormField label="Purpose" hint="e.g. seamless-tee-macro" labelStyle="stacked">
                      <Input
                        density="compact"
                        value={entry.purpose}
                        onChange={(e) => patch(i, { purpose: e.target.value })}
                      />
                    </FormField>
                  ) : null}
                </div>
                {finalNames[i] ? (
                  <p className="mt-2 text-xs">
                    <span className="text-[var(--color-text-muted)]">Will be saved as </span>
                    <code className="font-mono text-[var(--color-success)]">{finalNames[i]}</code>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>

        <div className="flex justify-end gap-2 border-t border-[var(--color-line)] pt-4">
          <Button type="button" variant="ghost" size="sm" density="compact" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            density="compact"
            disabled={!allNamed}
            loading={busy}
            onClick={confirm}
          >
            Upload {files.length} {files.length === 1 ? 'file' : 'files'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
