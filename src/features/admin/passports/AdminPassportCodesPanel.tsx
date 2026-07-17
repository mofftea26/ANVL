import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Copy, Printer, QrCode, RotateCcw, Trash2 } from '@/shared/icons'
import { toast } from 'sonner'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Switch } from '@/shared/components/ui/Switch'
import { BRAND } from '@/shared/constants/brand'
import {
  deleteBatch,
  deletePassport,
  generateBatch,
  listPassports,
  unassignPassport,
  type AdminPassport,
} from './passports.service'

const PassportPrintSheet = lazy(() => import('./PassportPrintSheet'))

type StatusFilter = 'all' | 'claimed' | 'unclaimed'
type ConfirmAction =
  | { kind: 'unassign'; passport: AdminPassport }
  | { kind: 'delete'; passport: AdminPassport }
  | { kind: 'delete-batch'; batchId: string; count: number; productName: string }

/**
 * /admin/passports · "QR codes" tab — generate per-unit QR passports for a
 * product, track claimed vs unclaimed, unassign/delete, print a batch sheet.
 */
export function AdminPassportCodesPanel() {
  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []

  const [passports, setPassports] = useState<AdminPassport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [productSlug, setProductSlug] = useState('')
  const [quantity, setQuantity] = useState('50')
  const [filterProduct, setFilterProduct] = useState('all')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  /** Unassign option: also purge the ex-owner's feats for this product. */
  const [purgeFeats, setPurgeFeats] = useState(false)
  const [printBatchId, setPrintBatchId] = useState<string | null>(null)

  const reload = async () => {
    const res = await listPassports()
    if (res.ok) setPassports(res.data)
    else toast.error(res.error)
    setLoading(false)
  }

  // Initial load only; mutations call reload() explicitly after they land.
  useEffect(() => {
    void reload()
  }, [])

  const stats = useMemo(() => {
    const claimed = passports.filter((p) => p.claimedBy).length
    return { total: passports.length, claimed, unclaimed: passports.length - claimed }
  }, [passports])

  const batches = useMemo(() => {
    const map = new Map<
      string,
      { batchId: string; productName: string; count: number; claimed: number; from: number; to: number; createdAt: string }
    >()
    for (const p of passports) {
      const b = map.get(p.batchId) ?? {
        batchId: p.batchId,
        productName: p.productName,
        count: 0,
        claimed: 0,
        from: p.serialNumber,
        to: p.serialNumber,
        createdAt: p.createdAt,
      }
      b.count += 1
      if (p.claimedBy) b.claimed += 1
      b.from = Math.min(b.from, p.serialNumber)
      b.to = Math.max(b.to, p.serialNumber)
      map.set(p.batchId, b)
    }
    return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [passports])

  const filtered = useMemo(
    () =>
      passports.filter((p) => {
        if (filterProduct !== 'all' && p.productSlug !== filterProduct) return false
        if (filterStatus === 'claimed') return Boolean(p.claimedBy)
        if (filterStatus === 'unclaimed') return !p.claimedBy
        return true
      }),
    [passports, filterProduct, filterStatus],
  )

  const productOptions = products.map((p) => ({ value: p.slug, label: p.name }))
  const filterProductOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of passports) seen.set(p.productSlug, p.productName)
    return [
      { value: 'all', label: 'All products' },
      ...[...seen.entries()].map(([value, label]) => ({ value, label })),
    ]
  }, [passports])

  const onGenerate = async () => {
    const product = products.find((p) => p.slug === productSlug)
    const qty = Number.parseInt(quantity, 10)
    if (!product) {
      toast.error('Pick a product first.')
      return
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 500) {
      toast.error('Quantity must be between 1 and 500.')
      return
    }
    setGenerating(true)
    const res = await generateBatch({
      productSlug: product.slug,
      productName: product.name,
      quantity: qty,
    })
    setGenerating(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(
      `Forged ${qty} passports for ${product.name} (#${res.data.from}–#${res.data.to}).`,
    )
    setPrintBatchId(res.data.batchId)
    await reload()
  }

  const onConfirm = async () => {
    if (!confirm) return
    setConfirmBusy(true)
    const res =
      confirm.kind === 'unassign'
        ? await unassignPassport(confirm.passport.id, purgeFeats)
        : confirm.kind === 'delete'
          ? await deletePassport(confirm.passport.id)
          : await deleteBatch(confirm.batchId)
    setConfirmBusy(false)
    setConfirm(null)
    setPurgeFeats(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(
      confirm.kind === 'unassign'
        ? 'Passport unassigned — it can be claimed again.'
        : confirm.kind === 'delete'
          ? 'Passport deleted.'
          : 'Batch deleted.',
    )
    await reload()
  }

  const copyClaimUrl = (token: string) => {
    void navigator.clipboard
      .writeText(`${BRAND.canonicalBaseUrl}/p/${token}`)
      .then(() => toast.success('Claim URL copied.'))
      .catch(() => toast.error('Could not copy the URL.'))
  }

  const printPassports = printBatchId
    ? passports.filter((p) => p.batchId === printBatchId)
    : []

  return (
    <AdminWorkspace
      asideLabel="Passport status"
      aside={
        <>
          <AdminRailPanel
            title="Ledger"
            icon={<QrCode size={16} aria-hidden="true" />}
            description="Every physical unit gets one QR passport; the first customer to scan and claim it owns it."
          >
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <RailStat label="Total" value={stats.total} />
              <RailStat label="Claimed" value={stats.claimed} />
              <RailStat label="Open" value={stats.unclaimed} />
            </dl>
          </AdminRailPanel>
          <AdminRailPanel
            title="How it works"
            description="Generate a batch per product, print the QR sheet, and slip one card into each garment. Unassign frees a claim (e.g. returns); delete removes codes that were never shipped."
          />
        </>
      }
    >
      <div className="space-y-6">
        {/* Generator ---------------------------------------------------- */}
        <AdminCard
          title="Forge a batch"
          description="Pick the product (from the live commerce catalog) and how many physical units you are printing passports for. Serial numbers continue where the product's last batch ended."
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-end">
            <AdminFieldSelect
              label="Product"
              value={productSlug}
              onChange={setProductSlug}
              options={productOptions}
              placeholder={
                productsQuery.isLoading ? 'Loading products…' : 'Select a product'
              }
            />
            <FormField label="Quantity" labelStyle="stacked">
              <Input
                type="number"
                min={1}
                max={500}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                density="compact"
                aria-label="Quantity"
              />
            </FormField>
            <Button
              type="button"
              variant="primary"
              size="md"
              density="compact"
              loading={generating}
              disabled={!productSlug}
              onClick={() => void onGenerate()}
            >
              <QrCode size={16} aria-hidden="true" />
              Generate
            </Button>
          </div>
        </AdminCard>

        {/* Batches -------------------------------------------------------- */}
        {batches.length > 0 ? (
          <AdminCard
            title="Batches"
            description="Print a batch to get its QR sheet; delete a batch to retire codes that never shipped."
          >
            <ul className="divide-y divide-[var(--color-line)]">
              {batches.map((b) => (
                <li key={b.batchId} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {b.productName}
                    </p>
                    <p className="anvl-micro text-[var(--color-text-muted)]">
                      #{b.from}–#{b.to} · {b.count} codes · {b.claimed} claimed ·{' '}
                      {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      density="compact"
                      onClick={() => setPrintBatchId(b.batchId)}
                    >
                      <Printer size={15} aria-hidden="true" />
                      QR sheet
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      density="compact"
                      onClick={() =>
                        setConfirm({
                          kind: 'delete-batch',
                          batchId: b.batchId,
                          count: b.count,
                          productName: b.productName,
                        })
                      }
                    >
                      <Trash2 size={15} aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </AdminCard>
        ) : null}

        {/* Ledger --------------------------------------------------------- */}
        <AdminCard
          title="Passport ledger"
          description="Each row is one physical unit. Claimed rows show who owns the piece."
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            <AdminFieldSelect
              label="Product"
              value={filterProduct}
              onChange={setFilterProduct}
              options={filterProductOptions}
            />
            <AdminFieldSelect
              label="Status"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v as StatusFilter)}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'unclaimed', label: 'Unclaimed' },
                { value: 'claimed', label: 'Claimed' },
              ]}
            />
          </div>

          {loading ? (
            <AdminLoadingState message="Loading passports…" />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-sm text-[var(--color-text-muted)]">
              {passports.length === 0
                ? 'No passports yet — forge your first batch above.'
                : 'Nothing matches these filters.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {filtered.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="anvl-heading w-24 shrink-0 text-sm text-[var(--color-heading)]">
                    #{String(p.serialNumber).padStart(3, '0')}/{p.editionTotal}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--color-text)]">{p.productName}</p>
                    {p.claimedBy ? (
                      <p className="anvl-micro truncate text-[var(--color-text-muted)]">
                        Claimed by {p.claimedDisplayName ?? 'unknown'}
                        {p.claimedEmail ? ` · ${p.claimedEmail}` : ''}
                        {p.claimedAt ? ` · ${new Date(p.claimedAt).toLocaleDateString()}` : ''}
                        {p.claimedColor ? ` · ${p.claimedColor}` : ''}
                        {p.claimedSize ? ` / ${p.claimedSize}` : ''}
                      </p>
                    ) : (
                      <p className="anvl-micro text-[var(--color-text-muted)]">Unclaimed</p>
                    )}
                  </div>
                  <span
                    className={
                      p.claimedBy
                        ? 'rounded-full border border-[color-mix(in_oklab,var(--color-success)_45%,transparent)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-success)]'
                        : 'rounded-full border border-[var(--color-line)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]'
                    }
                  >
                    {p.claimedBy ? 'Claimed' : 'Open'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      density="compact"
                      aria-label="Copy claim URL"
                      onClick={() => copyClaimUrl(p.token)}
                    >
                      <Copy size={15} aria-hidden="true" />
                    </Button>
                    {p.claimedBy ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        density="compact"
                        onClick={() => setConfirm({ kind: 'unassign', passport: p })}
                      >
                        <RotateCcw size={15} aria-hidden="true" />
                        Unassign
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      density="compact"
                      aria-label="Delete passport"
                      onClick={() => setConfirm({ kind: 'delete', passport: p })}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {/* Confirms ---------------------------------------------------------- */}
      <AdminConfirmDialog
        open={confirm !== null}
        onClose={() => {
          setConfirm(null)
          setPurgeFeats(false)
        }}
        title={
          confirm?.kind === 'unassign'
            ? 'Unassign this passport?'
            : confirm?.kind === 'delete'
              ? 'Delete this passport?'
              : 'Delete this batch?'
        }
        confirmLabel={confirm?.kind === 'unassign' ? 'Unassign' : 'Delete'}
        confirmVariant={confirm?.kind === 'unassign' ? 'primary' : 'destructive'}
        confirmLoading={confirmBusy}
        onConfirm={() => void onConfirm()}
      >
        {confirm?.kind === 'unassign' ? (
          <>
            <strong>{confirm.passport.productName}</strong> #{confirm.passport.serialNumber} will
            be released from {confirm.passport.claimedDisplayName ?? 'its owner'} and become
            claimable by the next person who scans it.
            <div className="mt-4">
              <Switch
                checked={purgeFeats}
                onChange={setPurgeFeats}
                label="Also remove their records for this product"
                description="Feats and achievements are deleted as if never owned. Leave off to keep them: if the same customer re-claims this product, their records reattach (nothing duplicates)."
              />
            </div>
          </>
        ) : confirm?.kind === 'delete' ? (
          <>
            <strong>{confirm.passport.productName}</strong> #{confirm.passport.serialNumber} will
            be removed permanently. A printed QR for it will stop working.
          </>
        ) : confirm ? (
          <>
            All <strong>{confirm.count}</strong> codes in this {confirm.productName} batch will be
            removed permanently, including any claimed ones.
          </>
        ) : null}
      </AdminConfirmDialog>

      {/* Print sheet -------------------------------------------------------- */}
      {printBatchId && printPassports.length > 0 ? (
        <Suspense fallback={null}>
          <PassportPrintSheet
            passports={printPassports}
            onClose={() => setPrintBatchId(null)}
          />
        </Suspense>
      ) : null}
    </AdminWorkspace>
  )
}

function RailStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2">
      <dt className="anvl-micro text-[var(--color-text-muted)]">{label}</dt>
      <dd className="anvl-heading mt-0.5 text-xl text-[var(--color-heading)]">{value}</dd>
    </div>
  )
}
