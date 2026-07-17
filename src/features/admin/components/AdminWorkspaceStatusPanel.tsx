import { ExternalLink, Database, HardDrive } from '@/shared/icons'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Shared rail panel describing the live workspace target (Supabase vs. local
 * mock) with a storefront preview link. Reused across CMS pages that don't have
 * a richer contextual rail of their own, so ultra-wide side space always carries
 * something useful instead of dead margin.
 */
export function AdminWorkspaceStatusPanel() {
  const supabaseMode = Boolean(getSupabasePublicEnv())

  return (
    <AdminRailPanel
      title="Workspace"
      icon={supabaseMode ? <Database size={15} /> : <HardDrive size={15} />}
      testId="admin-workspace-status"
    >
      <div className="space-y-3 text-xs text-[var(--color-text-muted)]">
        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{
              background: supabaseMode
                ? 'var(--color-success)'
                : 'var(--color-highlight)',
            }}
          />
          <span>
            {supabaseMode ? (
              <>
                Connected to <span className="text-[var(--color-text)]">Supabase</span> — edits
                publish to the live storefront.
              </>
            ) : (
              <>
                Local <span className="text-[var(--color-text)]">mock</span> workspace — edits
                stay in this browser.
              </>
            )}
          </span>
        </p>

        {/* Plain anchor (not router Link): always opens the live storefront in a
            new tab, so a full navigation is the intended behavior. */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)]/60 px-3 text-xs font-medium text-[var(--color-text)] no-underline transition hover:border-[var(--color-graphite)] hover:bg-[var(--color-surface-elevated)]"
        >
          <ExternalLink size={ICON_SIZE.sm} aria-hidden="true" className="shrink-0" />
          View storefront
        </a>
      </div>
    </AdminRailPanel>
  )
}
