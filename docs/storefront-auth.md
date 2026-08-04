# Storefront Authentication (Phase 5)

The public storefront account supports **Supabase auth** (email/password + Google / Facebook / Apple OAuth) when Supabase is configured, and falls back to the existing **mock** flow when it is not — so the app behaves exactly as before until you wire Supabase.

## What's implemented

| Piece | File |
|---|---|
| `storefront_profiles` table + RLS + auto-create-on-signup trigger | `supabase/migrations/20260627120000_storefront_profiles.sql` |
| Storefront Supabase auth client (own GoTrue bucket `anvl.supabase.storefront.v1`, `detectSessionInUrl`) | `features/storefront-account/auth/storefrontSupabaseClient.ts` |
| Auth service (`signInWithPassword`, `signUp`, `signInWithOAuth`, `sendPasswordReset`, `signOut`, `getStorefrontUserId`, `isStorefrontAuthEnabled`) | `features/storefront-account/auth/storefrontAuth.ts` |
| Social buttons (Google/Apple/Facebook) — render only when Supabase is enabled | `features/storefront-account/auth/SocialAuthButtons.tsx` |
| Sign-in / sign-up pages wired (Supabase path gated; mock otherwise) | `routes/auth/sign-in.tsx`, `routes/auth/sign-up.tsx` |

`isStorefrontAuthEnabled()` === `Boolean(getSupabasePublicEnv())`. With no `VITE_SUPABASE_URL`, the social buttons render nothing and the email/password forms use the mock — **zero behavior change**.

## Enabling it (your dashboard steps)

1. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.
2. Apply the migration (`supabase db push` or the SQL editor).
3. **Supabase Dashboard → Authentication → Providers** — enable **Google**, **Facebook**, **Apple** and paste each provider's OAuth client id/secret (created in Google Cloud / Meta / Apple developer consoles). Add the Supabase callback URL each console requires.
4. **Authentication → URL Configuration** — add your site URL + `…/account` and `…/auth/sign-in` to the allowed redirect URLs (the code uses `window.location.origin + '/account'`).
5. (Code-only here — I cannot create the provider apps or paste secrets.)

## Account-data swap — DONE

When Supabase is configured, the storefront account now reads real data:

- ✅ **Supabase `AccountClient`** (`auth/supabaseAccountClient.ts`) — `getCustomerProfile`/`updateCustomerProfile` read/write `storefront_profiles` for the current `auth.uid()`. Orders return `[]` until a commerce backend.
- ✅ **Runtime wiring** (`app/config/runtime.ts`) — `account` = `supabaseAccountClient` when `getSupabasePublicEnv()` is set, else `mockAccountClient`. So `useCustomerProfileQuery` resolves the real profile.
- ✅ **Session reconcile** — `useHydrateStorefrontAccountSession` reads the GoTrue session + subscribes to `onAuthStateChange` (handles OAuth returns to `/account`); `logout()` routes through `signOutStorefront()`.

### Still open
- `phone` and `addresses` **are** persisted — both columns were added to `storefront_profiles` in `supabase/migrations/20260630120000_storefront_profiles_extend.sql` (`addresses` is jsonb), alongside the notification preferences and the `armory_public` / `armory_handle` sharing fields.
- Email-confirmation UX (sign-up returns "check your email" when confirmation is required) — currently a toast.
- `routes/account/**` visuals are functional but not yet redesigned to the premium language (a Phase 4 follow-up).

With Supabase + providers configured, the full loop works end-to-end: social/email sign-in → session → profile reads/writes `storefront_profiles`.
