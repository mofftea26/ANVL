import {
  ArrowLeft,
  Check,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  detachProductFromAllDrops,
  persistProductDropLinks,
} from '@/features/admin/drops/drops.service'
import { useDropsList } from '@/features/admin/drops/useDrops'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import {
  deleteAdminProduct,
  deriveSourceType,
  upsertAdminProduct,
} from '@/features/admin/products/products.service'
import { useAdminProductById } from '@/features/admin/products/useAdminProducts'
import { rebuildAvailabilityMatrix } from '@/features/admin/products/products.matrix'
import type {
  AdminProduct,
  ProductColor,
  ProductImage,
  ProductStatus,
  ProductVariantAvailability,
} from '@/features/admin/products/products.types'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminInput } from '@/features/admin/components/AdminInput'
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from '@/features/admin/components/AdminSelect'
import { AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminDateTimeField } from '@/features/admin/components/AdminDateTimeField'
import { ColorField } from '@/shared/components/ui/ColorField'
import { Modal } from '@/shared/components/ui/Modal'
import {
  cloneProduct,
  PRODUCT_STATUSES,
} from '@/features/admin/products/productEditorRoute.shared'

export function ProductEditorRoute({ productId }: { productId: string }) {
  const navigate = useNavigate()
  const remote = useAdminProductById(productId)
  const drops = useDropsList()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [draft, setDraft] = useState<AdminProduct | null>(null)
  const [tab, setTab] = useState<
    'basics' | 'variants' | 'drops' | 'seo'
  >('basics')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteModalTitleId = useId()

  useEffect(() => {
    if (!remote) {
      setDraft(null)
      return
    }
    setDraft(cloneProduct(remote))
  }, [remote])

  const matrixRows = useMemo(() => {
    if (!draft) return []
    const rebuilt = rebuildAvailabilityMatrix(draft)
    return rebuilt.availability
  }, [draft])

  const listingSourceDisplay = useMemo(() => {
    if (!draft) return ''
    return deriveSourceType(draft.dropIds) === 'drop'
      ? 'Drop release (assigned to one or more drops)'
      : 'Individual release (not on a drop roster)'
  }, [draft])

  const primaryPreview = useMemo(() => {
    if (!draft) return null
    const color0 = draft.colors[0]
    if (!color0) return null
    const primary = color0.images.find((i) => i.isPrimary) ?? color0.images[0]
    const url = primary?.url?.trim()
    if (!url) return null
    const altFromImage = primary?.alt?.trim()
    const colorName = color0.name?.trim() || 'Primary color'
    const productName = draft.name?.trim() || 'Product'
    const alt = altFromImage || `${productName} preview — ${colorName}`
    return { src: url, alt }
  }, [draft])

  const saveProduct = () => {
    if (!draft) return
    const rebuilt = rebuildAvailabilityMatrix(draft)
    upsertAdminProduct(rebuilt)
    persistProductDropLinks(rebuilt)
    toast.success('Product saved.')
    flashSuccess()
    setDraft(cloneProduct(rebuilt))
  }

  const updateAvailabilityRow = (
    colorId: string,
    sizeId: string,
    patch: Partial<ProductVariantAvailability>,
  ) => {
    if (!draft) return
    const nextAvailability = draft.availability.map((row) =>
      row.colorId === colorId && row.sizeId === sizeId
        ? { ...row, ...patch }
        : row,
    )
    setDraft(
      rebuildAvailabilityMatrix({ ...draft, availability: nextAvailability }),
    )
  }

  if (!draft) {
    return (
      <AdminLayout title="Product" description="Catalog editor">
        <p className="text-sm text-[var(--color-text-muted)]">
          Product not found. It may have been deleted.
        </p>
        <AdminForgedLink
          to="/admin/products"
          variant="outline"
          className="mt-4 text-sm font-semibold text-[var(--color-accent)]"
        >
          ← Back to catalog
        </AdminForgedLink>
      </AdminLayout>
    )
  }

  const labelForColor = (id: string) =>
    draft.colors.find((c) => c.id === id)?.name ?? id
  const labelForSize = (id: string) =>
    draft.sizes.find((s) => s.id === id)?.label ?? id

  return (
    <AdminLayout
      title={draft.name || 'Untitled product'}
      description="Inventory, variants, and drop assignments sync bidirectionally."
    >
      <AdminSectionHeader
        eyebrow="Catalog"
        title={draft.name}
        actions={
          <>
            <AdminForgedLink to="/admin/products" variant="outline">
              <ArrowLeft size={14} aria-hidden="true" />
              Catalog
            </AdminForgedLink>
            <AdminButton type="button" variant="primary" size="sm" onClick={saveProduct}>
              {showSuccess ? (
                <>
                  <Check size={14} className="mr-1.5" aria-hidden="true" />
                  Saved
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1.5" aria-hidden="true" />
                  Save product
                </>
              )}
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </AdminButton>
          </>
        }
      />

      <div className="mb-8 flex flex-wrap gap-2 border-b border-[var(--color-line)] pb-4">
        {(
          [
            ['basics', 'Basics'],
            ['variants', 'Variants'],
            ['drops', 'Drops'],
            ['seo', 'SEO'],
          ] as const
        ).map(([id, label]) => (
          <AdminButton
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            variant="adminTabProduct"
            data-active={tab === id ? 'true' : 'false'}
            onClick={() => setTab(id)}
          >
            {label}
          </AdminButton>
        ))}
      </div>

      {tab === 'basics' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_180px]">
          <AdminCard title="Listing" description="Core merchandising fields.">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminFormField label="Name">
                <AdminInput
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Slug">
                <AdminInput
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft({ ...draft, slug: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Price">
                <AdminInput
                  type="number"
                  min={0}
                  step={1}
                  value={draft.price}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      price: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Currency (ISO)">
                <AdminInput
                  value={draft.currency}
                  placeholder="USD"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      currency: e.target.value.toUpperCase().slice(0, 8),
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Listing source">
                <AdminInput readOnly value={listingSourceDisplay} />
              </AdminFormField>
              <AdminFormField label="Release date">
                <AdminDateTimeField
                  clear
                  className="mt-0"
                  value={draft.releaseDate}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      releaseDate: next,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Sale starts">
                <AdminDateTimeField
                  clear
                  className="mt-0"
                  value={draft.saleStartsAt}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      saleStartsAt: next,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Sale ends">
                <AdminDateTimeField
                  clear
                  className="mt-0"
                  value={draft.saleEndsAt}
                  onChange={(next) =>
                    setDraft({
                      ...draft,
                      saleEndsAt: next,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Video URL">
                <AdminInput
                  value={draft.videoUrl ?? ''}
                  placeholder="https://"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      videoUrl: e.target.value.trim() || undefined,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="3D / AR model URL">
                <AdminInput
                  value={draft.model3dUrl ?? ''}
                  placeholder="https://"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      model3dUrl: e.target.value.trim() || undefined,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Compare-at price">
                <AdminInput
                  type="number"
                  min={0}
                  step={1}
                  value={draft.compareAtPrice ?? ''}
                  placeholder="Optional"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      compareAtPrice: e.target.value
                        ? Number.parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Status">
                <AdminSelect
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      status: value as ProductStatus,
                    })
                  }
                >
                  <AdminSelectTrigger aria-label="Product status">
                    <AdminSelectValue placeholder="Status" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {PRODUCT_STATUSES.map((s) => (
                      <AdminSelectItem key={s} value={s}>
                        {s}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
              </AdminFormField>
              <AdminFormField label="Category">
                <AdminInput
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                />
              </AdminFormField>
            </div>
            <div className="mt-4 grid gap-4">
              <AdminCheckbox
                label="Active on storefront filters"
                checked={draft.isActive}
                onChange={(e) =>
                  setDraft({ ...draft, isActive: e.target.checked })
                }
              />
              <AdminCheckbox
                label="On sale"
                checked={draft.isOnSale}
                onChange={(e) =>
                  setDraft({ ...draft, isOnSale: e.target.checked })
                }
              />
              {draft.isOnSale ? (
                <AdminFormField label="Sale label">
                  <AdminInput
                    value={draft.saleLabel ?? ''}
                    placeholder="Limited · Sale"
                    onChange={(e) =>
                      setDraft({ ...draft, saleLabel: e.target.value })
                    }
                  />
                </AdminFormField>
              ) : null}
              <AdminFormField label="Tags (comma-separated)">
                <AdminInput
                  value={draft.tags.join(', ')}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Short description">
                <AdminTextarea
                  rows={3}
                  value={draft.shortDescription}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      shortDescription: e.target.value,
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Full description">
                <AdminTextarea
                  rows={6}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </AdminFormField>
            </div>
          </AdminCard>

          <AdminCard title="Preview tile" description="Primary hero frame.">
            <div className="aspect-square overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
              {primaryPreview ? (
                <img
                  src={primaryPreview.src}
                  alt={primaryPreview.alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--color-text-muted)]">
                  Add color imagery
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Details" description="Specs surfaced on PDP." className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminFormField label="Fit">
                <AdminInput
                  value={draft.details.fit ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, fit: e.target.value },
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Material / fabric">
                <AdminInput
                  value={draft.details.fabric ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, fabric: e.target.value },
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="GSM">
                <AdminInput
                  value={draft.details.gsm ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, gsm: e.target.value },
                    })
                  }
                />
              </AdminFormField>
              <AdminFormField label="Construction">
                <AdminInput
                  value={draft.details.construction ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: {
                        ...draft.details,
                        construction: e.target.value,
                      },
                    })
                  }
                />
              </AdminFormField>
              <div className="md:col-span-2">
                <AdminFormField label="Care">
                  <AdminTextarea
                    rows={3}
                    value={draft.details.care ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        details: { ...draft.details, care: e.target.value },
                      })
                    }
                  />
                </AdminFormField>
              </div>
              <div className="md:col-span-2">
                <AdminFormField label="Features (one per line)">
                  <AdminTextarea
                    rows={4}
                    value={(draft.details.features ?? []).join('\n')}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        details: {
                          ...draft.details,
                          features: e.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </AdminFormField>
              </div>
            </div>
          </AdminCard>
        </div>
      ) : null}

      {tab === 'variants' ? (
        <div className="grid gap-6">
          <AdminCard
            title="Colors"
            description="Each colorway carries its own imagery stack."
            actions={
              <AdminButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const colorId = createCmsId('color')
                  const nextColor: ProductColor = {
                    id: colorId,
                    name: `Color ${draft.colors.length + 1}`,
                    hex: '#ffffff',
                    images: [
                      {
                        id: createCmsId('img'),
                        url: '/brand/placeholder-product.svg',
                        alt: '',
                        isPrimary: true,
                        sortOrder: 0,
                      },
                    ],
                  }
                  const nextDraft = rebuildAvailabilityMatrix({
                    ...draft,
                    colors: [...draft.colors, nextColor],
                  })
                  setDraft(nextDraft)
                }}
              >
                <Plus size={14} className="mr-1" aria-hidden="true" />
                Add color
              </AdminButton>
            }
          >
            <div className="space-y-8">
              {draft.colors.map((color, colorIdx) => (
                <div
                  key={color.id}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid flex-1 gap-3 md:grid-cols-3">
                      <AdminFormField label="Name">
                        <AdminInput
                          value={color.name}
                          onChange={(e) => {
                            const colors = [...draft.colors]
                            colors[colorIdx] = {
                              ...color,
                              name: e.target.value,
                            }
                            setDraft(rebuildAvailabilityMatrix({ ...draft, colors }))
                          }}
                        />
                      </AdminFormField>
                      <AdminFormField label="Swatch">
                        <ColorField
                          value={color.hex}
                          ariaLabel={`Pick swatch color for ${color.name}`}
                          inline
                          withAlpha={false}
                          onChange={(next) => {
                            const colors = [...draft.colors]
                            colors[colorIdx] = {
                              ...color,
                              hex: next,
                            }
                            setDraft(rebuildAvailabilityMatrix({ ...draft, colors }))
                          }}
                        />
                      </AdminFormField>
                    </div>
                    <AdminButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const colors = draft.colors.filter((_, i) => i !== colorIdx)
                        setDraft(rebuildAvailabilityMatrix({ ...draft, colors }))
                      }}
                    >
                      Remove color
                    </AdminButton>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                        Images
                      </p>
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const colors = [...draft.colors]
                          const imgs = [...color.images]
                          imgs.push({
                            id: createCmsId('img'),
                            url: '/brand/placeholder-product.svg',
                            alt: '',
                            isPrimary: false,
                            sortOrder: imgs.length,
                          })
                          colors[colorIdx] = { ...color, images: imgs }
                          setDraft({ ...draft, colors })
                        }}
                      >
                        Add image
                      </AdminButton>
                    </div>
                    {color.images.map((img, imgIdx) => (
                      <div
                        key={img.id}
                        className="grid gap-3 rounded-lg border border-[var(--color-line)]/70 p-3 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <AdminFormField label="URL">
                          <AdminInput
                            value={img.url}
                            onChange={(e) => {
                              const colors = [...draft.colors]
                              const imgs = [...color.images]
                              imgs[imgIdx] = { ...img, url: e.target.value }
                              colors[colorIdx] = { ...color, images: imgs }
                              setDraft({ ...draft, colors })
                            }}
                          />
                        </AdminFormField>
                        <AdminFormField label="Alt">
                          <AdminInput
                            value={img.alt}
                            onChange={(e) => {
                              const colors = [...draft.colors]
                              const imgs = [...color.images]
                              imgs[imgIdx] = { ...img, alt: e.target.value }
                              colors[colorIdx] = { ...color, images: imgs }
                              setDraft({ ...draft, colors })
                            }}
                          />
                        </AdminFormField>
                        <AdminCheckbox
                          label="Primary image"
                          className="text-xs"
                          checked={img.isPrimary}
                          onChange={(e) => {
                            const checked = e.target.checked
                            const colors = [...draft.colors]
                            const imgs = color.images.map((im, i) => ({
                              ...im,
                              isPrimary: i === imgIdx ? checked : false,
                            })) as ProductImage[]
                            colors[colorIdx] = { ...color, images: imgs }
                            setDraft({ ...draft, colors })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Sizes"
            description="Sorted labels drive PDP selectors."
            actions={
              <AdminButton
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const nextSize = {
                    id: createCmsId('size'),
                    label: `Size ${draft.sizes.length + 1}`,
                    sortOrder: draft.sizes.length,
                  }
                  setDraft(
                    rebuildAvailabilityMatrix({
                      ...draft,
                      sizes: [...draft.sizes, nextSize],
                    }),
                  )
                }}
              >
                Add size
              </AdminButton>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {draft.sizes.map((size, idx) => (
                <div
                  key={size.id}
                  className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-line)] p-3"
                >
                  <div className="min-w-[120px] flex-1">
                    <AdminFormField label="Label">
                      <AdminInput
                        value={size.label}
                        onChange={(e) => {
                          const sizes = [...draft.sizes]
                          sizes[idx] = { ...size, label: e.target.value }
                          setDraft(rebuildAvailabilityMatrix({ ...draft, sizes }))
                        }}
                      />
                    </AdminFormField>
                  </div>
                  <AdminButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const sizes = draft.sizes.filter((_, i) => i !== idx)
                      setDraft(rebuildAvailabilityMatrix({ ...draft, sizes }))
                    }}
                  >
                    Remove
                  </AdminButton>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Availability matrix"
            description="Sellable rows update automatically from stock minus reserved units."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-text-muted)]">
                    <th className="py-2 pr-4 font-medium uppercase tracking-[0.16em]">
                      Variant
                    </th>
                    <th className="py-2 pr-4 font-medium uppercase tracking-[0.16em]">
                      SKU
                    </th>
                    <th className="py-2 pr-4 font-medium uppercase tracking-[0.16em]">
                      Stock
                    </th>
                    <th className="py-2 pr-4 font-medium uppercase tracking-[0.16em]">
                      Reserved
                    </th>
                    <th className="py-2 font-medium uppercase tracking-[0.16em]">
                      Sellable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => (
                    <tr
                      key={`${row.colorId}-${row.sizeId}`}
                      className="border-b border-[var(--color-line)]/70"
                    >
                      <td className="py-3 pr-4 text-[var(--color-heading)]">
                        {labelForColor(row.colorId)} · {labelForSize(row.sizeId)}
                      </td>
                      <td className="py-3 pr-4">
                        <AdminInput
                          value={row.sku ?? ''}
                          onChange={(e) =>
                            updateAvailabilityRow(row.colorId, row.sizeId, {
                              sku: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <AdminInput
                          type="number"
                          min={0}
                          value={row.stockQuantity}
                          onChange={(e) =>
                            updateAvailabilityRow(row.colorId, row.sizeId, {
                              stockQuantity:
                                Number.parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <AdminInput
                          type="number"
                          min={0}
                          value={row.reservedQuantity}
                          onChange={(e) =>
                            updateAvailabilityRow(row.colorId, row.sizeId, {
                              reservedQuantity:
                                Number.parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="py-3 text-[var(--color-text)]">
                        {row.isAvailable ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>
        </div>
      ) : null}

      {tab === 'drops' ? (
        <AdminCard
          title="Drop assignments"
          description="Toggle drops that sell this silhouette — assignments sync both ways."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {drops.map((drop) => {
              const checked = draft.dropIds.includes(drop.id)
              return (
                <AdminCheckbox
                  key={drop.id}
                  className="items-start rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4"
                  label={
                    <>
                      <span className="block font-semibold text-[var(--color-heading)]">
                        {drop.dropNumber} · {drop.name}
                      </span>
                      <span className="mt-1 block text-xs font-normal text-[var(--color-text-muted)]">
                        /drop/{drop.slug}
                      </span>
                    </>
                  }
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                    const nextIds = next
                      ? [...draft.dropIds, drop.id]
                      : draft.dropIds.filter((id) => id !== drop.id)
                    setDraft({
                      ...draft,
                      dropIds: nextIds,
                      sourceType: deriveSourceType(nextIds),
                    })
                  }}
                />
              )
            })}
          </div>
        </AdminCard>
      ) : null}

      {tab === 'seo' ? (
        <AdminCard title="SEO" description="Overrides passed through commerce mocks.">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminFormField label="Title">
              <AdminInput
                value={draft.seo.title ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, title: e.target.value },
                  })
                }
              />
            </AdminFormField>
            <AdminFormField label="OG image URL">
              <AdminInput
                value={draft.seo.ogImage ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, ogImage: e.target.value },
                  })
                }
              />
            </AdminFormField>
            <div className="md:col-span-2">
              <AdminFormField label="Meta description">
                <AdminTextarea
                  rows={4}
                  value={draft.seo.description ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: { ...draft.seo, description: e.target.value },
                    })
                  }
                />
              </AdminFormField>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby={deleteModalTitleId}
      >
        <div className="space-y-4">
          <h3 id={deleteModalTitleId} className="anvl-heading text-xl font-normal">
            Delete product?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Removes this SKU everywhere and strips it from every drop roster.
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => {
                detachProductFromAllDrops(draft.id)
                deleteAdminProduct(draft.id)
                toast.success('Product deleted.')
                setConfirmDelete(false)
                navigate({ to: '/admin/products' })
              }}
            >
              Delete
            </AdminButton>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
