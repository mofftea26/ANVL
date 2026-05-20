import type { CmsProfileRole } from '@/features/admin/auth/adminCmsProfileRole'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/** True when a usable Supabase URL + anon/publishable key are configured. */
export function isSupabaseStorefrontConfigured(): boolean {
  return getSupabasePublicEnv() != null
}

/**
 * Public storefront reads admin localStorage only when Supabase is unset (local/demo CMS).
 * When Supabase is configured, anonymous visitors must see `storefront_publication` only.
 */
export function shouldStorefrontUseLocalCmsFallback(): boolean {
  return !isSupabaseStorefrontConfigured()
}

/** Roles allowed to upsert drafts and patch `storefront_publication` (publish RPC stays admin-only). */
export function canWriteCmsDraftsToSupabase(
  role: CmsProfileRole | null,
): boolean {
  return role === 'admin' || role === 'editor'
}
