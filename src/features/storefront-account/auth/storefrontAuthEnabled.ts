import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'

/**
 * True when Supabase is configured — gates the real auth path vs the mock flow.
 *
 * WHY THIS LIVES ALONE: this is a plain env read, but it used to sit in
 * `storefrontAuth.ts`, which statically imports the Supabase client. The
 * site-wide nav (`PremiumNavTopbar` -> `publicAccount.core`) calls this on
 * every storefront page, so that one import edge pulled all of
 * `@supabase/supabase-js` (~98 KB gzip) into the eager entry graph for every
 * visitor, signed in or not.
 *
 * Keep this module free of any import that reaches `storefrontSupabaseClient`,
 * or the entry-graph regression comes straight back. The bundle test in
 * `__tests__/storefrontAuthEnabled.test.ts` guards that.
 */
export function isStorefrontAuthEnabled(): boolean {
  return Boolean(getSupabasePublicEnv())
}
