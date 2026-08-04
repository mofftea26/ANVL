import { Suspense, lazy, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileText, ShieldCheck } from '@/shared/icons'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { useAdminProductCatalogQuery } from '@/features/admin/hooks/useAdminProductCatalogQuery'
import { Button } from '@/shared/components/ui/Button'
import { TechpackList } from './TechpackList'
import { TechpackUploadPanel } from './TechpackUploadPanel'
import type { TechpackIngestResult } from './techpackIngest'
import type { AdminTechpack } from './techpacks.service'
import {
  useDeleteTechpackMutation,
  useSetTechpackFinalMutation,
  useTechpackListQuery,
} from './useTechpacks'

// Pulls the document view, the image grid and the blueprint stage — none of
// which the list needs, and none of which a first paint should pay for.
const TechpackDetailPanel = lazy(() =>
  import('./TechpackDetailPanel').then((m) => ({ default: m.TechpackDetailPanel })),
)

type Confirmation =
  | { kind: 'delete'; techpack: AdminTechpack }
  | { kind: 'final'; techpack: AdminTechpack }

/**
 * /admin/techpacks — ingest a supplier techpack PDF, review what the parser
 * actually read, and promote individual extracted images into the public media
 * library. Nothing here reaches the storefront on its own: a techpack is a
 * private working document until an operator deliberately publishes from it.
 */
