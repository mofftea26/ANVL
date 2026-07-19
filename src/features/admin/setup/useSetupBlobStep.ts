import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'

interface UseSetupBlobStepOptions<T> {
  /** Reads the current working copy — called once when the step mounts. */
  read: () => T
  /** Persists the edited value (a `save*Async` — local write + publish sync). */
  save: (value: T) => Promise<unknown>
  successMessage: string
  errorFallbackMessage: string
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
 */
export function useSetupBlobStep<T>({
  read,
  save: saveAsync,
  successMessage,
  errorFallbackMessage,
}: UseSetupBlobStepOptions<T>): UseSetupBlobStepResult<T> {
  const [value, setValue] = useState<T>(read)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Latest value for the async save without re-creating the callback per edit.
  const valueRef = useRef(value)
  valueRef.current = value

  const patch = useCallback<Dispatch<SetStateAction<T>>>((updater) => {
    setValue(updater)
    setDirty(true)
    setSaved(false)
  }, [])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveAsync(valueRef.current)
        toast.success(successMessage)
        setSaved(true)
        setDirty(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : errorFallbackMessage)
      } finally {
        setSaving(false)
      }
    })()
  }, [saveAsync, successMessage, errorFallbackMessage])

  return { value, patch, save, saving, saved, dirty }
}
