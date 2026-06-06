import type { AccountClient } from '@/app/config/clients'
import type {
  Customer,
  CustomerProfileUpdate,
  Order,
} from '@/app/config/accountContracts'
import { getStorefrontSupabaseClient } from './storefrontSupabaseClient'

function splitName(full: string): { firstName?: string; lastName?: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || undefined }
}

async function requireUser() {
  const client = getStorefrontSupabaseClient()
  if (!client) throw new Error('UNAUTHORIZED')
  const { data } = await client.auth.getSession()
  const user = data.session?.user
  if (!user) throw new Error('UNAUTHORIZED')
  return { client, user }
}

async function loadProfile(): Promise<Customer> {
  const { client, user } = await requireUser()
  const { data } = await client
    .from('storefront_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle()
  const metaName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : ''
  const fullName = ((data?.full_name as string | undefined) || metaName).trim()
  const { firstName, lastName } = splitName(fullName)
  return {
    id: user.id,
    email: (data?.email as string | undefined) || user.email || '',
    firstName,
    lastName,
    phone: undefined,
    addresses: [],
  }
}

/**
 * Supabase-backed storefront account. Profile reads/writes `storefront_profiles`
 * for the current auth user; orders are not yet wired to a commerce API (empty
 * until Shopify/Medusa). Selected at runtime when Supabase is configured.
 *
 * `phone` and `addresses` are not persisted yet (no columns) — only name/email
 * round-trip. The personal-info form's phone field is accepted but not stored.
 */
export const supabaseAccountClient: AccountClient = {
  getCustomerProfile: loadProfile,
  async updateCustomerProfile(input: CustomerProfileUpdate): Promise<Customer> {
    const { client, user } = await requireUser()
    const patch: Record<string, string> = {}
    if (input.firstName !== undefined || input.lastName !== undefined) {
      patch.full_name = `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim()
    }
    if (input.email) patch.email = input.email
    if (Object.keys(patch).length > 0) {
      await client.from('storefront_profiles').update(patch).eq('id', user.id)
    }
    return loadProfile()
  },
  async listOrders(): Promise<Order[]> {
    return []
  },
  async getOrderById(): Promise<Order | null> {
    return null
  },
}
