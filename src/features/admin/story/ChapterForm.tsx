import { useState } from 'react'
import { toast } from 'sonner'
import { AdminEntityCard } from '@/features/admin/components/AdminEntityCard'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
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

  // Products to assign this book to (from the active commerce catalog / Shopify).
  const productsQuery = useAdminProductCatalogQuery()
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
    const res = await deleteChapter(chapter.id)
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    toast.success('Chapter deleted.')
    await onDeleted()
    return true
  }

  return (
    <AdminEntityCard
      title="Chapter details"
      onSave={save}
      saving={saving}
      saveLabel="Save chapter"
      deleteLabel="Delete chapter"
      onConfirmDelete={remove}
      deleteConfirmTitle="Delete this chapter?"
      deleteConfirmBody="This permanently removes the chapter and all of its acts and cast."
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" labelStyle="stacked">
            <Input density="compact" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Subtitle" hint='e.g. "Drop 01"' labelStyle="stacked">
            <Input density="compact" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </FormField>
          <FormField label="Slug" hint="Used in /story?chapter=… deep links." labelStyle="stacked">
            <Input density="compact" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </FormField>
          <FormField label="Chapter #" labelStyle="stacked">
            <Input
              density="compact"
              type="number"
              value={chapterNumber}
              onChange={(e) => setChapterNumber(Number(e.target.value) || 0)}
            />
          </FormField>
        </div>
        <FormField label="Description" labelStyle="stacked">
          <Textarea density="compact" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>

        {/* Product assignment + drop grouping (per-product book model). */}
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Assigned product" hint="This book opens from that product's PDP." labelStyle="stacked">
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
          </FormField>
          <FormField label="Drop label" hint="Shelf section heading." labelStyle="stacked">
            <Input density="compact" value={dropLabel} onChange={(e) => setDropLabel(e.target.value)} />
          </FormField>
          <FormField label="Drop slug" hint="Groups books on the shelf." labelStyle="stacked">
            <Input density="compact" value={dropSlug} onChange={(e) => setDropSlug(e.target.value)} />
          </FormField>
        </div>

        {/* Quick cover-colour preset. */}
        <FormField label="Cover preset" hint="Fills the cover colours below — tweak freely after." labelStyle="stacked">
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
        </FormField>

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
        <Checkbox
          label="Published"
          description="Only published chapters are visible on the storefront."
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
      </div>
    </AdminEntityCard>
  )
}
