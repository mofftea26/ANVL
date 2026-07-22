import { Database, HardDrive } from '@/shared/icons'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/**
 * Shared rail panel describing the live workspace target (Supabase vs. local
 * mock). Reused across CMS pages that don't have a richer contextual rail of
 * their own, so ultra-wide side space always carries something useful instead
 * of dead margin. (The storefront jump lives in the sidebar footer — chrome
 * carries it once, not every rail.)
 */
export function AdminWorkspaceStatusPanel() {
  const supabaseMode = Boolean(getSupabasePublicEnv())

  return (
    <AdminRailPanel
      title="Workspace"
      icon={supabaseMode ? <Database size={17} /> : <HardDrive size={17} />}
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
      </div>
    </AdminRailPanel>
  )
}
