# Frontend Architecture

## Overview

ANVL Athletics uses a **three-layer feature-based architecture** with strict module boundaries. The goal is to keep UI dumb (presentational), business logic in hooks/services, and infrastructure swappable via interface adapters.

---

## Three Layers

### Layer 1: Storefront/UI

**Lives in:** `src/routes/**`, `src/shared/components/**`, `src/features/**/components/**`

Responsibilities:
- React components (presentational and container)
- Route definitions and layouts
- Page-level orchestration
- Animation integration points

What it must NOT do:
- Directly call Supabase, Shopify, or any external API
- Contain business logic (validation, data transformation, state management)
- Import from `src/features/admin/**` (for storefront routes)

### Layer 2: Domain / Application

**Lives in:** `src/features/**/hooks/**`, `src/features/**/services/**`, `src/features/**/stores/**`, `src/features/**/schemas/**`

Responsibilities:
- Custom hooks (data fetching, state orchestration, business logic)
- Services (sync local CRUD operations)
- Zustand stores (local UI state)
- Zod schemas (validation contracts)
- Mappers and transformers

What it must NOT do:
- Render any JSX
- Directly import animation libraries (except in animation-specific hooks)
- Cross feature boundaries without going through shared abstractions

### Layer 3: Data / Runtime

**Lives in:** `src/app/config/runtime.ts`, `src/features/**/api/**`, `src/features/shopify/**`

Responsibilities:
- Adapter implementations (seed, localStorage, Supabase, Shopify)
- `createRuntimeClients({ isServer })` wiring
- HTTP clients and GraphQL clients

What it must NOT do:
- Import React
- Import any UI components
- Contain business logic that belongs in Layer 2

---

## Feature Boundaries (STRICT)

```
src/features/admin/**
  - Admin UI + mutations only
  - NEVER imported by storefront routes or marketing features at runtime
  - May be imported type-only, but prefer extracting shared types to cms/** or drops/**

src/features/cms/**
  - Storefront-safe CMS reads
  - Shared by storefront routes and marketing features
  - The bridge between admin writes and storefront reads

src/features/drops/**
  - Drop document type definitions and schemas
  - Act sequence and palette type definitions
  - No UI, no mutations

src/features/marketing/**
  - Storefront marketing UI
  - Act presets (lazy-loaded)
  - Cinematic hero system
  - Imports from cms/**, drops/**, products/**, shared/**

src/features/products/**
  - Commerce adapters and catalog
  - Product hooks (useProducts, useHomeProducts)
  - Shop UI components (ShopFiltersForm)
  - Does NOT import from admin/**

src/features/cart/**
  - Cart Zustand store
  - Cart hooks
  - Cart type definitions
  - Very thin — no external API calls

src/features/checkout/**
  - Checkout forms, schemas, config
  - Payment gateway adapter interface + mock implementations
  - No direct Supabase calls

src/features/analytics/**
  - Analytics client abstraction
  - Track* hooks
  - Mock analytics client

src/features/shopify/**
  - Shopify Storefront API client
  - Shopify product mappers
  - Shopify env validation

src/shared/**
  - Framework-agnostic primitives
  - NO imports from src/features/**
  - NO imports from src/routes/**
  - Components, hooks, lib utilities, schemas, types, brand assets

src/routes/**
  - The ONLY place that imports from both src/features/** and src/shared/**
  - Route files are thin — render feature components, not inline UI
  - Handle route loaders (SSR data fetching)
  - Handle error boundaries per route group

src/app/**
  - App-level providers and configuration
  - Error boundaries
  - Runtime client factory
  - SEO meta builder
```

---

## State Management

| State kind | Where | Why |
|---|---|---|
| Server async data (products, drops, CMS, SEO) | TanStack Query | Caching, refetch, loading/error states |
| Local UI (drawers, modals, editor drafts, preview) | Zustand | Synchronous, simple, no server round-trip |
| Form state | React Hook Form | Local, validation-native, no re-renders |
| Shareable URL state (shop filters) | TanStack Router search params | Bookmark-able, shareable, SSR-compatible |
| Cart | Zustand with localStorage persistence | Persists across sessions, no backend needed yet |

**Rules:**
- TanStack Query for anything async or server-state
- Zustand only for local UI — not a replacement for server state
- Never put API responses directly in `useState` — use TanStack Query
- URL search params for any state that should be shareable or affect SSR behavior

---

## File Naming Conventions

| Pattern | Convention |
|---|---|
| React components | `PascalCase.tsx` |
| Custom hooks | `useCamelCase.ts` |
| Route file components | `XxxRoute.tsx` or TanStack file-based naming |
| Services (sync CRUD) | `camelCase.service.ts` |
| Storage (localStorage I/O) | `camelCase.storage.ts` |
| Mappers (DTO conversion) | `camelCase.mapper.ts` |
| Commerce reads | `camelCase.commerce.ts` |
| Zod schemas | `camelCase.schema.ts` |
| Persistence schemas | `camelCase.persistence.zod.ts` |
| Zustand stores | `camelCase.store.ts` |
| Admin route-adjacent files | `-adminXxx.tsx` (dash prefix) |
| Test files | `__tests__/name.test.ts(x)` |

