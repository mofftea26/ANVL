import { Check, Info, Plus, Save, Type } from 'lucide-react'
import {
  type ChangeEvent,
  type DragEvent,
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
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
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
  const stored = useFontLibrary()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'fonts',
    stored,
    saveAsync: saveFontConfigAsync,
    successMessage: 'Fonts saved to Supabase.',
    errorFallbackMessage: 'Could not save fonts.',
  })
  const [googleName, setGoogleName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const previewRail = (
    <>
      <AdminRailPanel title="Type preview" icon={<Type size={15} />}>
        <div className="space-y-3">
          <p
            className="text-sm"
            style={{ fontFamily: `"${resolveFontFamilyName(config, config.sans)}", sans-serif` }}
          >
            Body — The quick brown fox jumps over the lazy dog.
          </p>
          <p
            className="font-display text-2xl uppercase"
            style={{ fontFamily: `"${resolveFontFamilyName(config, config.heading)}", sans-serif` }}
          >
            Heading — Forged Under Pressure
          </p>
          <p
            className="text-xl uppercase tracking-[0.2em]"
            style={{ fontFamily: `"${resolveFontFamilyName(config, config.display)}", serif` }}
          >
            Display — Drop 01
          </p>
        </div>
      </AdminRailPanel>
      <AdminRailPanel
        title="How roles map"
        icon={<Info size={15} />}
        description="Each role becomes a CSS variable on the storefront."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>
            <span className="text-[var(--color-text)]">Body</span> — paragraphs, controls, and UI
            copy (<code className="font-mono text-[10px]">--font-sans</code>).
          </li>
          <li>
            <span className="text-[var(--color-text)]">Headings</span> — section titles and hero
            type (<code className="font-mono text-[10px]">--font-heading</code>).
          </li>
          <li>
            <span className="text-[var(--color-text)]">Display</span> — heraldic accents like drop
            numerals (<code className="font-mono text-[10px]">--font-display</code>).
          </li>
        </ul>
      </AdminRailPanel>
    </>
  )

  return (
    <AdminWorkspace
      asideLabel="Type preview and font role help"
      aside={previewRail}
    >
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

      </div>
    </AdminWorkspace>
  )
}
