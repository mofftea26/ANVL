import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const cmsRoleSchema = z.enum(['viewer', 'editor', 'admin'])

export type CmsProfileRole = z.infer<typeof cmsRoleSchema>

export async function fetchCmsProfileRole(
  client: SupabaseClient,
): Promise<CmsProfileRole | null> {
  const { data: userData, error: userErr } = await client.auth.getUser()
  if (userErr || !userData.user) return null

  const { data, error } = await client
    .from('cms_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error || !data || typeof data.role !== 'string') return null
  const parsed = cmsRoleSchema.safeParse(data.role)
  return parsed.success ? parsed.data : null
}
