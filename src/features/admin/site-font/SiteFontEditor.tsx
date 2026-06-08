import { Check, Plus, Save } from 'lucide-react'
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  readFontLibraryFromStorage,
  saveFontConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  createGoogleFontRecord,
  resolveFontFamilyName,
  type FontLibraryConfig,
} from '@/features/cms/config/fontLibrary'
import { cn } from '@/shared/lib/cn'
import { uploadFontFiles } from './fontFamilies.service'

const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2'

function useFontLibrary(): FontLibraryConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readFontLibraryFromStorage(),
    () => readFontLibraryFromStorage(),
  )
}

function fontOptions(config: FontLibraryConfig) {
  return config.library.map((f) => ({
    value: f.id,
    label: f.label,
    description:
      f.source.kind === 'google'
        ? 'Google Fonts'
        : f.source.kind === 'upload'
          ? 'Uploaded files'
          : 'Built-in',
  }))
}

export function SiteFontEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useFontLibrary()
  const [config, setConfig] = useState<FontLibraryConfig>(stored)
  const [saving, setSaving] = useState(false)
  const [googleName, setGoogleName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setConfig(stored)
  }, [stored])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveFontConfigAsync(config)
        toast.success('Fonts saved to Supabase.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save fonts.')
      } finally {
        setSaving(false)
      }
    })()
  }, [config, flashSuccess])

  const toolbar = useMemo(
    () => (
      <AdminTopbarChipButton
        type="button"
        disabled={saving}
        icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
        variant="primary"
        loading={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save fonts'}
      </AdminTopbarChipButton>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const options = fontOptions(config)

  async function ingestFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) =>
      /\.(ttf|otf|woff2?)$/i.test(f.name),
    )
    if (!list.length) {
      toast.error('Add .ttf, .otf, .woff, or .woff2 files.')
      return
    }
    setUploading(true)
    try {
      const result = await uploadFontFiles(list)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setConfig((prev) => ({
        ...prev,
        library: [...prev.library, result.record],
      }))
      toast.success(`Added “${result.record.label}”`)
    } finally {
      setUploading(false)
    }
  }

  function addGoogleFont() {
    const trimmed = googleName.trim()
    if (!trimmed) return
    const record = createGoogleFontRecord(trimmed)
    setConfig((prev) => ({
      ...prev,
      library: [...prev.library, record],
    }))
    setGoogleName('')
    toast.success(`Added Google font “${record.label}”`)
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) void ingestFiles(e.target.files)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (uploading) return
    if (e.dataTransfer.files.length) void ingestFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-8" data-testid="site-font-editor">
      <p className="text-sm text-[var(--color-text-muted)]">
        Upload custom font files or add a Google Font family. Assign roles below — saved to
        Supabase and used on the storefront.
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          className={cn(
            'rounded-xl border border-dashed p-4 transition-colors',
            dragOver ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-line)]',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <h2 className="anvl-heading text-base font-normal">Upload font files</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Drop all weights/styles (.ttf, .otf, .woff, .woff2) for one family.
          </p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={FONT_ACCEPT}
            className="sr-only"
            onChange={onFileInput}
          />
          <div className="mt-4">
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              Choose files
            </AdminButton>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-line)] p-4">
          <h2 className="anvl-heading text-base font-normal">Google Font</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Enter the family name exactly as listed on Google Fonts.
          </p>
          <div className="mt-4 flex gap-2">
            <AdminInput
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              placeholder="e.g. Inter"
              className="min-w-0 flex-1"
            />
            <AdminButton type="button" variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addGoogleFont}>
              Add
            </AdminButton>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminFieldSelect
          label="Body (sans)"
          value={config.sans}
          onChange={(sans) => setConfig((p) => ({ ...p, sans }))}
          options={options}
        />
        <AdminFieldSelect
          label="Headings"
          value={config.heading}
          onChange={(heading) => setConfig((p) => ({ ...p, heading }))}
          options={options}
        />
        <AdminFieldSelect
          label="Display accent"
          value={config.display}
          onChange={(display) => setConfig((p) => ({ ...p, display }))}
          options={options}
        />
      </section>

      <section className="rounded-xl border border-[var(--color-line)] p-4">
        <h2 className="anvl-heading text-base font-normal">Preview</h2>
        <p
          className="mt-3 text-sm"
          style={{ fontFamily: `"${resolveFontFamilyName(config, config.sans)}", sans-serif` }}
        >
          Body — The quick brown fox jumps over the lazy dog.
        </p>
        <p
          className="mt-2 font-display text-2xl uppercase"
          style={{ fontFamily: `"${resolveFontFamilyName(config, config.heading)}", sans-serif` }}
        >
          Heading — Forged Under Pressure
        </p>
        <p
          className="mt-2 text-xl uppercase tracking-[0.2em]"
          style={{ fontFamily: `"${resolveFontFamilyName(config, config.display)}", serif` }}
        >
          Display — Drop 01
        </p>
      </section>
    </div>
  )
}
