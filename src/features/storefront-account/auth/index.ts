export { SocialAuthButtons } from './SocialAuthButtons'
export {
  getStorefrontUserEmail,
  getStorefrontUserId,
  isStorefrontAuthEnabled,
  resendVerificationStorefront,
  sendPasswordResetStorefront,
  signInWithOAuthStorefront,
  signInWithPasswordStorefront,
  signOutStorefront,
  signUpStorefront,
  updatePasswordStorefront,
  type AuthResult,
  type StorefrontOAuthProvider,
} from './storefrontAuth'
// DELIBERATELY NOT RE-EXPORTED: `getStorefrontSupabaseClient` and
// `supabaseAccountClient`.
//
// Both pull `@supabase/supabase-js` (~200 KB). This barrel is imported by the
// six `/auth/*` route chunks, so Rolldown hoists it to a chunk the storefront
// entry depends on — and these two re-exports were the LAST static edge keeping
// the SDK on every visitor's first paint, long after every call site had been
// made lazy. A re-export is a static edge even when nothing in the entry calls
// it, which is exactly why this was hard to spot.
//
// Import them from their leaf modules instead:
//   '@/features/storefront-account/auth/storefrontSupabaseClient'
//   '@/features/storefront-account/auth/supabaseAccountClient'
// and prefer `await import(...)` at the call site. `pnpm build` will not catch a
// regression here — verify with a network trace that no storefront route fetches
// the supabase chunk.
