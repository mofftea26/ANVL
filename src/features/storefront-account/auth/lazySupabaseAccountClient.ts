import type { AccountClient } from '@/app/config/clients'
import type { CustomerProfileUpdate } from '@/app/config/accountContracts'

/**
 * Deferred storefront account client.
 *
 * The real `supabaseAccountClient` statically pulls `@supabase/supabase-js`
 * (GoTrue auth + Realtime), a heavy dependency. Wiring it into the every-route
 * `runtimeClients` singleton (`runtime.ts`) dragged that whole client into the
 * shared entry chunk even though account features are only ever used on the
 * account / auth routes. This wrapper keeps the `AccountClient` contract but
 * loads the implementation (and thus supabase-js) on the first method call, so
 * the storefront entry no longer ships the auth/realtime machinery.
 */
const loadClient = () =>
  import('./supabaseAccountClient').then((m) => m.supabaseAccountClient)

export const lazySupabaseAccountClient: AccountClient = {
  getCustomerProfile: () => loadClient().then((c) => c.getCustomerProfile()),
  updateCustomerProfile: (input: CustomerProfileUpdate) =>
    loadClient().then((c) => c.updateCustomerProfile(input)),
  listOrders: () => loadClient().then((c) => c.listOrders()),
  getOrderById: (id: string) => loadClient().then((c) => c.getOrderById(id)),
}
