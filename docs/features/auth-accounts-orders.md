# Feature — Auth / Accounts / Orders

## Goal
Create the normal clothing-brand customer account experience even if real backend auth is added later.

## Public auth pages
- Sign In
- Sign Up
- Forgot Password
- Reset Password

## Account pages
- Profile overview
- Personal info
- Addresses
- Orders
- Order details
- Wishlist later
- Returns/exchanges later

## Checkout region/payment rules
ANVL launches in Lebanon first.

Lebanon payment methods:
- Cash on Delivery
- Whish Money
- Card later/optional

Outside Lebanon:
- Card only when international shipping/card processing is enabled.

Implementation in code: `src/features/checkout/config/checkoutPayments.config.ts` (typed payment catalog, Lebanon detection including ISO `lb`, `VITE_ANVL_INTERNATIONAL_CHECKOUT` flag). Checkout Zod schema and mock payment client enforce the same rules.

## Data model notes
```ts
type Customer = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses: Address[];
};

type Order = {
  id: string;
  orderNumber: string;
  customerId?: string;
  items: OrderItem[];
  totals: OrderTotals;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cashOnDelivery' | 'whishMoney' | 'card';
  shippingAddress: Address;
  createdAt: string;
};
```

## UX rules
- Checkout must support guest checkout first.
- Account creation should be optional after order.
- Mobile forms must be clean, large enough, and fast.
- Use clear delivery/payment copy for Lebanon.

## Security notes
- Real passwords/auth must never be implemented as frontend-only storage.
- The static env-file admin gate (`VITE_ANVL_ADMIN_PASSWORD` / `VITE_ANVL_ADMIN_USERNAME`) was
  **removed 2026-07-04** (findings SEC-01/02/03). It no longer exists in source — there is no
  `verifyAdminPassword` function and no build-time admin password anywhere in the codebase.
- **Current model:** Supabase auth is the only admin auth path, gated by
  `cms_profiles.role = 'admin'` and enforced server-side.
  - `loginAdminServerFn` (`src/features/admin/auth/adminAuth.ts`) signs in with
    `client.auth.signInWithPassword`, fetches the caller's `cms_profiles` role via
    `fetchCmsProfileRoleWithAccessToken`, and immediately signs the user back out (denying login)
    if the role isn't `admin`.
  - On success it writes a **sealed, HttpOnly session cookie** (`anvl_admin_session`) holding the
    Supabase refresh token, via `writeAdminSessionData` in
    `src/features/admin/auth/adminAuthSession.server.ts` (TanStack Start's `useSession`/
    `getSession`, sealed with the server-only `ANVL_ADMIN_SESSION_SECRET`, 32+ chars). Cookie
    `path` is `/` (not `/admin`) because client-side navigations invoke server functions over a
    shared `/_serverFn/*` RPC endpoint, not under `/admin/*`. "Remember me" controls `Max-Age`
    (30-day persistent cookie vs. a browser-session-only cookie).
  - `validateAdminSessionFromCookie` re-validates on every call: it refreshes the Supabase
    session with the stored refresh token, re-checks the `admin` role, and re-issues (rotates) the
    cookie with the newly-rotated refresh token — this is what keeps a "remember me" session alive
    without ever exposing the refresh token to client JS.
  - `src/routes/admin/route.tsx`'s `beforeLoad` calls this check (via `getCachedAdminSession`) on
    SSR and on every client-side navigation under `/admin/*`, redirecting to `/admin/login` when
    not authenticated.
  - The browser-side Supabase client (`adminSupabaseBrowserClient.ts`, used for CMS reads only)
    has `autoRefreshToken: false` — the server is the sole refresh-token rotator, avoiding a
    dual-rotation race between client and server.
  - Not yet covered by this model: CSRF tokens (a double-submit cookie exists —
    `csrfProtectionMiddleware` guards the login/logout server functions), full CSP/HSTS, and rate
    limiting (tracked as remaining Phase J work in `CLAUDE.md`).
- **Settings → Danger zone → Reset all local CMS data** no longer checks a stored admin password
  (there isn't one). The confirmation modal (`src/routes/admin/-adminSettings.tsx`) requires typing
  the same value into two fields (the copy suggests using your Supabase sign-in password as a
  memorable value, but nothing is verified against it) before calling `resetAllLocalCmsKeys()`.

## Storefront implementation (mock phase)
- **Routes**: `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`; `/account` (layout + gated shell), `/account/personal`, `/account/addresses`, `/account/orders`, `/account/orders/:orderId`.
- **Feature module**: `src/features/storefront-account` — Zod schemas, TanStack Query for profile/orders, Zustand `useStorefrontAccountSession`, RHF hooks, `AccountShellLayout` / `AuthPageChrome`, demo banner.
- **Adapters:** `createRuntimeClients({ isServer })` in `src/app/config/runtime.ts` picks
  `lazySupabaseAccountClient` (`src/features/storefront-account/auth/lazySupabaseAccountClient.ts`)
  whenever Supabase env is configured, **identically on server and browser** — the account client
  choice does not branch on `isServer`. Only when Supabase env is absent does it fall back to
  `mockAccountClient` (`src/app/config/accountMock.ts`), again on both server and browser. See
  `accountContracts.ts`, `accountMock.ts`.
- **Orders data source:** `public.orders` is populated by the `shopify-webhook` Edge Function
  (`supabase/functions/shopify-webhook/index.ts`), not by the storefront. It verifies the Shopify
  HMAC signature, and for `orders/*` topics upserts a row (`shopify_order_id`, mapped `items`/
  `totals`/`status`/`payment_method`/`shipping_address`, plus the raw payload) via the service
  role — ack-only for all other topics. It links each order to a `storefront_profiles` row by
  case-insensitive email match (`customer_id`), so a signed-in customer's `/account/orders` can
  read their own order history once their email matches a mirrored order.
- **SEO**: All auth and account routes pass `noIndex: true` into `buildSeoMeta` so robots is `noindex,nofollow`.
- **Navigation**: Default landing CMS header includes **Account** → `/account`.
- **Demo credentials**: `demo@anvl.lb` / `demo1234` (banner on sign-in) — these are `mockAccountClient` demo credentials, unrelated to admin auth. Reset password flow is UI-only (no email).

- When backend exists, use secure session cookies or trusted auth provider flow — **done for admin** (see Security notes above); the storefront customer auth path uses the Supabase account client directly when Supabase env is configured.

## Backend API contracts
Auth, profile, addresses, and session token shapes for a future BFF are in `src/shared/api/contracts/auth.contract.ts`. Checkout and order history payloads live in `checkout-orders.contract.ts` (Medusa cart/order modules when integrated). See `docs/contracts/README.md`.