import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { runtimeClients } from '@/app/config/runtime'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import {
  DEFAULT_BOOK_COLORS,
  type BookColors,
  type StoryAsset,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import { BOOK_COVER_PRESETS, bookCoverPresetColors } from '@/features/story/bookCoverPresets'
import { StoryAssetField } from '@/features/admin/story/StoryAssetField'
import { BookColorsField } from '@/features/admin/story/BookColorsField'
import { deleteChapter, upsertChapter } from '@/features/admin/story/story.service'

interface ChapterFormProps {
  chapter: StoryChapter
  onSaved: () => Promise<void> | void
  onDeleted: () => Promise<void> | void
}

/** Edits a chapter's own fields (acts + cast are managed separately). */
export function ChapterForm({ chapter, onSaved, onDeleted }: ChapterFormProps) {
  const [slug, setSlug] = useState(chapter.slug)
  const [title, setTitle] = useState(chapter.title)
  const [subtitle, setSubtitle] = useState(chapter.subtitle)
  const [chapterNumber, setChapterNumber] = useState(chapter.chapterNumber)
  const [description, setDescription] = useState(chapter.description)
  const [productSlug, setProductSlug] = useState(chapter.productSlug ?? '')
  const [dropLabel, setDropLabel] = useState(chapter.dropLabel ?? '')
  const [dropSlug, setDropSlug] = useState(chapter.dropSlug ?? '')
  const [isPublished, setIsPublished] = useState(chapter.isPublished)
  const [cover, setCover] = useState<StoryAsset>(chapter.cover)
  const [coverLogo, setCoverLogo] = useState<StoryAsset>(chapter.coverLogo)
  const [colors, setColors] = useState<BookColors>(chapter.colors ?? DEFAULT_BOOK_COLORS)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Products to assign this book to (from the active commerce catalog / Shopify).
  const productsQuery = useQuery({
    queryKey: ['admin', 'story-products'],
    queryFn: () => runtimeClients.commerce.getShopListingCatalog(),
    staleTime: 30_000,
  })
  const products = productsQuery.data?.items ?? []

  async function save() {
    setSaving(true)
    try {
      const res = await upsertChapter({
        id: chapter.id,
        slug,
        chapterNumber,
        title,
        subtitle,
        description,
        productSlug,
        dropLabel,
        dropSlug,
        cover,
        coverLogo,
        colors,
        sortOrder: chapterNumber,
        isPublished,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Chapter saved.')
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    try {
      const res = await deleteChapter(chapter.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Chapter deleted.')
      setConfirm(false)
      await onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminCard
      title="Chapter details"
      actions={
        <div className="flex gap-2">
          <AdminButton type="button" variant="primary" size="sm" loading={saving} icon={<Save size={14} />} onClick={() => void save()}>
            Save chapter
          </AdminButton>
          <AdminButton type="button" variant="destructive" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirm(true)}>
            Delete
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label="Title">
            <AdminInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Subtitle" hint='e.g. "Drop 01"'>
            <AdminInput value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Slug" hint="Used in /story?chapter=… deep links.">
            <AdminInput value={slug} onChange={(e) => setSlug(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Chapter #">
            <AdminInput
              type="number"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(Number(e.target.value) || 0)}
            />
          </AdminFormField>
        </div>
        <AdminFormField label="Description">
          <AdminTextarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </AdminFormField>

        {/* Product assignment + drop grouping (per-product book model). */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminFormField label="Assigned product" hint="This book opens from that product's PDP.">
            <select
              className="focus-ring h-10 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              value={productSlug}
              onChange={(e) => {
                setProductSlug(e.target.value)
                const p = products.find((x) => x.slug === e.target.value)
                if (p) {
                  if (!dropLabel) setDropLabel(p.dropName ?? '')
                  if (!dropSlug) setDropSlug(p.shop?.dropSlug ?? p.dropName?.toLowerCase().replace(/\s+/g, '-') ?? '')
                }
              }}
            >
              <option value="">— None (standalone chapter) —</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField label="Drop label" hint="Shelf section heading.">
            <AdminInput value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Drop slug" hint="Groups books on the shelf.">
            <AdminInput value={dropSlug} onChange={(e) => setDropSlug(e.target.value)} />
          </AdminFormField>
        </div>

        {/* Quick cover-colour preset. */}
        <AdminFormField label="Cover preset" hint="Fills the cover colours below — tweak freely after.">
          <select
            className="focus-ring h-10 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            value=""
            onChange={(e) => {
              const preset = bookCoverPresetColors(e.target.value)
              if (preset) setColors(preset)
            }}
          >
            <option value="">— Choose a preset —</option>
            {BOOK_COVER_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </AdminFormField>

        <div className="grid gap-4 lg:grid-cols-2">
          <StoryAssetField label="Chapter cover art" asset={cover} scope={slug} onChange={setCover} />
          <StoryAssetField
            label="Drop logo (on book cover)"
            asset={coverLogo}
            scope={`${slug}-logo`}
            onChange={setCoverLogo}
          />
        </div>
        <BookColorsField colors={colors} onChange={setColors} />
        <AdminCheckbox
          label="Published"
          description="Only published chapters are visible on the storefront."
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
      </div>

      <AdminConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete this chapter?"
        confirmLabel="Delete chapter"
        confirmVariant="destructive"
        confirmLoading={deleting}
        onConfirm={() => void remove()}
      >
        This permanently removes the chapter and all of its acts and cast.
      </AdminConfirmDialog>
    </AdminCard>
  )
}
