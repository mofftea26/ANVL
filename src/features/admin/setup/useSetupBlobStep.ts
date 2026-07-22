import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { toast } from 'sonner'

import { useWizardDirtyRegistry } from '@/features/admin/components/wizard/wizardDirty'
import {
  clearPreviewDraft,
  pushPreviewDraft,
} from '@/features/admin/preview/adminPreviewStore'
import type { PreviewDraftField, PreviewDraftPayload } from '@/features/cms/preview'

const PREVIEW_PUSH_DEBOUNCE_MS = 200

/**
 * Live-preview binding for a setup step's working copy: which CMS draft slice
 * it feeds and how the step value serializes into it. Built with
 * {@link setupPreviewBinding} to keep field/value types correlated.
 */
export interface SetupPreviewBinding<T> {
  push: (value: T) => void
  clear: () => void
}

export function setupPreviewBinding<K extends PreviewDraftField, T>(
  field: K,
  map: (value: T) => PreviewDraftPayload[K],
): SetupPreviewBinding<T> {
  return {
    push: (value) => pushPreviewDraft(field, map(value)),
    clear: () => clearPreviewDraft(field),
  }
}

interface UseSetupBlobStepOptions<T> {
  /** Reads the current working copy — called once when the step mounts. */
  read: () => T
  /** Persists the edited value (a `save*Async` — local write + publish sync). */
  save: (value: T) => Promise<unknown>
  successMessage: string
  errorFallbackMessage: string
  /** Mirrors unsaved edits into the live-preview draft channel (debounced). */
  preview?: SetupPreviewBinding<T>
}

interface UseSetupBlobStepResult<T> {
  value: T
  /** Patch the working copy (marks the step dirty; never auto-saves). */
  patch: Dispatch<SetStateAction<T>>
  save: () => void
  saving: boolean
  /** True after a successful save with no edits since. */
  saved: boolean
  /** True when the working copy has edits that are not saved yet. */
  dirty: boolean
}

/**
 * Working-copy lifecycle for one setup-wizard step editing a CMS blob: seed
 * local state from the stored value on mount, patch it through controls, and
 * persist only on the step's explicit Save (saving = publishing — the same
 * `save*Async` write-through the real editors use). Mirrors the editors'
 * toast-on-result behaviour so Supabase-less dev degrades to a local save +
 * error toast instead of a crash.
 *
 * Inside a wizard, the step registers `{ dirty, save }` into the wizard's
 * dirty registry (D6 unsaved-changes guard), and — when a `preview` binding is
 * given — pushes the UNSAVED working copy into the admin live-preview channel
 * so the docked preview renders pre-save edits.
 */
export function useSetupBlobStep<T>({
  read,
  save: saveAsync,
  successMessage,
  errorFallbackMessage,
  preview,
}: UseSetupBlobStepOptions<T>): UseSetupBlobStepResult<T> {
  const [value, setValue] = useState<T>(read)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Latest value for the async save without re-creating the callback per edit.
  const valueRef = useRef(value)
  valueRef.current = value
  const previewRef = useRef(preview)
  previewRef.current = preview

  const patch = useCallback<Dispatch<SetStateAction<T>>>((updater) => {
    setValue(updater)
    setDirty(true)
    setSaved(false)
  }, [])

  // Callers pass `save`/messages inline, so keep the latest in refs and expose
  // ONE stable save — otherwise the registry effect below would re-register
  // (a state update) on every render and loop.
  const saveAsyncRef = useRef(saveAsync)
  saveAsyncRef.current = saveAsync
  const messagesRef = useRef({ successMessage, errorFallbackMessage })
  messagesRef.current = { successMessage, errorFallbackMessage }

  /** Save that reports success — the wizard guard awaits it. Stable identity. */
  const saveAndReport = useCallback(async (): Promise<boolean> => {
    setSaving(true)
    try {
      await saveAsyncRef.current(valueRef.current)
      toast.success(messagesRef.current.successMessage)
      setSaved(true)
      setDirty(false)
      return true
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : messagesRef.current.errorFallbackMessage,
      )
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  const save = useCallback(() => {
    void saveAndReport()
  }, [saveAndReport])

  // Register with the hosting wizard's dirty registry (no-op outside one).
  // `saveAndReport` is stable, so this only re-fires when `dirty` flips.
  const registry = useWizardDirtyRegistry()
  const entryId = useId()
  useEffect(() => {
    if (!registry) return
    registry.register(entryId, { dirty, save: saveAndReport })
  }, [registry, entryId, dirty, saveAndReport])
  useEffect(() => {
    if (!registry) return
    return () => registry.unregister(entryId)
  }, [registry, entryId])

  // Debounced live-preview mirror of the unsaved working copy; leaving the
  // step drops the draft (same contract as `usePushPreviewDraft`).
  useEffect(() => {
    if (!previewRef.current) return
    const timer = setTimeout(
      () => previewRef.current?.push(valueRef.current),
      PREVIEW_PUSH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [value])
  useEffect(() => () => previewRef.current?.clear(), [])

  return { value, patch, save, saving, saved, dirty }
}
