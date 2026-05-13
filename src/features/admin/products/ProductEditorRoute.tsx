import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import {
  detachProductFromAllDrops,
  persistProductDropLinks,
} from '@/features/admin/drops/drops.service'
import { useDropsList } from '@/features/admin/drops/useDrops'
import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import {
  deleteAdminProduct,
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
import { Button } from '@/shared/components/ui/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox'
import { FormField } from '@/shared/components/ui/FormField'
import { HexColorPicker } from '@/shared/components/ui/HexColorPicker'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { Textarea } from '@/shared/components/ui/Textarea'
const PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
]

function cloneProduct(p: AdminProduct): AdminProduct {
  return structuredClone(p)
}

export function ProductEditorRoute({ productId }: { productId: string }) {
  const navigate = useNavigate()
  const remote = useAdminProductById(productId)
  const drops = useDropsList()
  const [draft, setDraft] = useState<AdminProduct | null>(null)
  const [tab, setTab] = useState<
    'basics' | 'variants' | 'drops' | 'seo'
  >('basics')
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  const primaryPreviewSrc =
    draft?.colors[0]?.images.find((i) => i.isPrimary)?.url ??
    draft?.colors[0]?.images[0]?.url

  const saveProduct = () => {
    if (!draft) return
    const stamped: AdminProduct = {
      ...draft,
      updatedAt: new Date().toISOString(),
    }
    const rebuilt = rebuildAvailabilityMatrix(stamped)
    upsertAdminProduct(rebuilt)
    persistProductDropLinks(rebuilt)
    toast.success('Product saved.')
    setDraft(cloneProduct(rebuilt))
  }

  const updateAvailabilityRow = (
    colorId: string,
    sizeId: string,
    patch: Partial<ProductVariantAvailability>,
  ) => {
    if (!draft) return
    setDraft({
      ...draft,
      availability: draft.availability.map((row) =>
        row.colorId === colorId && row.sizeId === sizeId
          ? { ...row, ...patch }
          : row,
      ),
    })
  }

  if (!draft) {
    return (
      <AdminLayout title="Product" description="Catalog editor">
        <p className="text-sm text-[var(--color-text-muted)]">
          Product not found. It may have been deleted.
        </p>
        <Link
          to="/admin/products"
          className="mt-4 inline-flex text-sm font-semibold text-[var(--color-accent)] no-underline"
        >
          ← Back to catalog
        </Link>
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
            <Link
              to="/admin/products"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] px-4 text-xs font-semibold text-[var(--color-heading)] no-underline"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Catalog
            </Link>
            <Button type="button" variant="primary" size="sm" onClick={saveProduct}>
              <Save size={14} className="mr-1.5" aria-hidden="true" />
              Save product
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </Button>
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
          <button
            key={id}
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              tab === id
                ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                : 'border border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'basics' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_180px]">
          <AdminCard title="Listing" description="Core merchandising fields.">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Name">
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({ ...draft, name: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Slug">
                <Input
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft({ ...draft, slug: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Price">
                <Input
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
              </FormField>
              <FormField label="Compare-at price">
                <Input
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
              </FormField>
              <FormField label="Status">
                <Select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      status: e.target.value as ProductStatus,
                    })
                  }
                >
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Category">
                <Input
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                />
              </FormField>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                <Checkbox
                  checked={draft.isActive}
                  onChange={(e) =>
                    setDraft({ ...draft, isActive: e.target.checked })
                  }
                />
                Active on storefront filters
              </label>
              <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                <Checkbox
                  checked={draft.isOnSale}
                  onChange={(e) =>
                    setDraft({ ...draft, isOnSale: e.target.checked })
                  }
                />
                On sale
              </label>
              {draft.isOnSale ? (
                <FormField label="Sale label">
                  <Input
                    value={draft.saleLabel ?? ''}
                    placeholder="Limited · Sale"
                    onChange={(e) =>
                      setDraft({ ...draft, saleLabel: e.target.value })
                    }
                  />
                </FormField>
              ) : null}
              <FormField label="Tags (comma-separated)">
                <Input
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
              </FormField>
              <FormField label="Short description">
                <Textarea
                  rows={3}
                  value={draft.shortDescription}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      shortDescription: e.target.value,
                    })
                  }
                />
              </FormField>
              <FormField label="Full description">
                <Textarea
                  rows={6}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="Preview tile" description="Primary hero frame.">
            <div className="aspect-square overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]">
              {primaryPreviewSrc ? (
                <img
                  src={primaryPreviewSrc}
                  alt=""
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
              <FormField label="Fit">
                <Input
                  value={draft.details.fit ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, fit: e.target.value },
                    })
                  }
                />
              </FormField>
              <FormField label="Fabric">
                <Input
                  value={draft.details.fabric ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, fabric: e.target.value },
                    })
                  }
                />
              </FormField>
              <FormField label="GSM">
                <Input
                  value={draft.details.gsm ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, gsm: e.target.value },
                    })
                  }
                />
              </FormField>
              <FormField label="Construction">
                <Input
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
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Care">
                  <Textarea
                    rows={3}
                    value={draft.details.care ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        details: { ...draft.details, care: e.target.value },
                      })
                    }
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label="Features (one per line)">
                  <Textarea
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
                </FormField>
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
              <Button
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
              </Button>
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
                      <FormField label="Name">
                        <Input
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
                      </FormField>
                      <FormField label="Swatch">
                        <HexColorPicker
                          value={color.hex}
                          ariaLabel={`Pick swatch color for ${color.name}`}
                          onChange={(hex) => {
                            const colors = [...draft.colors]
                            colors[colorIdx] = {
                              ...color,
                              hex,
                            }
                            setDraft(rebuildAvailabilityMatrix({ ...draft, colors }))
                          }}
                        />
                      </FormField>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const colors = draft.colors.filter((_, i) => i !== colorIdx)
                        setDraft(rebuildAvailabilityMatrix({ ...draft, colors }))
                      }}
                    >
                      Remove color
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                        Images
                      </p>
                      <Button
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
                      </Button>
                    </div>
                    {color.images.map((img, imgIdx) => (
                      <div
                        key={img.id}
                        className="grid gap-3 rounded-lg border border-[var(--color-line)]/70 p-3 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <FormField label="URL">
                          <Input
                            value={img.url}
                            onChange={(e) => {
                              const colors = [...draft.colors]
                              const imgs = [...color.images]
                              imgs[imgIdx] = { ...img, url: e.target.value }
                              colors[colorIdx] = { ...color, images: imgs }
                              setDraft({ ...draft, colors })
                            }}
                          />
                        </FormField>
                        <FormField label="Alt">
                          <Input
                            value={img.alt}
                            onChange={(e) => {
                              const colors = [...draft.colors]
                              const imgs = [...color.images]
                              imgs[imgIdx] = { ...img, alt: e.target.value }
                              colors[colorIdx] = { ...color, images: imgs }
                              setDraft({ ...draft, colors })
                            }}
                          />
                        </FormField>
                        <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          <Checkbox
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
                          Primary
                        </label>
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
              <Button
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
              </Button>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {draft.sizes.map((size, idx) => (
                <div
                  key={size.id}
                  className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-line)] p-3"
                >
                  <div className="min-w-[120px] flex-1">
                    <FormField label="Label">
                      <Input
                        value={size.label}
                        onChange={(e) => {
                          const sizes = [...draft.sizes]
                          sizes[idx] = { ...size, label: e.target.value }
                          setDraft(rebuildAvailabilityMatrix({ ...draft, sizes }))
                        }}
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const sizes = draft.sizes.filter((_, i) => i !== idx)
                      setDraft(rebuildAvailabilityMatrix({ ...draft, sizes }))
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title="Availability matrix" description="SKU · stock · toggle per pairing.">
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
                        <Input
                          value={row.sku ?? ''}
                          onChange={(e) =>
                            updateAvailabilityRow(row.colorId, row.sizeId, {
                              sku: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <Input
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
                      <td className="py-3">
                        <Checkbox
                          checked={row.isAvailable}
                          onChange={(e) =>
                            updateAvailabilityRow(row.colorId, row.sizeId, {
                              isAvailable: e.target.checked,
                            })
                          }
                        />
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
                <label
                  key={drop.id}
                  className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/40 p-4 text-sm text-[var(--color-text)]"
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                      setDraft({
                        ...draft,
                        dropIds: next
                          ? [...draft.dropIds, drop.id]
                          : draft.dropIds.filter((id) => id !== drop.id),
                      })
                    }}
                  />
                  <span>
                    <span className="block font-semibold text-[var(--color-heading)]">
                      {drop.dropNumber} · {drop.name}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                      /drop/{drop.slug}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </AdminCard>
      ) : null}

      {tab === 'seo' ? (
        <AdminCard title="SEO" description="Overrides passed through commerce mocks.">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Title">
              <Input
                value={draft.seo.title ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, title: e.target.value },
                  })
                }
              />
            </FormField>
            <FormField label="OG image URL">
              <Input
                value={draft.seo.ogImage ?? ''}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, ogImage: e.target.value },
                  })
                }
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Meta description">
                <Textarea
                  rows={4}
                  value={draft.seo.description ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: { ...draft.seo, description: e.target.value },
                    })
                  }
                />
              </FormField>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Delete product?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Removes this SKU everywhere and strips it from every drop roster.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
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
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