---

## Component Design

### Presentational components

No state, no side effects, no async. Props in, JSX out.

```tsx
type ProductCardProps = {
  product: Product
  onAddToCart: (id: string) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return <div>...</div>
}
```

### Container components (hooks-first)

Use a hook for the logic, pass everything to a presentational component.

```tsx
function ProductCardContainer({ productId }: { productId: string }) {
  const { product, addToCart, isLoading } = useProduct(productId)
  if (isLoading) return <Skeleton />
  return <ProductCard product={product} onAddToCart={addToCart} />
}
```

### Route components

Route files export a `Route` (TanStack Router), contain a loader, and render a feature component.

```tsx
export const Route = createFileRoute('/shop/$slug')({
  loader: async ({ params }) => {
    return runtimeClients.commerce.getProductBySlug(params.slug)
  },
  component: ProductDetailRoute,
})

function ProductDetailRoute() {
  const product = Route.useLoaderData()
  return <ProductDetailPage product={product} />
}
```

---

## TanStack Query Key Factory

Query keys must use a per-feature factory (object map of arrays), never bare strings:

```ts
// src/features/products/queryKeys.ts
export const productKeys = {
  all: () => ['products'] as const,
  list: () => [...productKeys.all(), 'list'] as const,
  detail: (slug: string) => [...productKeys.all(), 'detail', slug] as const,
}
```

**Never:** `useQuery({ queryKey: ['products'] })`

---

## Error Boundaries

- `AppErrorBoundary` — wraps all storefront routes (`src/app/components/AppErrorBoundary.tsx`)
- `AdminErrorBoundary` — wraps admin routes (`src/app/components/AdminErrorBoundary.tsx`)
- Route-level boundaries: TanStack Router supports `errorComponent` per route

Error handling patterns:
- Throw early for invariant violations
- Return `{ ok: false, error }` discriminated unions for expected validation failures
- Use TanStack Query error states for async errors
- Use React error boundaries for render-phase errors

---

## SSR / Hydration

### SSR-safe rules

Never access these at module top-level or during initial render:
- `window`, `document`, `localStorage`, `sessionStorage`
- `matchMedia`, `IntersectionObserver`, `ResizeObserver`
- GSAP, Lenis

Gate with:
```ts
if (typeof window !== 'undefined') {
  // client-only
}
```

Or use `useEffect`:
```tsx
useEffect(() => {
  // safe: runs only in browser
}, [])
```

### Route loaders and SSR

Route loaders run on the **server** for SSR. They must:
- Use `runtimeClients` (or the `isServer: true` adapters)
- Not access browser APIs
- `Promise.all` for parallel independent fetches
- Handle errors gracefully (return null/fallback, not throw for missing data)

### Hydration

The server renders HTML, the client hydrates. Avoid:
- Date/time values that differ between server and client
- Random values in render
- Browser-only CSS that causes layout shifts

---

## Zustand Store Patterns

```ts
// src/features/cart/store/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  lines: CartLine[]
  addLine: (line: CartLine) => void
  removeLine: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) => set((s) => ({ lines: [...s.lines, line] })),
      removeLine: (id) => set((s) => ({ lines: s.lines.filter(l => l.id !== id) })),
      clearCart: () => set({ lines: [] }),
    }),
    { name: 'anvl:cart' }
  )
)
```

Zustand stores are for **local UI only**. Do not put server state in Zustand.

---

## PremiumNav System

`PremiumNav` (`src/shared/components/layout/PremiumNav.tsx`) is the storefront navigation.

It has two phases (controlled by `usePremiumNavPhase`):
- **Cinematic phase:** transparent topbar + optional desktop side rail (when cinematic hero is active)
- **Commerce phase:** solid blurred topbar with full nav links, cart badge, mobile drawer

Phase is determined by the cinematic hero scroll position (`cinematicHeroPhase.store.ts`).

Nav content comes from `runtimeClients.siteSettings.getWebsiteLayout()` via the root loader.

---

## Code Splitting Strategy

| Chunk | Contents |
|---|---|
| `vendor-react` | `react`, `react-dom` |
| `vendor-tanstack` | All `@tanstack/*` packages |
| `vendor-gsap` | GSAP + ScrollTrigger + useGSAP |
| `vendor-lenis` | Lenis smooth scroll |
| `vendor-framer-motion` | Framer Motion |
| `vendor-zod` | Zod |
| `act-presets-<nature>` | Act presets per nature (lazy loaded) |
| Admin routes | Lazy via `lazyRouteComponent` |

Configured in `vite.config.ts` under `build.rollupOptions.output.manualChunks`.

---

## Import Rules

Valid import directions:
```
routes → features → shared → lib
routes → shared
app/config → features (for wiring only)
```

Invalid imports (fail code review):
```
shared → features        (never)
features/admin → storefront routes (never at runtime)
storefront features → features/admin (never at runtime)
```

Use `import type` (not `import`) for type-only cross-boundary imports. `verbatimModuleSyntax: true` enforces this in TypeScript.
