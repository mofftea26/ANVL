# Feature â€” Auth / Accounts / Orders

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
- Current static admin login must be clearly marked temporary and not production security. For local builds, set `VITE_ANVL_ADMIN_PASSWORD` (and optionally `VITE_ANVL_ADMIN_USERNAME`) in `.env` â€” values are still embedded in the client bundle at compile time, so this is only a convenience layer over hard-coded demo credentials.

- The storefront admin gate remains **temporary**: credentials come from build-time `VITE_ANVL_ADMIN_*` env vars (see `.env.example`), not hardcoded strings in source. This is still not production security (values ship in the client bundle).- When backend exists, use secure session cookies or trusted auth provider flow.

## Storefront implementation (mock phase)
- **Routes**: `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`; `/account` (layout + gated shell), `/account/personal`, `/account/addresses`, `/account/orders`, `/account/orders/:orderId`.
- **Feature module**: `src/features/storefront-account` â€” Zod schemas, TanStack Query for profile/orders, Zustand `useStorefrontAccountSession`, RHF hooks, `AccountShellLayout` / `AuthPageChrome`, demo banner.
- **Adapters**: `src/app/config/accountContracts.ts` (types), `accountMock.ts` (`AccountClient` + `mockAccountSignIn` / `SignUp` / `ForgotPassword`), `accountSession.ts` (in-memory + `sessionStorage` customer id for demo persistence only). Wired in `runtimeClients.account`. `AccountClient` in `clients.ts` is marked TODO for Medusa.
- **SEO**: All auth and account routes pass `noIndex: true` into `buildSeoMeta` so robots is `noindex,nofollow`.
- **Navigation**: Default landing CMS header includes **Account** â†’ `/account`.
- **Demo credentials**: `demo@anvl.lb` / `demo1234` (banner on sign-in). Reset password flow is UI-only (no email).

- Current static admin login must be clearly marked temporary and not production security.
- When backend exists, use secure session cookies or trusted auth provider flow.

## Backend API contracts
Auth, profile, addresses, and session token shapes for a future BFF are in `src/shared/api/contracts/auth.contract.ts`. Checkout and order history payloads live in `checkout-orders.contract.ts` (Medusa cart/order modules when integrated). See `docs/contracts/README.md`.