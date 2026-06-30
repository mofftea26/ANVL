import type { AccountClient } from '@/app/config/clients'
import type {
  Address,
  Customer,
  CustomerProfileUpdate,
  Gender,
  Measurements,
} from '@/app/config/accountContracts'
import { getStorefrontSupabaseClient } from './storefrontSupabaseClient'
import { listOrdersForCurrentUser, getOrderByIdForCurrentUser } from './supabaseOrders'

const GENDERS: Gender[] = ['', 'male', 'female', 'other', 'preferNotToSay']

/** Keep only numeric measurement fields (defensive jsonb parse). */
function parseMeasurements(raw: unknown): Measurements {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const keys: (keyof Measurements)[] = [
    'heightCm', 'weightKg', 'chestCm', 'waistCm', 'hipsCm', 'shoulderCm', 'inseamCm',
  ]
  const out: Measurements = {}
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
  }
  return out
}

function splitName(full: string): { firstName?: string; lastName?: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') || undefined }
}

/** Defensive parse of the jsonb addresses column into the Address[] contract. */
function parseAddresses(raw: unknown): Address[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
    .map((a) => ({
      id: String(a.id ?? `addr-${Math.random().toString(36).slice(2, 9)}`),
      label: typeof a.label === 'string' ? a.label : undefined,
      name: typeof a.name === 'string' ? a.name : undefined,
      line1: String(a.line1 ?? ''),
      line2: typeof a.line2 === 'string' ? a.line2 : undefined,
      city: String(a.city ?? ''),
      country: String(a.country ?? 'Lebanon'),
      phone: typeof a.phone === 'string' ? a.phone : undefined,
    }))
}

async function requireUser() {
  const client = getStorefrontSupabaseClient()
  if (!client) throw new Error('UNAUTHORIZED')
  const { data } = await client.auth.getSession()
  const user = data.session?.user
  if (!user) throw new Error('UNAUTHORIZED')
  return { client, user }
}

/** Read a string field from OAuth/user metadata. */
function metaStr(meta: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!meta) return ''
  for (const k of keys) {
    const v = meta[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

async function loadProfile(): Promise<Customer> {
  const { client, user } = await requireUser()
  const { data } = await client
    .from('storefront_profiles')
    .select(
      'full_name, email, phone, addresses, marketing_opt_in, order_updates_opt_in, birthdate, gender, preferred_size, measurements, avatar_url',
    )
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata as Record<string, unknown> | undefined
  // Google/OAuth metadata: full_name | name | given_name + family_name; picture | avatar_url.
  const metaName =
    metaStr(meta, 'full_name', 'name') ||
    [metaStr(meta, 'given_name'), metaStr(meta, 'family_name')].filter(Boolean).join(' ')
  const metaAvatar = metaStr(meta, 'avatar_url', 'picture')

  const dbFullName = (data?.full_name as string | undefined) ?? ''
  const dbAvatar = (data?.avatar_url as string | undefined) ?? ''

  // First-time backfill from the OAuth provider so the profile isn't blank.
  const patch: Record<string, string> = {}
  if (!dbFullName.trim() && metaName) patch.full_name = metaName
  if (!dbAvatar.trim() && metaAvatar) patch.avatar_url = metaAvatar
  if (Object.keys(patch).length > 0) {
    await client.from('storefront_profiles').update(patch).eq('id', user.id)
  }

  const fullName = (dbFullName || metaName).trim()
  const { firstName, lastName } = splitName(fullName)
  const genderRaw = (data?.gender as string | undefined) ?? ''
  return {
    id: user.id,
    email: (data?.email as string | undefined) || user.email || '',
    firstName,
    lastName,
    phone: (data?.phone as string | undefined) || undefined,
    addresses: parseAddresses(data?.addresses),
    marketingOptIn: Boolean(data?.marketing_opt_in),
    orderUpdatesOptIn: data?.order_updates_opt_in !== false,
    birthdate: (data?.birthdate as string | undefined) || undefined,
    gender: (GENDERS.includes(genderRaw as Gender) ? genderRaw : '') as Gender,
    preferredSize: (data?.preferred_size as string | undefined) || undefined,
    measurements: parseMeasurements(data?.measurements),
    avatarUrl: dbAvatar || metaAvatar || undefined,
  }
}

/**
 * Supabase-backed storefront account. Profile reads/writes `storefront_profiles`
 * (name/email/phone/addresses/notification prefs) for the current auth user.
 * Orders are mirrored from Shopify into the `orders` table by the
 * `shopify-webhook` Edge Function and read here. Selected at runtime when
 * Supabase is configured.
 */
export const supabaseAccountClient: AccountClient = {
  getCustomerProfile: loadProfile,
  async updateCustomerProfile(input: CustomerProfileUpdate): Promise<Customer> {
    const { client, user } = await requireUser()
    const patch: Record<string, unknown> = {}
    if (input.firstName !== undefined || input.lastName !== undefined) {
      patch.full_name = `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim()
    }
    if (input.email) patch.email = input.email
    if (input.phone !== undefined) patch.phone = input.phone
    if (input.addresses !== undefined) patch.addresses = input.addresses
    if (input.marketingOptIn !== undefined) patch.marketing_opt_in = input.marketingOptIn
    if (input.orderUpdatesOptIn !== undefined) {
      patch.order_updates_opt_in = input.orderUpdatesOptIn
    }
    if (input.birthdate !== undefined) patch.birthdate = input.birthdate || null
    if (input.gender !== undefined) patch.gender = input.gender
    if (input.preferredSize !== undefined) patch.preferred_size = input.preferredSize
    if (input.measurements !== undefined) patch.measurements = input.measurements
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl
    if (Object.keys(patch).length > 0) {
      await client.from('storefront_profiles').update(patch).eq('id', user.id)
    }
    return loadProfile()
  },
  listOrders: listOrdersForCurrentUser,
  getOrderById: getOrderByIdForCurrentUser,
}
