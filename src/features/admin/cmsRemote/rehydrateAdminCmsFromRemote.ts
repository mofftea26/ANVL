import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import { hydrateAdminCmsFromSupabase } from '@/features/admin/cmsRemote/adminCmsHydration'

/** Pull Supabase CMS rows back into local admin storage (e.g. after publish demotes other actives). */
export async function rehydrateAdminCmsFromRemote(): Promise<void> {
  const client = getAdminSupabaseBrowserClient()
  if (!client) return
  await hydrateAdminCmsFromSupabase(client)
}