export function AdminTechpacksPage({ initialTechpackId }: { initialTechpackId?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(initialTechpackId ?? null)
  const [productFilter, setProductFilter] = useState('all')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [lastIngest, setLastIngest] = useState<TechpackIngestResult | null>(null)

  const productsQuery = useAdminProductCatalogQuery()
  const products = productsQuery.data?.items ?? []
  const listQuery = useTechpackListQuery(productFilter === 'all' ? undefined : productFilter)
  const techpacks = useMemo(() => listQuery.data ?? [], [listQuery.data])

  const setFinal = useSetTechpackFinalMutation()
  const remove = useDeleteTechpackMutation()

  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.slug, label: product.name })),
    [products],
  )
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.slug, product.name])),
    [products],
  )
  const productFilterOptions = useMemo(
    () => [{ value: 'all', label: 'All products' }, ...productOptions],
    [productOptions],
  )

  const stats = useMemo(() => {
    const withIssues = techpacks.filter((pack) => pack.issueCount > 0).length
    const finals = techpacks.filter((pack) => pack.isFinal).length
    return { total: techpacks.length, withIssues, finals }
  }, [techpacks])

  const runConfirmation = () => {
    if (!confirmation) return
    const { techpack } = confirmation
    if (confirmation.kind === 'final') {
      setFinal.mutate(techpack.id, {
        onSuccess: () => toast.success(`${techpack.title || 'Techpack'} is now the final pack.`),
        onError: (error: Error) => toast.error(error.message),
        onSettled: () => setConfirmation(null),
      })
      return
    }
    remove.mutate(techpack.id, {
      onSuccess: () => {
        toast.success('Techpack deleted.')
        if (selectedId === techpack.id) setSelectedId(null)
      },
      onError: (error: Error) => toast.error(error.message),
      onSettled: () => setConfirmation(null),
    })
  }

  /**
   * Dev-only: serialise the raw page extracts. Parser fixtures
   * (`features/techpacks/parse/__tests__/fixtures`) are authored from these,
   * which is what keeps 74 MB PDFs out of the test run.
   */
  const downloadExtract = () => {
    if (!lastIngest) return
    const blob = new Blob([JSON.stringify(lastIngest.extracts, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `techpack-extract-${lastIngest.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const busyId = setFinal.isPending || remove.isPending ? (confirmation?.techpack.id ?? null) : null

  const rail = (
    <>
      <AdminRailPanel
        title="Ledger"
        icon={<FileText size={16} aria-hidden="true" />}
        description="One row per supplier PDF. The issue count is the review queue — work it before anything gets imported."
      >
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <RailStat label="Packs" value={stats.total} />
          <RailStat label="To review" value={stats.withIssues} />
          <RailStat label="Final" value={stats.finals} />
        </dl>
      </AdminRailPanel>
      <AdminRailPanel
        title="Disclosure"
        icon={<ShieldCheck size={16} aria-hidden="true" />}
        description="A techpack is somebody else's document."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>PDFs and extracted images live in a private bucket — no anonymous access, ever.</li>
          <li>
            Supplier names and disclaimers are stripped from TEXT at three gates. Bitmaps are not
            — that is why promoting an image asks you to look at it first.
          </li>
          <li>
            Fields marked <span className="text-[var(--color-text)]">Internal</span> (pattern
            dimensions, supplier refs, vendor codes) are for your reference only.
          </li>
        </ul>
      </AdminRailPanel>
      <AdminWorkspaceStatusPanel />
    </>
  )

  return (
    <AdminWorkspace asideLabel="Techpack help" aside={rail}>
      <div className="space-y-6" data-testid="admin-techpacks">
        <TechpackUploadPanel
          productOptions={productOptions}
          productsLoading={productsQuery.isLoading}
          onIngested={(result) => {
            setLastIngest(result)
            setSelectedId(result.id)
          }}
        />

        {import.meta.env.DEV && lastIngest ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--color-line)] p-3">
            <p className="min-w-0 flex-1 text-xs text-[var(--color-text-muted)]">
              Dev only — export the raw page extracts from the last parse to author a parser
              fixture.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              density="compact"
              onClick={downloadExtract}
            >
              <Download size={15} aria-hidden="true" />
              Download extract JSON
            </Button>
          </div>
        ) : null}

        <TechpackList
          techpacks={techpacks}
          loading={listQuery.isLoading}
          selectedId={selectedId}
          productFilter={productFilter}
          productFilterOptions={productFilterOptions}
          productNames={productNames}
          onProductFilterChange={setProductFilter}
          onSelect={setSelectedId}
          onSetFinal={(techpack) => setConfirmation({ kind: 'final', techpack })}
          onDelete={(techpack) => setConfirmation({ kind: 'delete', techpack })}
          busyId={busyId}
        />

        {selectedId ? (
          <Suspense fallback={<AdminLoadingState message="Loading techpack…" />}>
            <TechpackDetailPanel techpackId={selectedId} productOptions={productOptions} />
          </Suspense>
        ) : null}
      </div>

      <AdminConfirmDialog
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        title={
          confirmation?.kind === 'final' ? 'Make this the final pack?' : 'Delete this techpack?'
        }
        confirmLabel={confirmation?.kind === 'final' ? 'Mark final' : 'Delete'}
        confirmVariant={confirmation?.kind === 'final' ? 'primary' : 'destructive'}
        confirmLoading={setFinal.isPending || remove.isPending}
        onConfirm={runConfirmation}
      >
        {confirmation?.kind === 'final' ? (
          <>
            <strong>{confirmation.techpack.title || 'This techpack'}</strong> becomes the pack of
            record for{' '}
            {productNames.get(confirmation.techpack.productSlug) ??
              confirmation.techpack.productSlug}
            . Any other final pack for that product is demoted.
            {confirmation.techpack.issueCount > 0 ? (
              <span className="mt-2 block text-[var(--color-warning)]">
                It still has {confirmation.techpack.issueCount} unresolved parse issue
                {confirmation.techpack.issueCount === 1 ? '' : 's'}.
              </span>
            ) : null}
          </>
        ) : confirmation ? (
          <>
            <strong>{confirmation.techpack.title || 'This techpack'}</strong>, its source PDF and
            every image extracted from it are removed permanently. Images already promoted into
            the media library stay there.
          </>
        ) : null}
      </AdminConfirmDialog>
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
