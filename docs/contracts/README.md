# Backend API contracts (documentation)

Typed contracts live in TypeScript under `src/shared/api/contracts/` (`@/shared/api/contracts`). This page summarizes the same surface for planning.

## Modules

| Module file | Area | Example route prefix |
|-------------|------|----------------------|
| `common.types.ts` | `ApiErrorResponse`, pagination, sort, date filters | — |
| `cms.contract.ts` | Drops, landing CMS, SEO entities | `/api/cms` |
| `products.contract.ts` | Storefront catalog + admin product CRUD/list | `/api/products` |
| `auth.contract.ts` | Register, login, refresh, password reset; account profile/addresses | `/api/auth`, `/api/account` |
| `checkout-orders.contract.ts` | Place order (guest or authenticated), order history/detail | `/api/checkout`, `/api/orders` |

## Conventions

- **List**: query types combine `OffsetPaginationQuery` (and optional domain filters) with `ListSort`.
- **Write**: `*CreateBody` is full create payload; `*UpdateBody` is patch-style partial.
- **Errors**: JSON endpoints should return `ApiErrorResponse` on failure with optional `details` for field errors.

## Medusa alignment

See `docs/backend-medusa-roadmap.md` § *Typed API contracts* for the CMS vs commerce split. Implementations should translate Medusa-native errors into `ApiErrorResponse` at the edge.
